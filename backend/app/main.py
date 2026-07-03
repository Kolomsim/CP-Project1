# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.config import config

# Настройка логирования 
logging.basicConfig(
    level=logging.INFO if config.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=config.APP_NAME,
    description="Сервис анализа рисков при покупке жилья для физических лиц",
    version=config.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
logger.info(f"Разрешённые CORS-источники: {config.CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.get("/")
async def root():
    """Корневой эндпоинт — информация о сервисе"""
    return {
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
        "health": "/api/health",
    }

@app.get("/api/health")
async def health_check():
    """Проверка работоспособности API"""
    return {
        "status": "ok",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "debug": config.DEBUG,
    }

# При запуске через uvicorn 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD,
        log_level="info"
    )