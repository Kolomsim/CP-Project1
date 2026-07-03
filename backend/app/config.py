import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APP_NAME: str = os.getenv("APP_NAME", "SmartCheck Недвижимость")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    RELOAD: bool = os.getenv("RELOAD", "True").lower() == "true"

config = Config()