import os
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.schema import EvaluationRecordModel, DatasetModel, ExperimentModel
from backend.app.schemas.evaluation import EvaluationRunRequest, EvaluationResponse
from backend.app.ml_engine.evaluator import evaluate_model
from backend.app.routers.inference import resolve_adapter_path

router = APIRouter(prefix="/evaluation", tags=["Model Evaluation"])

@router.post("/run", response_model=EvaluationResponse)
def run_evaluation(req: EvaluationRunRequest, db: Session = Depends(get_db)):
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="ML Engine is offline or running in cloud mode. Evaluation requires local model inference."
        )

    ds = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Selected evaluation dataset not found.")

    eval_data_path = ds.split_val_path or ds.storage_path
    adapter_path = resolve_adapter_path(req.adapter_id, db) if req.adapter_id else None

    try:
        eval_output = evaluate_model(
            model_name=req.model_name,
            dataset_path=eval_data_path,
            adapter_path=adapter_path,
            metrics_to_compute=req.metrics,
            sample_limit=req.sample_limit
        )

        eval_id = str(uuid.uuid4())
        rec = EvaluationRecordModel(
            id=eval_id,
            experiment_id=req.experiment_id,
            model_name=req.model_name,
            adapter_id=req.adapter_id,
            dataset_name=ds.name,
            metrics=eval_output.get("metrics", {})
        )
        db.add(rec)

        # If linked to an experiment, update experiment's metrics
        if req.experiment_id:
            exp = db.query(ExperimentModel).filter(ExperimentModel.id == req.experiment_id).first()
            if exp:
                exp.evaluation_metrics = eval_output.get("metrics", {})

        db.commit()
        db.refresh(rec)

        return EvaluationResponse(
            id=rec.id,
            experiment_id=rec.experiment_id,
            model_name=rec.model_name,
            adapter_id=rec.adapter_id,
            dataset_name=rec.dataset_name,
            metrics=rec.metrics or {},
            samples_evaluated=eval_output.get("sample_count", 0),
            created_at=rec.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("", response_model=List[EvaluationResponse])
def list_evaluations(db: Session = Depends(get_db)):
    evals = db.query(EvaluationRecordModel).order_by(EvaluationRecordModel.created_at.desc()).all()
    return [
        EvaluationResponse(
            id=e.id,
            experiment_id=e.experiment_id,
            model_name=e.model_name,
            adapter_id=e.adapter_id,
            dataset_name=e.dataset_name,
            metrics=e.metrics or {},
            samples_evaluated=e.metrics.get("sample_count", 0) if isinstance(e.metrics, dict) else 0,
            created_at=e.created_at
        )
        for e in evals
    ]

@router.get("/{id}", response_model=EvaluationResponse)
def get_evaluation(id: str, db: Session = Depends(get_db)):
    e = db.query(EvaluationRecordModel).filter(EvaluationRecordModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    return EvaluationResponse(
        id=e.id,
        experiment_id=e.experiment_id,
        model_name=e.model_name,
        adapter_id=e.adapter_id,
        dataset_name=e.dataset_name,
        metrics=e.metrics or {},
        samples_evaluated=e.metrics.get("sample_count", 0) if isinstance(e.metrics, dict) else 0,
        created_at=e.created_at
    )
