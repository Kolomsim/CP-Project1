# app/api/health.py

from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("/")
async def health_check():
    return {"status": "ok", "service": "СмартЧек API", "version": "1.0.0"}