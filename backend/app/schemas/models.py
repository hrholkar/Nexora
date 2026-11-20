from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ModelCard(BaseModel):
    id: str
    name: str
    hf_repo: str
    parameters: str
    architecture: str
    description: str
    license: str
    supported_tasks: List[str] = []
    min_ram_gb: float = 2.0
    is_downloaded: bool = False
    is_loaded: bool = False
    local_path: Optional[str] = None
    created_at: Optional[datetime] = None

class DownloadModelRequest(BaseModel):
    model_name: str

class SelectModelRequest(BaseModel):
    model_name: str
    load_in_memory: bool = True
