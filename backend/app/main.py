from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1 import auth
from app.api.v1 import multimodal
from app.api.v1 import vision
from app.database import Base, engine, test_db_connection
from app.models.user import User
from app.services.qdrant_service import create_collection_if_not_exists


app = FastAPI(
    title="E-commerce AI Automation Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    create_collection_if_not_exists()


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    try:
        test_db_connection()
        return {
            "status": "success",
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}",
        )


app.include_router(api_router, prefix="/api/v1")


app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Auth"],
)


app.include_router(
    vision.router,
    prefix="/api/v1/vision",
    tags=["Vision"],
)


app.include_router(
    multimodal.router,
    prefix="/api/v1",
)