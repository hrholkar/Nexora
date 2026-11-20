from pydantic import BaseModel
from typing import Optional, Dict, Any

class GenerateReportRequest(BaseModel):
    experiment_id: str
    format: str = "pdf" # "pdf" or "json"

class ReportResponse(BaseModel):
    report_id: str
    experiment_id: str
    format: str
    download_url: str
    created_at: str
