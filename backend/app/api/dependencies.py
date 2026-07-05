from fastapi import Request, Depends
from app.services.session_manager import get_session
from app.api.exceptions import SessionNotFoundError

async def get_session_data(session_id: str):
    """
    Получает данные сессии по ID. Если сессия не найдена или истекла — бросает исключение.
    """
    data = get_session(session_id)
    if data is None:
        raise SessionNotFoundError()
    return data