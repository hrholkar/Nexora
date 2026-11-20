import os
import json
import csv
import io
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.schema import DatasetModel
from backend.app.schemas.datasets import DatasetMetadata, DatasetPreview, PreprocessRequest, SplitRequest

router = APIRouter(prefix="/datasets", tags=["Dataset Studio"])

def parse_file_records(file_path: str, file_format: str) -> List[Dict[str, Any]]:
    records = []
    if file_format == "jsonl":
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    records.append(json.loads(line))
    elif file_format == "json":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = data if isinstance(data, list) else [data]
    elif file_format == "csv":
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            records = [dict(row) for row in reader]
    return records

@router.post("/upload", response_model=DatasetMetadata)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename or "dataset.jsonl"
    ext = filename.split(".")[-1].lower()
    if ext not in ["csv", "json", "jsonl"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv, .json, or .jsonl")

    dataset_id = str(uuid.uuid4())
    save_filename = f"{dataset_id}_{filename}"
    save_path = os.path.join(settings.DATASET_DIR, save_filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

    with open(save_path, "wb") as f:
        f.write(content)

    # Parse initial records to extract columns and count
    try:
        records = parse_file_records(save_path, ext)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    sample_count = len(records)
    column_names = list(records[0].keys()) if records else []

    ds_record = DatasetModel(
        id=dataset_id,
        name=filename.rsplit(".", 1)[0],
        filename=filename,
        file_format=ext,
        sample_count=sample_count,
        column_names=column_names,
        has_validation_errors=False,
        validation_summary={
            "total_rows": sample_count,
            "columns": column_names,
            "detected_format": "instruction" if "instruction" in column_names else ("chat" if "messages" in column_names else "raw")
        },
        storage_path=save_path
    )
    db.add(ds_record)
    db.commit()
    db.refresh(ds_record)

    return DatasetMetadata(
        id=ds_record.id,
        name=ds_record.name,
        filename=ds_record.filename,
        file_format=ds_record.file_format,
        sample_count=ds_record.sample_count,
        column_names=ds_record.column_names,
        has_validation_errors=ds_record.has_validation_errors,
        validation_summary=ds_record.validation_summary or {},
        storage_path=ds_record.storage_path,
        created_at=ds_record.created_at
    )

@router.get("", response_model=List[DatasetMetadata])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).all()
    return [
        DatasetMetadata(
            id=d.id,
            name=d.name,
            filename=d.filename,
            file_format=d.file_format,
            sample_count=d.sample_count,
            column_names=d.column_names or [],
            has_validation_errors=d.has_validation_errors,
            validation_summary=d.validation_summary or {},
            storage_path=d.storage_path,
            split_train_path=d.split_train_path,
            split_val_path=d.split_val_path,
            created_at=d.created_at
        )
        for d in datasets
    ]

@router.get("/{id}")
def get_dataset(id: str, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = parse_file_records(ds.storage_path, ds.file_format)
    preview_rows = records[:20]

    return {
        "metadata": DatasetMetadata(
            id=ds.id,
            name=ds.name,
            filename=ds.filename,
            file_format=ds.file_format,
            sample_count=ds.sample_count,
            column_names=ds.column_names or [],
            has_validation_errors=ds.has_validation_errors,
            validation_summary=ds.validation_summary or {},
            storage_path=ds.storage_path,
            split_train_path=ds.split_train_path,
            split_val_path=ds.split_val_path,
            created_at=ds.created_at
        ),
        "preview": DatasetPreview(
            columns=ds.column_names or [],
            rows=preview_rows,
            total_samples=len(records)
        )
    }

@router.post("/{id}/validate")
def validate_dataset(id: str, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = parse_file_records(ds.storage_path, ds.file_format)
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    empty_fields_count = 0
    validation_issues = []
    seen = set()

    for idx, r in enumerate(records):
        str_repr = json.dumps(r, sort_keys=True)
        if str_repr in seen:
            duplicate_count += 1
        seen.add(str_repr)

        # Check instruction format
        if "instruction" in r:
            instr = str(r.get("instruction", "")).strip()
            out = str(r.get("output", "")).strip()
            if not instr or not out:
                empty_fields_count += 1
                validation_issues.append({"row": idx, "reason": "Empty instruction or output field"})
                invalid_count += 1
            else:
                valid_count += 1
        # Check messages format
        elif "messages" in r and isinstance(r["messages"], list):
            msgs = r["messages"]
            if len(msgs) < 2:
                validation_issues.append({"row": idx, "reason": "Conversational record requires at least 2 messages"})
                invalid_count += 1
            else:
                valid_count += 1
        else:
            validation_issues.append({"row": idx, "reason": "Missing required fields ('instruction'+'output' or 'messages')"})
            invalid_count += 1

    has_errors = invalid_count > 0 or duplicate_count > 0
    summary = {
        "total_samples": len(records),
        "valid_samples": valid_count,
        "invalid_samples": invalid_count,
        "duplicates": duplicate_count,
        "empty_fields": empty_fields_count,
        "format": "instruction" if "instruction" in (ds.column_names or []) else ("chat" if "messages" in (ds.column_names or []) else "unknown"),
        "issues_sample": validation_issues[:10]
    }

    ds.has_validation_errors = has_errors
    ds.validation_summary = summary
    db.commit()

    return summary

@router.post("/{id}/preprocess")
def preprocess_dataset(id: str, req: PreprocessRequest, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = parse_file_records(ds.storage_path, ds.file_format)
    processed = []
    seen = set()

    for r in records:
        # Standardize instruction/input/output
        if req.format_type == "instruction":
            instr = r.get("instruction") or r.get("prompt") or r.get("question") or ""
            inp = r.get("input") or r.get("context") or ""
            out = r.get("output") or r.get("response") or r.get("answer") or ""

            if req.drop_empty and (not str(instr).strip() or not str(out).strip()):
                continue

            entry = {"instruction": str(instr).strip(), "input": str(inp).strip(), "output": str(out).strip()}
        else:
            # Chat format
            msgs = r.get("messages", [])
            if not msgs:
                continue
            entry = {"messages": msgs}

        str_repr = json.dumps(entry, sort_keys=True)
        if req.remove_duplicates and str_repr in seen:
            continue
        seen.add(str_repr)
        processed.append(entry)

    # Save processed file
    processed_path = os.path.join(settings.DATASET_DIR, f"clean_{ds.id}.jsonl")
    with open(processed_path, "w", encoding="utf-8") as f:
        for p in processed:
            f.write(json.dumps(p) + "\n")

    ds.storage_path = processed_path
    ds.file_format = "jsonl"
    ds.sample_count = len(processed)
    ds.column_names = ["instruction", "input", "output"] if req.format_type == "instruction" else ["messages"]
    ds.has_validation_errors = False
    ds.validation_summary = {
        "status": "preprocessed",
        "total_samples": len(processed),
        "removed_duplicates": len(records) - len(processed)
    }
    db.commit()

    return {
        "status": "success",
        "processed_samples": len(processed),
        "storage_path": processed_path
    }

@router.post("/{id}/split")
def split_dataset(id: str, req: SplitRequest, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = parse_file_records(ds.storage_path, ds.file_format)
    if len(records) < 2:
        raise HTTPException(status_code=400, detail="Dataset must contain at least 2 samples to split.")

    import random
    rng = random.Random(req.seed)
    shuffled = list(records)
    rng.shuffle(shuffled)

    split_idx = max(1, int(len(shuffled) * req.train_ratio))
    train_records = shuffled[:split_idx]
    val_records = shuffled[split_idx:] if split_idx < len(shuffled) else shuffled[:1]

    train_path = os.path.join(settings.DATASET_DIR, f"train_{ds.id}.jsonl")
    val_path = os.path.join(settings.DATASET_DIR, f"val_{ds.id}.jsonl")

    with open(train_path, "w", encoding="utf-8") as f:
        for r in train_records:
            f.write(json.dumps(r) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for r in val_records:
            f.write(json.dumps(r) + "\n")

    ds.split_train_path = train_path
    ds.split_val_path = val_path
    db.commit()

    return {
        "status": "success",
        "train_samples": len(train_records),
        "val_samples": len(val_records),
        "train_path": train_path,
        "val_path": val_path
    }

@router.post("/seed-samples")
def seed_sample_datasets(db: Session = Depends(get_db)):
    """Provisions built-in academic sample datasets for instant testing."""
    samples_created = []
    
    # 1. Reasoning & Logic Sample
    reasoning_data = [
        {"instruction": "Solve for x: 3x + 9 = 24", "input": "", "output": "To solve for x:\n1. Subtract 9 from both sides: 3x = 15\n2. Divide both sides by 3: x = 5."},
        {"instruction": "Explain the difference between a list and a tuple in Python.", "input": "", "output": "In Python, a list is mutable (can be modified after creation), declared using brackets []. A tuple is immutable (cannot be modified), declared using parentheses ()."},
        {"instruction": "What is the primary function of mitochondria in eukaryotic cells?", "input": "", "output": "Mitochondria produce ATP (adenosine triphosphate) through cellular respiration, supplying energy for cellular activities."},
        {"instruction": "Summarize Newton's First Law of Motion.", "input": "", "output": "Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion at a constant velocity, unless acted upon by a net external force."},
        {"instruction": "Write a Python function to check if a word is a palindrome.", "input": "", "output": "def is_palindrome(word: str) -> bool:\n    cleaned = word.lower().replace(' ', '')\n    return cleaned == cleaned[::-1]"}
    ]
    
    # Check if already seeded
    existing = db.query(DatasetModel).filter(DatasetModel.name == "Academic-Reasoning-Sample").first()
    if not existing:
        d_id = "sample-academic-reasoning"
        d_path = os.path.join(settings.DATASET_DIR, f"{d_id}.jsonl")
        with open(d_path, "w", encoding="utf-8") as f:
            for s in reasoning_data:
                f.write(json.dumps(s) + "\n")
        ds = DatasetModel(
            id=d_id,
            name="Academic-Reasoning-Sample",
            filename="academic_reasoning.jsonl",
            file_format="jsonl",
            sample_count=len(reasoning_data),
            column_names=["instruction", "input", "output"],
            has_validation_errors=False,
            validation_summary={"total_samples": len(reasoning_data), "valid_samples": len(reasoning_data)},
            storage_path=d_path,
            split_train_path=d_path,
            split_val_path=d_path
        )
        db.add(ds)
        samples_created.append("Academic-Reasoning-Sample")

    # 2. Coding Q&A Sample
    coding_data = [
        {"instruction": "Write a Python snippet to read a JSON file safely.", "input": "", "output": "import json\nwith open('data.json', 'r', encoding='utf-8') as f:\n    data = json.load(f)"},
        {"instruction": "How do you calculate cross-entropy loss in PyTorch?", "input": "", "output": "import torch.nn as nn\nloss_fn = nn.CrossEntropyLoss()\nloss = loss_fn(predictions, targets)"},
        {"instruction": "Explain Low-Rank Adaptation (LoRA) for LLMs.", "input": "", "output": "LoRA freezes pretrained weights and injects trainable rank decomposition matrices (A and B where Delta W = B * A) into attention layers, drastically reducing trainable parameters and memory."},
        {"instruction": "What is gradient accumulation in deep learning?", "input": "", "output": "Gradient accumulation computes gradients over multiple mini-batches before executing an optimizer step, simulating a larger effective batch size under memory constraints."},
        {"instruction": "Explain perplexity in language modeling.", "input": "", "output": "Perplexity is the exponentiated average cross-entropy loss per token (exp(loss)). A lower perplexity indicates the model assigns higher probability to ground truth sequences."}
    ]
    existing_code = db.query(DatasetModel).filter(DatasetModel.name == "LLM-Engineering-Sample").first()
    if not existing_code:
        d_id = "sample-llm-engineering"
        d_path = os.path.join(settings.DATASET_DIR, f"{d_id}.jsonl")
        with open(d_path, "w", encoding="utf-8") as f:
            for s in coding_data:
                f.write(json.dumps(s) + "\n")
        ds = DatasetModel(
            id=d_id,
            name="LLM-Engineering-Sample",
            filename="llm_engineering.jsonl",
            file_format="jsonl",
            sample_count=len(coding_data),
            column_names=["instruction", "input", "output"],
            has_validation_errors=False,
            validation_summary={"total_samples": len(coding_data), "valid_samples": len(coding_data)},
            storage_path=d_path,
            split_train_path=d_path,
            split_val_path=d_path
        )
        db.add(ds)
        samples_created.append("LLM-Engineering-Sample")

    db.commit()
    return {"status": "success", "seeded": samples_created}
