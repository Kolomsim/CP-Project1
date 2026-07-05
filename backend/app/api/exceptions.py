# app/api/exceptions.py

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class BusinessError(Exception):
    """Базовое исключение для бизнес-логики."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class SessionNotFoundError(BusinessError):
    def __init__(self):
        super().__init__("Сессия не найдена или истекла", status_code=404)

class ValidationError(BusinessError):
    def __init__(self, message: str):
        super().__init__(message, status_code=422)

class ExternalAPITimeoutError(BusinessError):
    def __init__(self, service: str):
        super().__init__(f"Сервис {service} временно недоступен", status_code=503)

class ParserError(BusinessError):
    def __init__(self, message: str):
        super().__init__(message, status_code=400)

# Обработчик исключений для FastAPI
async def business_error_handler(request: Request, exc: BusinessError):
    logger.warning(f"Business error: {exc.message} (status={exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера. Мы уже работаем над исправлением."}
    )