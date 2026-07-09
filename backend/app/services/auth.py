"""
Сервис аутентификации: хеширование паролей, создание/верификация JWT,
работа с БД через db_service.
"""

import uuid
import logging
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import config
from app.database.models import User
from app.services.db_service import (
    create_user,
    get_user_by_email,
    get_user_by_id,
)

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _generate_random_login() -> str:
    """Генерирует случайный логин вида: user_XXXXX"""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"user_{suffix}"


def _create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def _create_refresh_token(user_id: str, email: str) -> str:
    """Создаёт refresh-токен как JWT с большим сроком жизни."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=config.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "email": email,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT access token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Декодирует и проверяет refresh-токен."""
    try:
        payload = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT refresh token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid refresh token: {e}")
        return None


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    name: str,
) -> Optional[User]:
    """
    Регистрирует нового пользователя.
    Если name не указано или пустое — генерирует случайный логин.
    Возвращает User или None, если email уже занят.
    """
    email = email.strip().lower()

    existing = await get_user_by_email(db, email)
    if existing:
        logger.warning(f"Registration attempt with existing email: {email}")
        return None

    # Если имя не указано — генерируем случайное
    final_name = name.strip() if name and name.strip() else _generate_random_login()

    user = await create_user(
        db=db,
        email=email,
        hashed_password=_hash_password(password),
        name=final_name,
    )
    logger.info(f"User registered: {email} (name: {final_name})")
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> Optional[User]:
    """Проверяет email и пароль. Возвращает User или None."""
    email = email.strip().lower()
    user = await get_user_by_email(db, email)

    if not user or not verify_password(password, user.hashed_password):
        logger.warning(f"Failed login attempt for: {email}")
        return None

    return user


def create_tokens(user: User) -> tuple[str, str]:
    """Создаёт пару access + refresh JWT токенов (без обращения к БД)."""
    access_token = _create_access_token(user.id, user.email)
    refresh_token = _create_refresh_token(user.id, user.email)
    return access_token, refresh_token


def refresh_access_token(refresh_token_value: str) -> Optional[tuple[str, str]]:
    """Обновляет access-токен по refresh-токену (без обращения к БД)."""
    payload = decode_refresh_token(refresh_token_value)
    if payload is None:
        return None

    user_id = payload["sub"]
    email = payload["email"]

    # Создаём новую пару токенов
    new_access = _create_access_token(user_id, email)
    new_refresh = _create_refresh_token(user_id, email)

    return new_access, new_refresh