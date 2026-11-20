import os
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.schemas.models import ModelCard, DownloadModelRequest, SelectModelRequest
from backend.app.ml_engine.model_hub import (
    get_all_models_catalog,
    download_model,
    load_model_into_memory,
    unload_active_model,
    get_loaded_model_info
)

router = APIRouter(prefix="/models", tags=["Model Hub"])

@router.get("", response_model=List[ModelCard])
def list_models():
    """Lists curated models with local download and load statuses."""
    catalog = get_all_models_catalog()
    return catalog

@router.get("/status")
def get_model_status():
    """Returns currently loaded model in memory."""
    return get_loaded_model_info()

@router.post("/download")
def download_model_endpoint(req: DownloadModelRequest, background_tasks: BackgroundTasks):
    """Downloads model weights and tokenizer from Hugging Face."""
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(status_code=400, detail="ML Engine is running in lightweight cloud mode. Model downloads must be executed on a local ML worker.")
    
    try:
        res = download_model(req.model_name)
        return {"status": "success", "message": f"Model {req.model_name} downloaded successfully.", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download model: {str(e)}")

@router.post("/select")
def select_and_load_model(req: SelectModelRequest):
    """Loads model and tokenizer into memory on CPU or CUDA."""
    if not settings.ML_ENGINE_ENABLED:
        raise HTTPException(status_code=400, detail="ML Engine is running in lightweight cloud mode. Large LLMs cannot be loaded into memory on Render Free.")
        
    try:
        res = load_model_into_memory(req.model_name)
        return {"status": "success", "message": f"Model {req.model_name} loaded successfully.", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model into memory: {str(e)}")

@router.post("/unload")
def unload_model():
    """Unloads active model to free system RAM."""
    res = unload_active_model()
    return res
