import os
import gc
import logging
from typing import Dict, Any, Optional, List
from backend.app.config import settings

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    ML_AVAILABLE = True
except ImportError:
    torch = None
    AutoTokenizer = None
    AutoModelForCausalLM = None
    ML_AVAILABLE = False

logger = logging.getLogger("nexora.ml.hub")

CURATED_MODELS: Dict[str, Dict[str, Any]] = {
    "HuggingFaceTB/SmolLM2-360M-Instruct": {
        "id": "smollm2-360m-instruct",
        "name": "SmolLM2-360M-Instruct",
        "hf_repo": "HuggingFaceTB/SmolLM2-360M-Instruct",
        "parameters": "360M",
        "architecture": "LlamaForCausalLM",
        "description": "Ultra-compact state-of-the-art instruction-tuned model trained on high-quality synthetic data and Cosmopedia v2. Excellent for local CPU fine-tuning.",
        "license": "Apache 2.0",
        "supported_tasks": ["instruction-tuning", "chat", "text-generation", "reasoning"],
        "min_ram_gb": 1.5,
        "recommended_for_cpu": True
    },
    "Qwen/Qwen2.5-0.5B-Instruct": {
        "id": "qwen2.5-0.5b-instruct",
        "name": "Qwen2.5-0.5B-Instruct",
        "hf_repo": "Qwen/Qwen2.5-0.5B-Instruct",
        "parameters": "490M",
        "architecture": "Qwen2ForCausalLM",
        "description": "Qwen2.5 compact instruction-tuned model with exceptional multilingual, reasoning, and coding capabilities.",
        "license": "Apache 2.0",
        "supported_tasks": ["instruction-tuning", "chat", "code-generation", "multilingual"],
        "min_ram_gb": 2.0,
        "recommended_for_cpu": True
    },
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0": {
        "id": "tinyllama-1.1b-chat",
        "name": "TinyLlama-1.1B-Chat",
        "hf_repo": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "parameters": "1.1B",
        "architecture": "LlamaForCausalLM",
        "description": "The classic open-source 1.1B chat model pretrained on 3 trillion tokens. Great balance between size and conversational capability.",
        "license": "Apache 2.0",
        "supported_tasks": ["chat", "instruction-tuning", "conversational"],
        "min_ram_gb": 3.5,
        "recommended_for_cpu": False
    },
    "distilbert/distilgpt2": {
        "id": "distilgpt2",
        "name": "DistilGPT2",
        "hf_repo": "distilbert/distilgpt2",
        "parameters": "82M",
        "architecture": "GPT2LMHeadModel",
        "description": "Lightweight, distilled version of GPT-2. Super fast on CPU, ideal for rapid prototyping, unit tests, and minimal resource environments.",
        "license": "Apache 2.0",
        "supported_tasks": ["text-generation", "language-modeling"],
        "min_ram_gb": 0.8,
        "recommended_for_cpu": True
    }
}

# Global memory holder for active model and tokenizer
ACTIVE_MODEL_CONTAINER: Dict[str, Any] = {
    "model_name": None,
    "model": None,
    "tokenizer": None,
    "device": "cpu"
}

def get_model_path(hf_repo: str) -> str:
    safe_name = hf_repo.replace("/", "--")
    return os.path.join(settings.MODEL_CACHE_DIR, safe_name)

def is_model_downloaded(hf_repo: str) -> bool:
    path = get_model_path(hf_repo)
    if not os.path.exists(path):
        return False
    # Check for config.json or model weights
    has_config = os.path.exists(os.path.join(path, "config.json"))
    return has_config

def get_all_models_catalog() -> List[Dict[str, Any]]:
    catalog = []
    active_name = ACTIVE_MODEL_CONTAINER.get("model_name")
    for repo, meta in CURATED_MODELS.items():
        downloaded = is_model_downloaded(repo)
        loaded = (active_name == repo or active_name == meta["name"])
        entry = dict(meta)
        entry["is_downloaded"] = downloaded
        entry["is_loaded"] = loaded
        entry["local_path"] = get_model_path(repo) if downloaded else None
        catalog.append(entry)
    return catalog

def download_model(repo_or_name: str) -> Dict[str, Any]:
    if not ML_AVAILABLE:
        raise RuntimeError("Machine learning libraries (torch, transformers) are not installed in this environment.")
    # Match by key or name
    target_repo = repo_or_name
    for repo, meta in CURATED_MODELS.items():
        if repo == repo_or_name or meta["name"] == repo_or_name:
            target_repo = repo
            break
    
    local_dir = get_model_path(target_repo)
    os.makedirs(local_dir, exist_ok=True)
    
    logger.info(f"Downloading model {target_repo} to {local_dir}...")
    tokenizer = AutoTokenizer.from_pretrained(target_repo, cache_dir=local_dir)
    tokenizer.save_pretrained(local_dir)
    
    model = AutoModelForCausalLM.from_pretrained(target_repo, cache_dir=local_dir, low_cpu_mem_usage=True)
    model.save_pretrained(local_dir)
    
    logger.info(f"Successfully downloaded {target_repo}")
    return {
        "status": "success",
        "repo": target_repo,
        "local_path": local_dir
    }

def load_model_into_memory(repo_or_name: str) -> Dict[str, Any]:
    if not ML_AVAILABLE:
        raise RuntimeError("Machine learning libraries (torch, transformers) are not installed in this environment.")
    global ACTIVE_MODEL_CONTAINER
    target_repo = repo_or_name
    for repo, meta in CURATED_MODELS.items():
        if repo == repo_or_name or meta["name"] == repo_or_name:
            target_repo = repo
            break

    # Unload previous model if any
    if ACTIVE_MODEL_CONTAINER["model"] is not None:
        unload_active_model()

    local_dir = get_model_path(target_repo)
    source = local_dir if is_model_downloaded(target_repo) else target_repo
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Loading {target_repo} onto {device}...")
    
    tokenizer = AutoTokenizer.from_pretrained(source)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        
    model = AutoModelForCausalLM.from_pretrained(
        source,
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True
    ).to(device)
    model.eval()

    ACTIVE_MODEL_CONTAINER = {
        "model_name": target_repo,
        "model": model,
        "tokenizer": tokenizer,
        "device": device
    }
    return {
        "status": "loaded",
        "model_name": target_repo,
        "device": device
    }

def unload_active_model() -> Dict[str, Any]:
    global ACTIVE_MODEL_CONTAINER
    old_name = ACTIVE_MODEL_CONTAINER.get("model_name")
    ACTIVE_MODEL_CONTAINER["model"] = None
    ACTIVE_MODEL_CONTAINER["tokenizer"] = None
    ACTIVE_MODEL_CONTAINER["model_name"] = None
    
    gc.collect()
    if torch is not None and hasattr(torch, "cuda") and torch.cuda.is_available():
        torch.cuda.empty_cache()
        
    return {"status": "unloaded", "previous_model": old_name}

def get_loaded_model_info() -> Dict[str, Any]:
    return {
        "model_name": ACTIVE_MODEL_CONTAINER.get("model_name"),
        "is_loaded": ACTIVE_MODEL_CONTAINER["model"] is not None,
        "device": ACTIVE_MODEL_CONTAINER["device"]
    }
