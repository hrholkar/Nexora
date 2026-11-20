from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ExperimentSummary(BaseModel):
    id: str
    name: str
    base_model: str
    dataset_name: Optional[str] = None
    status: str
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    training_duration_sec: float
    current_epoch: int
    total_epochs: int
    current_step: int
    total_steps: int
    adapter_path: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ExperimentDetail(ExperimentSummary):
    config: Dict[str, Any] = {}
    loss_history: List[Dict[str, Any]] = []
    evaluation_metrics: Dict[str, Any] = {}
    error_message: Optional[str] = None

class CompareExperimentsRequest(BaseModel):
    experiment_ids: List[str]
