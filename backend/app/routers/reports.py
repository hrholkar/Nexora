import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.schema import ExperimentModel
from backend.app.schemas.reports import GenerateReportRequest, ReportResponse
from backend.app.ml_engine.report_generator import generate_pdf_report, generate_json_report

router = APIRouter(prefix="/reports", tags=["Report Generation"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(req: GenerateReportRequest, db: Session = Depends(get_db)):
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == req.experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    exp_data = {
        "id": exp.id,
        "name": exp.name,
        "base_model": exp.base_model,
        "dataset_name": exp.dataset_name,
        "status": exp.status,
        "train_loss": exp.train_loss,
        "val_loss": exp.val_loss,
        "training_duration_sec": exp.training_duration_sec,
        "config": exp.config or {},
        "loss_history": exp.loss_history or [],
        "evaluation_metrics": exp.evaluation_metrics or {},
        "created_at": exp.created_at.isoformat() if exp.created_at else None,
        "completed_at": exp.completed_at.isoformat() if exp.completed_at else None
    }

    report_id = str(uuid.uuid4())
    if req.format.lower() == "pdf":
        filename = f"nexora_report_{exp.id[:8]}_{report_id[:6]}.pdf"
        output_path = os.path.join(settings.REPORT_DIR, filename)
        generate_pdf_report(exp_data, output_path)
    else:
        filename = f"nexora_report_{exp.id[:8]}_{report_id[:6]}.json"
        output_path = os.path.join(settings.REPORT_DIR, filename)
        generate_json_report(exp_data, output_path)

    return ReportResponse(
        report_id=report_id,
        experiment_id=exp.id,
        format=req.format.lower(),
        download_url=f"/api/reports/download/{filename}",
        created_at=datetime.utcnow().isoformat()
    )

@router.get("/download/{filename}")
def download_report_file(filename: str):
    # Prevent path traversal
    safe_name = os.path.basename(filename)
    file_path = os.path.join(settings.REPORT_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found.")

    media_type = "application/pdf" if safe_name.endswith(".pdf") else "application/json"
    return FileResponse(file_path, media_type=media_type, filename=safe_name)
