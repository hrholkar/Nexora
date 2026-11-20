import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    health,
    models,
    datasets,
    training,
    inference,
    evaluation,
    experiments,
    reports
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexora")

# Ensure all database tables exist on module load
Base.metadata.create_all(bind=engine)

def init_seed_data():
    try:
        db = SessionLocal()
        datasets.seed_sample_datasets(db)
        db.close()
        logger.info("Sample datasets initialized successfully.")
    except Exception as e:
        logger.warning(f"Note on seeding sample datasets: {e}")

# Run seed on import
init_seed_data()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema in lifespan...")
    Base.metadata.create_all(bind=engine)
    init_seed_data()
    logger.info(f"{settings.APP_NAME} backend started. ML Engine Enabled: {settings.ML_ENGINE_ENABLED}")
    yield
    logger.info(f"{settings.APP_NAME} backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    description=f"{settings.APP_TAGLINE} Open-Source LLM Development & Experimentation Platform.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
origins = settings.get_allowed_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(training.router, prefix="/api")
app.include_router(inference.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "product": settings.APP_NAME,
        "tagline": settings.APP_TAGLINE,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
