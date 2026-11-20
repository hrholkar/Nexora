import threading
import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.schema import ExperimentModel, DatasetModel
from backend.app.schemas.training import TrainingConfigRequest, TrainingStatusResponse
from backend.app.ml_engine.trainer import run_fine_tuning, ACTIVE_JOBS, CANCEL_SIGNALS
import psutil

router = APIRouter(prefix="/training", tags=["Fine-Tuning Studio"])

@router.post("/start")
def start_training_job(req: TrainingConfigRequest, db: Session = Depends(get_db)):
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="ML Engine is running in lightweight cloud mode. Model training must be executed on a local ML worker with CPU/GPU."
        )

    # Validate dataset exists
    ds = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Selected dataset does not exist.")

    dataset_path = ds.split_train_path or ds.storage_path
    val_path = ds.split_val_path

    # Create Experiment record
    exp_id = str(uuid.uuid4())
    experiment = ExperimentModel(
        id=exp_id,
        name=req.experiment_name,
        base_model=req.model_name,
        dataset_id=ds.id,
        dataset_name=ds.name,
        status="QUEUED",
        config=req.dict(),
        training_duration_sec=0.0,
        current_epoch=0,
        total_epochs=req.epochs,
        current_step=0,
        total_steps=0,
        loss_history=[]
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    # Launch background training thread
    train_thread = threading.Thread(
        target=run_fine_tuning,
        kwargs={
            "experiment_id": exp_id,
            "model_name": req.model_name,
            "dataset_file_path": dataset_path,
            "val_dataset_file_path": val_path,
            "epochs": req.epochs,
            "learning_rate": req.learning_rate,
            "batch_size": req.batch_size,
            "gradient_accumulation_steps": req.gradient_accumulation_steps,
            "max_seq_length": req.max_seq_length,
            "lora_r": req.lora_r,
            "lora_alpha": req.lora_alpha,
            "lora_dropout": req.lora_dropout,
            "warmup_steps": req.warmup_steps,
            "weight_decay": req.weight_decay,
            "seed": req.seed
        },
        daemon=True
    )
    ACTIVE_JOBS[exp_id] = train_thread
    train_thread.start()

    return {
        "status": "started",
        "experiment_id": exp_id,
        "experiment_name": req.experiment_name,
        "message": f"LoRA training started for {req.model_name} on CPU/device."
    }

@router.get("/status/{id}", response_model=TrainingStatusResponse)
def get_training_status(id: str, db: Session = Depends(get_db)):
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Training experiment not found.")

    vm = psutil.virtual_memory()
    eta_sec = None
    if exp.total_steps > 0 and exp.current_step > 0 and exp.status == "RUNNING":
        steps_remaining = exp.total_steps - exp.current_step
        avg_time_per_step = exp.training_duration_sec / max(exp.current_step, 1)
        eta_sec = round(steps_remaining * avg_time_per_step, 1)

    return TrainingStatusResponse(
        experiment_id=exp.id,
        name=exp.name,
        status=exp.status,
        base_model=exp.base_model,
        current_epoch=exp.current_epoch,
        total_epochs=exp.total_epochs,
        current_step=exp.current_step,
        total_steps=exp.total_steps,
        train_loss=exp.train_loss,
        val_loss=exp.val_loss,
        elapsed_sec=exp.training_duration_sec,
        eta_sec=eta_sec,
        cpu_percent=psutil.cpu_percent(),
        ram_percent=vm.percent,
        loss_history=exp.loss_history or [],
        adapter_path=exp.adapter_path,
        error_message=exp.error_message
    )

@router.post("/cancel/{id}")
def cancel_training(id: str, db: Session = Depends(get_db)):
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    CANCEL_SIGNALS[id] = True
    exp.status = "CANCELLED"
    db.commit()

    return {"status": "cancelled", "experiment_id": id}

@router.post("/resume/{id}")
def resume_training(id: str, db: Session = Depends(get_db)):
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    if exp.status not in ["FAILED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"Cannot resume experiment with status '{exp.status}'")

    ds = db.query(DatasetModel).filter(DatasetModel.id == exp.dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Associated dataset not found.")

    dataset_path = ds.split_train_path or ds.storage_path
    val_path = ds.split_val_path
    cfg = exp.config or {}

    train_thread = threading.Thread(
        target=run_fine_tuning,
        kwargs={
            "experiment_id": exp.id,
            "model_name": exp.base_model,
            "dataset_file_path": dataset_path,
            "val_dataset_file_path": val_path,
            "epochs": cfg.get("epochs", 1),
            "learning_rate": cfg.get("learning_rate", 3e-4),
            "batch_size": cfg.get("batch_size", 1),
            "gradient_accumulation_steps": cfg.get("gradient_accumulation_steps", 4),
            "max_seq_length": cfg.get("max_seq_length", 256),
            "lora_r": cfg.get("lora_r", 8),
            "lora_alpha": cfg.get("lora_alpha", 16),
            "lora_dropout": cfg.get("lora_dropout", 0.05),
            "warmup_steps": cfg.get("warmup_steps", 2),
            "weight_decay": cfg.get("weight_decay", 0.01),
            "seed": cfg.get("seed", 42)
        },
        daemon=True
    )
    ACTIVE_JOBS[exp.id] = train_thread
    train_thread.start()

    return {"status": "resumed", "experiment_id": exp.id}
