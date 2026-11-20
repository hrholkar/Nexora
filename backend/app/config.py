import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "NEXORA"
    APP_TAGLINE: str = "Where Language Models Evolve."
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexora.db")
    
    # Security & CORS
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexora-academic-secret-key-development-2026")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    # Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", os.path.join(BASE_DIR, "storage"))
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", os.path.join(STORAGE_DIR, "models"))
    DATASET_DIR: str = os.getenv("DATASET_DIR", os.path.join(STORAGE_DIR, "datasets"))
    ADAPTER_DIR: str = os.getenv("ADAPTER_DIR", os.path.join(STORAGE_DIR, "adapters"))
    REPORT_DIR: str = os.getenv("REPORT_DIR", os.path.join(STORAGE_DIR, "reports"))
    
    # Execution mode: "local" (runs genuine local ML engine) or "cloud" (Render lightweight mode)
    ML_ENGINE_ENABLED: bool = os.getenv("ML_ENGINE_ENABLED", "true").lower() in ("true", "1", "yes")
    
    # File limits
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    
    def get_allowed_origins_list(self) -> List[str]:
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure storage directories exist
for path in [settings.STORAGE_DIR, settings.MODEL_CACHE_DIR, settings.DATASET_DIR, settings.ADAPTER_DIR, settings.REPORT_DIR]:
    os.makedirs(path, exist_ok=True)
