from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.ml_engine.hardware import get_hardware_info
from backend.app.ml_engine.model_hub import get_loaded_model_info

router = APIRouter(tags=["System & Health"])

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    loaded_info = get_loaded_model_info()
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "tagline": settings.APP_TAGLINE,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database_connected": db_connected,
        "ml_engine_enabled": settings.ML_ENGINE_ENABLED,
        "active_model": loaded_info.get("model_name"),
        "model_loaded": loaded_info.get("is_loaded", False),
        "device": loaded_info.get("device", "cpu")
    }

@router.get("/system/hardware")
def get_system_hardware():
    return get_hardware_info()
