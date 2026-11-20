from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DatasetMetadata(BaseModel):
    id: str
    name: str
    filename: str
    file_format: str
    sample_count: int
    column_names: List[str] = []
    has_validation_errors: bool = False
    validation_summary: Dict[str, Any] = {}
    storage_path: str
    split_train_path: Optional[str] = None
    split_val_path: Optional[str] = None
    created_at: Optional[datetime] = None

class DatasetPreview(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_samples: int

class PreprocessRequest(BaseModel):
    format_type: str = "instruction" # "instruction" (instruction/input/output) or "chat" (messages)
    remove_duplicates: bool = True
    drop_empty: bool = True
    standardize_columns: bool = True

class SplitRequest(BaseModel):
    train_ratio: float = 0.8
    val_ratio: float = 0.2
    seed: int = 42
