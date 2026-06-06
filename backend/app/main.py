from fastapi import FastAPI

from app.api.v1.router import api_router
from app.services.qdrant_service import create_collection_if_not_exists


app = FastAPI(
    title="E-commerce AI Automation Backend",
    version="0.1.0"
)


@app.on_event("startup")
def startup_event():
    create_collection_if_not_exists()


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")