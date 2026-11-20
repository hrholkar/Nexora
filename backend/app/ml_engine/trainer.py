import os
import json
import time
import math
import logging
import threading
import datetime
import psutil
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import AutoModelForCausalLM, AutoTokenizer, get_linear_schedule_with_warmup
from peft import LoraConfig, get_peft_model, TaskType
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.models.schema import ExperimentModel
from backend.app.ml_engine.model_hub import get_model_path, is_model_downloaded, CURATED_MODELS

logger = logging.getLogger("nexora.ml.trainer")

# Global tracking for active training jobs and cancellation signals
ACTIVE_JOBS = {}
CANCEL_SIGNALS = {}

class TextInstructDataset(Dataset):
    def __init__(self, samples, tokenizer, max_length=256):
        self.encodings = []
        for sample in samples:
            # Handle instruction format
            if "instruction" in sample and "output" in sample:
                instr = sample.get("instruction", "")
                inp = sample.get("input", "")
                out = sample.get("output", "")
                prompt_text = f"Instruction: {instr}\nInput: {inp}\nOutput: " if inp else f"Instruction: {instr}\nOutput: "
                full_text = prompt_text + out
            # Handle messages format
            elif "messages" in sample:
                messages = sample.get("messages", [])
                full_text = ""
                for msg in messages:
                    role = msg.get("role", "user").capitalize()
                    content = msg.get("content", "")
                    full_text += f"{role}: {content}\n"
            else:
                # Fallback to single text
                full_text = str(list(sample.values())[0]) if sample else ""

            if not full_text.strip():
                continue

            encoded = tokenizer(
                full_text,
                truncation=True,
                max_length=max_length,
                padding="max_length",
                return_tensors="pt"
            )
            # Mask labels for cross entropy loss
            input_ids = encoded["input_ids"].squeeze(0)
            attention_mask = encoded["attention_mask"].squeeze(0)
            labels = input_ids.clone()
            labels[attention_mask == 0] = -100

            self.encodings.append({
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "labels": labels
            })

    def __len__(self):
        return len(self.encodings)

    def __getitem__(self, idx):
        return self.encodings[idx]

def get_target_modules_for_model(model) -> list:
    """Dynamically determines the linear attention projection modules for LoRA."""
    module_names = set()
    for name, module in model.named_modules():
        if isinstance(module, torch.nn.Linear):
            parts = name.split(".")
            module_names.add(parts[-1])

    # Target attention projections
    candidates = ["q_proj", "v_proj", "k_proj", "o_proj", "c_attn", "c_proj", "dense"]
    selected = [c for c in candidates if c in module_names]
    if not selected:
        # Default fallback
        if "c_attn" in module_names:
            return ["c_attn"]
        return ["q_proj", "v_proj"]
    return selected

def run_fine_tuning(
    experiment_id: str,
    model_name: str,
    dataset_file_path: str,
    val_dataset_file_path: str = None,
    epochs: int = 1,
    learning_rate: float = 3e-4,
    batch_size: int = 1,
    gradient_accumulation_steps: int = 4,
    max_seq_length: int = 256,
    lora_r: int = 8,
    lora_alpha: int = 16,
    lora_dropout: float = 0.05,
    warmup_steps: int = 2,
    weight_decay: float = 0.01,
    seed: int = 42
):
    """Executes genuine LoRA fine-tuning on CPU (or CUDA if present) in background thread."""
    torch.manual_seed(seed)
    db = SessionLocal()
    experiment = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
    if not experiment:
        db.close()
        return

    CANCEL_SIGNALS[experiment_id] = False
    start_time = time.time()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    try:
        experiment.status = "RUNNING"
        db.commit()

        # 1. Resolve model source
        target_repo = model_name
        for repo, meta in CURATED_MODELS.items():
            if repo == model_name or meta["name"] == model_name:
                target_repo = repo
                break

        local_dir = get_model_path(target_repo)
        model_source = local_dir if is_model_downloaded(target_repo) else target_repo

        logger.info(f"Loading base model {target_repo} for training on {device}...")
        tokenizer = AutoTokenizer.from_pretrained(model_source)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        base_model = AutoModelForCausalLM.from_pretrained(
            model_source,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        ).to(device)

        # 2. Configure PEFT LoRA
        target_modules = get_target_modules_for_model(base_model)
        logger.info(f"Configuring LoRA with target modules: {target_modules}, r={lora_r}, alpha={lora_alpha}")

        lora_config = LoraConfig(
            r=lora_r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            target_modules=target_modules
        )

        model = get_peft_model(base_model, lora_config)
        model.print_trainable_parameters()

        # 3. Load dataset
        with open(dataset_file_path, "r", encoding="utf-8") as f:
            if dataset_file_path.endswith(".jsonl"):
                raw_train_samples = [json.loads(line) for line in f if line.strip()]
            else:
                raw_train_samples = json.load(f)

        train_dataset = TextInstructDataset(raw_train_samples, tokenizer, max_length=max_seq_length)
        if len(train_dataset) == 0:
            raise ValueError("Processed dataset contains 0 valid training samples.")

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

        # Validation dataset if present
        val_loader = None
        if val_dataset_file_path and os.path.exists(val_dataset_file_path):
            with open(val_dataset_file_path, "r", encoding="utf-8") as f:
                raw_val = json.load(f) if not val_dataset_file_path.endswith(".jsonl") else [json.loads(l) for l in f if l.strip()]
                val_dataset = TextInstructDataset(raw_val, tokenizer, max_length=max_seq_length)
                if len(val_dataset) > 0:
                    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        # 4. Training loop setup
        optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
        total_steps = epochs * math.ceil(len(train_loader) / gradient_accumulation_steps)
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=warmup_steps,
            num_training_steps=max(total_steps, 1)
        )

        experiment.total_epochs = epochs
        experiment.total_steps = total_steps
        db.commit()

        loss_history = []
        global_step = 0
        model.train()

        for epoch in range(1, epochs + 1):
            if CANCEL_SIGNALS.get(experiment_id):
                experiment.status = "CANCELLED"
                db.commit()
                return

            accumulated_loss = 0.0
            optimizer.zero_grad()

            for batch_idx, batch in enumerate(train_loader):
                if CANCEL_SIGNALS.get(experiment_id):
                    experiment.status = "CANCELLED"
                    db.commit()
                    return

                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                loss = outputs.loss / gradient_accumulation_steps
                loss.backward()

                accumulated_loss += loss.item() * gradient_accumulation_steps

                if (batch_idx + 1) % gradient_accumulation_steps == 0 or (batch_idx + 1) == len(train_loader):
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()
                    scheduler.step()
                    optimizer.zero_grad()
                    global_step += 1

                    vm = psutil.virtual_memory()
                    step_loss = round(accumulated_loss / gradient_accumulation_steps, 4)
                    accumulated_loss = 0.0

                    # Optional validation loss
                    current_val_loss = None
                    if val_loader:
                        model.eval()
                        with torch.no_grad():
                            val_batch = next(iter(val_loader))
                            v_out = model(
                                input_ids=val_batch["input_ids"].to(device),
                                attention_mask=val_batch["attention_mask"].to(device),
                                labels=val_batch["labels"].to(device)
                            )
                            current_val_loss = round(float(v_out.loss.item()), 4)
                        model.train()

                    loss_step_entry = {
                        "step": global_step,
                        "epoch": epoch,
                        "loss": step_loss,
                        "val_loss": current_val_loss,
                        "cpu_percent": psutil.cpu_percent(),
                        "ram_percent": vm.percent,
                        "elapsed_sec": round(time.time() - start_time, 1)
                    }
                    loss_history.append(loss_step_entry)

                    # Update DB tracking
                    experiment.current_step = global_step
                    experiment.current_epoch = epoch
                    experiment.train_loss = step_loss
                    experiment.val_loss = current_val_loss
                    experiment.loss_history = loss_history
                    experiment.training_duration_sec = round(time.time() - start_time, 1)
                    db.commit()

        # 5. Save LoRA adapter
        adapter_output_dir = os.path.join(settings.ADAPTER_DIR, experiment_id)
        os.makedirs(adapter_output_dir, exist_ok=True)
        model.save_pretrained(adapter_output_dir)
        tokenizer.save_pretrained(adapter_output_dir)

        # Save metadata info in adapter folder
        with open(os.path.join(adapter_output_dir, "nexora_training_meta.json"), "w") as f:
            json.dump({
                "experiment_id": experiment_id,
                "base_model": target_repo,
                "epochs": epochs,
                "final_train_loss": experiment.train_loss,
                "final_val_loss": experiment.val_loss,
                "training_duration_sec": experiment.training_duration_sec,
                "lora_r": lora_r,
                "lora_alpha": lora_alpha
            }, f, indent=2)

        experiment.status = "COMPLETED"
        experiment.adapter_path = adapter_output_dir
        experiment.completed_at = datetime.datetime.utcnow()
        db.commit()
        logger.info(f"LoRA fine-tuning completed successfully for experiment {experiment_id}!")

    except Exception as e:
        logger.error(f"Training failed: {str(e)}", exc_info=True)
        experiment.status = "FAILED"
        experiment.error_message = str(e)
        db.commit()
    finally:
        db.close()
        if experiment_id in ACTIVE_JOBS:
            del ACTIVE_JOBS[experiment_id]
        if experiment_id in CANCEL_SIGNALS:
            del CANCEL_SIGNALS[experiment_id]
