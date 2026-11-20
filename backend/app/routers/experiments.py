import os
import shutil
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schema import ExperimentModel
from backend.app.schemas.experiments import ExperimentSummary, ExperimentDetail, CompareExperimentsRequest

router = APIRouter(prefix="/experiments", tags=["Experiment Management"])

@router.get("", response_model=List[ExperimentSummary])
def list_experiments(db: Session = Depends(get_db)):
    experiments = db.query(ExperimentModel).order_by(ExperimentModel.created_at.desc()).all()
    return [
        ExperimentSummary(
            id=e.id,
            name=e.name,
            base_model=e.base_model,
            dataset_name=e.dataset_name,
            status=e.status,
            train_loss=e.train_loss,
            val_loss=e.val_loss,
            training_duration_sec=e.training_duration_sec,
            current_epoch=e.current_epoch,
            total_epochs=e.total_epochs,
            current_step=e.current_step,
            total_steps=e.total_steps,
            adapter_path=e.adapter_path,
            created_at=e.created_at,
            completed_at=e.completed_at
        )
        for e in experiments
    ]

@router.get("/{id}", response_model=ExperimentDetail)
def get_experiment_detail(id: str, db: Session = Depends(get_db)):
    e = db.query(ExperimentModel).filter(ExperimentModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    return ExperimentDetail(
        id=e.id,
        name=e.name,
        base_model=e.base_model,
        dataset_name=e.dataset_name,
        status=e.status,
        train_loss=e.train_loss,
        val_loss=e.val_loss,
        training_duration_sec=e.training_duration_sec,
        current_epoch=e.current_epoch,
        total_epochs=e.total_epochs,
        current_step=e.current_step,
        total_steps=e.total_steps,
        adapter_path=e.adapter_path,
        config=e.config or {},
        loss_history=e.loss_history or [],
        evaluation_metrics=e.evaluation_metrics or {},
        error_message=e.error_message,
        created_at=e.created_at,
        completed_at=e.completed_at
    )

@router.delete("/{id}")
def delete_experiment(id: str, db: Session = Depends(get_db)):
    e = db.query(ExperimentModel).filter(ExperimentModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    # Remove adapter directory if exists
    if e.adapter_path and os.path.exists(e.adapter_path):
        try:
            shutil.rmtree(e.adapter_path)
        except Exception:
            pass

    db.delete(e)
    db.commit()
    return {"status": "deleted", "experiment_id": id}

@router.post("/compare")
def compare_experiments(req: CompareExperimentsRequest, db: Session = Depends(get_db)):
    experiments = db.query(ExperimentModel).filter(ExperimentModel.id.in_(req.experiment_ids)).all()
    comparison_data = []
    for exp in experiments:
        comparison_data.append({
            "id": exp.id,
            "name": exp.name,
            "base_model": exp.base_model,
            "status": exp.status,
            "train_loss": exp.train_loss,
            "val_loss": exp.val_loss,
            "duration_sec": exp.training_duration_sec,
            "config": exp.config or {},
            "evaluation_metrics": exp.evaluation_metrics or {},
            "epochs": exp.total_epochs,
            "steps": exp.total_steps
        })
    return {"experiments": comparison_data}
