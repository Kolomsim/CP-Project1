"""
Хранит данные пользователя между шагами
"""

import uuid
from typing import Dict, Any
from datetime import datetime, timedelta

_sessions: Dict[str, Dict[str, Any]] = {}

SESSION_TTL = timedelta(minutes=30)

def create_session() -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "created_at": datetime.now(),
        "data": {}
    }
    return session_id

def get_session(session_id: str) -> Dict[str, Any] | None:
    """
    Получает данные сессии по ID.
    Если сессия истекла или не найдена — возвращает None.
    """
    session = _sessions.get(session_id)
    if not session:
        return None
    
    # Проверяем время жизни
    if datetime.now() - session["created_at"] > SESSION_TTL:
        delete_session(session_id)
        return None
    
    return session["data"]

def update_session(session_id: str, data: Dict[str, Any]) -> bool:
    """
    Обновляет данные сессии
    """
    session = _sessions.get(session_id)
    if not session:
        return False

    session["data"].update(data)
    session["created_at"] = datetime.now()  # продлеваем время жизни
    return True

def delete_session(session_id: str) -> bool:
    if session_id not in _sessions:
        del _sessions[session_id]
        return True
    return False

def get_all_sessions() -> Dict[str, Dict[str, Any]]:
    """
    Возвращает все активные сессии (для отладки).
    """
    return _sessions