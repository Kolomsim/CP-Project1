"""
Модели для аутентификации пользователей.
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    """Запрос на регистрацию нового пользователя."""
    email: str
    password: str
    name: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Неверный формат email")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Пароль должен содержать не менее 6 символов")
        return v


class UserLoginRequest(BaseModel):
    """Запрос на вход в систему."""
    email: str
    password: str


class UserResponse(BaseModel):
    """Ответ с данными пользователя (без пароля)."""
    id: str
    email: str
    name: str
    created_at: datetime


class TokenResponse(BaseModel):
    """Ответ с JWT токенами."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Запрос на обновление access-токена."""
    refresh_token: str


class UserInDB(BaseModel):
    """Модель пользователя в БД (in-memory)."""
    id: str
    email: str
    hashed_password: str
    name: str
    created_at: datetime