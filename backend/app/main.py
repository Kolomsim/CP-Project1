# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import config
from app.api import (
    deal,
    articles,
    realtors,
    health,
)
from app.api.exceptions import BusinessError, business_error_handler, generic_exception_handler

# Настройка логирования
logging.basicConfig(
    level=logging.INFO if not config.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=config.APP_NAME,
    description="Сервис анализа рисков при покупке и продаже жилья",
    version=config.APP_VERSION,
    docs_url="/api/docs" if config.DEBUG else None,
    redoc_url="/api/redoc" if config.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(deal.router)
app.include_router(articles.router)
app.include_router(realtors.router)
app.include_router(health.router)

# Регистрируем обработчики исключений
app.add_exception_handler(BusinessError, business_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.get("/")
async def root():
    return {
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "running",
        "docs": "/api/docs" if config.DEBUG else None,
    }