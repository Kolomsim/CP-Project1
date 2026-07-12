"""
Модели для аутентификации пользователей.
"""

import re
from datetime import datetime

from pydantic import BaseModel, field_validator

USERNAME_PATTERN = re.compile(r"^user_[a-z0-9]{8}$")


class UserRegisterRequest(BaseModel):
    """Запрос на регистрацию нового пользователя."""
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        username = v.strip()
        if not USERNAME_PATTERN.match(username):
            raise ValueError("Недопустимый формат логина")
        return username

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Пароль должен содержать не менее 6 символов")
        return v


class UserLoginRequest(BaseModel):
    """Запрос на вход в систему."""
    username: str
    password: str


class SuggestUsernameResponse(BaseModel):
    """Ответ с предложенным логином для регистрации."""
    username: str


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