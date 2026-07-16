import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load backend/.env regardless of process cwd (needed on PythonAnywhere)
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

class Config:
    APP_NAME: str = os.getenv("APP_NAME", "SmartCheck Недвижимость")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    RELOAD: bool = os.getenv("RELOAD", "True").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://smartcheck:smartcheck_secret@localhost:5432/smartcheck",
    )

    # JWT Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "smartcheck-jwt-secret-key-change-in-production-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # Федресурс (банкротство)
    FEDRESURS_API_URL: str = os.getenv("FEDRESURS_API_URL", "https://fedresurs.ru/api/v1")
    FEDRESURS_API_KEY: Optional[str] = os.getenv("FEDRESURS_API_KEY", None)
    FEDRESURS_TIMEOUT: int = int(os.getenv("FEDRESURS_TIMEOUT", 10))  # секунд

    # ФССП (долги)
    FSSP_API_URL: str = os.getenv("FSSP_API_URL", "https://api.fssp.gov.ru/v1")
    FSSP_API_KEY: Optional[str] = os.getenv("FSSP_API_KEY", None)
    FSSP_TIMEOUT: int = int(os.getenv("FSSP_TIMEOUT", 10))

    # Росреестр (выписка ЕГРН) — обычно нужна ЭЦП, но для демонстрации сделаем заглушку
    ROSREESTR_API_URL: str = os.getenv("ROSREESTR_API_URL", "https://rosreestr.ru/api/v1")
    ROSREESTR_API_KEY: Optional[str] = os.getenv("ROSREESTR_API_KEY", None)
    ROSREESTR_TIMEOUT: int = int(os.getenv("ROSREESTR_TIMEOUT", 15))

    # Кэширование
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", 86400))
    USE_REDIS: bool = os.getenv("USE_REDIS", "False").lower() == "true"
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # 2ГИС — поиск окружения объекта
    DGIS_API_KEY: str = os.getenv("DGIS_API_KEY", "")
    DGIS_SEARCH_URL: str = os.getenv("DGIS_SEARCH_URL", "https://catalog.api.2gis.com/3.0/items")
    DEFAULT_SEARCH_RADIUS: int = int(os.getenv("DEFAULT_SEARCH_RADIUS", 2000))

    # Флаг использования моков (для разработки, но в проде = False)
    USE_MOCK_EXTERNAL_API: bool = os.getenv("USE_MOCK_EXTERNAL_API", "False").lower() == "true"

config = Config()