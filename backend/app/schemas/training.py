from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TrainingConfigRequest(BaseModel):
    model_name: str
    dataset_id: str
    experiment_name: str
    epochs: int = Field(default=1, ge=1, le=10)
    learning_rate: float = Field(default=3e-4, gt=0)
    batch_size: int = Field(default=1, ge=1, le=16)
    gradient_accumulation_steps: int = Field(default=4, ge=1, le=32)
    max_seq_length: int = Field(default=256, ge=32, le=2048)
    lora_r: int = Field(default=8, ge=1, le=64)
    lora_alpha: int = Field(default=16, ge=1, le=128)
    lora_dropout: float = Field(default=0.05, ge=0.0, le=0.5)
    warmup_steps: int = Field(default=2, ge=0)
    weight_decay: float = Field(default=0.01, ge=0.0)
    seed: int = 42

class LossStep(BaseModel):
    step: int
    epoch: int
    loss: float
    val_loss: Optional[float] = None
    cpu_percent: Optional[float] = None
    ram_percent: Optional[float] = None
    timestamp: Optional[str] = None

class TrainingStatusResponse(BaseModel):
    experiment_id: str
    name: str
    status: str # QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    base_model: str
    current_epoch: int
    total_epochs: int
    current_step: int
    total_steps: int
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    elapsed_sec: float = 0.0
    eta_sec: Optional[float] = None
    cpu_percent: float = 0.0
    ram_percent: float = 0.0
    loss_history: List[Dict[str, Any]] = []
    adapter_path: Optional[str] = None
    error_message: Optional[str] = None
