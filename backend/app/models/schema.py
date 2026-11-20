import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ModelCatalog(Base):
    __tablename__ = "model_catalog"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False, unique=True)
    hf_repo = Column(String(256), nullable=False)
    parameters = Column(String(64), nullable=False)
    architecture = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    license = Column(String(64), nullable=False)
    supported_tasks = Column(JSON, default=list) # e.g. ["chat", "instruction-tuning", "text-generation"]
    min_ram_gb = Column(Float, default=2.0)
    is_downloaded = Column(Boolean, default=False)
    is_loaded = Column(Boolean, default=False)
    local_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    filename = Column(String(256), nullable=False)
    file_format = Column(String(32), nullable=False) # csv, json, jsonl
    sample_count = Column(Integer, default=0)
    column_names = Column(JSON, default=list)
    has_validation_errors = Column(Boolean, default=False)
    validation_summary = Column(JSON, default=dict)
    storage_path = Column(String(512), nullable=False)
    split_train_path = Column(String(512), nullable=True)
    split_val_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExperimentModel(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    base_model = Column(String(128), nullable=False)
    dataset_id = Column(String(64), nullable=True)
    dataset_name = Column(String(128), nullable=True)
    status = Column(String(32), default="QUEUED") # QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    config = Column(JSON, default=dict)
    training_duration_sec = Column(Float, default=0.0)
    current_epoch = Column(Integer, default=0)
    total_epochs = Column(Integer, default=1)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    train_loss = Column(Float, nullable=True)
    val_loss = Column(Float, nullable=True)
    loss_history = Column(JSON, default=list) # [{step, epoch, loss, val_loss, timestamp}]
    adapter_path = Column(String(512), nullable=True)
    evaluation_metrics = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class EvaluationRecordModel(Base):
    __tablename__ = "evaluations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(64), nullable=True)
    model_name = Column(String(128), nullable=False)
    adapter_id = Column(String(64), nullable=True)
    dataset_name = Column(String(128), nullable=False)
    metrics = Column(JSON, default=dict) # {"perplexity": ..., "bleu": ..., "rouge1": ...}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
