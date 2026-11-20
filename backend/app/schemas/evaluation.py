from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class EvaluationRunRequest(BaseModel):
    experiment_id: Optional[str] = None
    model_name: str
    adapter_id: Optional[str] = None
    dataset_id: str
    metrics: List[str] = ["perplexity", "bleu", "rouge", "exact_match"]
    sample_limit: int = 15

class EvaluationResponse(BaseModel):
    id: str
    experiment_id: Optional[str] = None
    model_name: str
    adapter_id: Optional[str] = None
    dataset_name: str
    metrics: Dict[str, Any]
    samples_evaluated: int
    created_at: Optional[datetime] = None
