"""
Модуль для внешних API
"""

import asyncio 
import hashlib
import json
import logging
import time
from typing import Dict, Any, Optional, Callable, TypeVar, Awaitable
from datetime import datetime, timedelta

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import config

logger = logging.getLogger(__name__)

class InMemoryCache:
    """Кэш с TTL (время жизни) для хранения результатов внешних запросов."""
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._ttl_seconds = config.CACHE_TTL_SECONDS

    def _get_key(self, *args, **kwargs) -> str:
        """Генерирует уникальный ключ на основе аргументов."""
        data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(data.encode()).hexdigest()

    def get(self, *args, **kwargs) -> Optional[Any]:
        key = self._get_key(*args, **kwargs)
        entry = self._cache.get(key)
        if entry and entry["expires_at"] > datetime.now():
            logger.debug(f"Cache hit for key {key[:8]}")
            return entry["value"]
        if entry:
            logger.debug(f"Cache expired for key {key[:8]}")
            del self._cache[key]
        return None

    def set(self, value: Any, *args, **kwargs) -> None:
        key = self._get_key(*args, **kwargs)
        self._cache[key] = {
            "value": value,
            "expires_at": datetime.now() + timedelta(seconds=self._ttl_seconds),
        }
        logger.debug(f"Cached for key {key[:8]}, TTL={self._ttl_seconds}s")

# Глобальный экземпляр кэша (в реальном проде заменили бы на Redis)
cache = InMemoryCache()

# Декоратор для кэширования 
def cached(ttl: Optional[int] = None):
    """Декоратор для кэширования результатов асинхронных функций."""
    def decorator(func: Callable[..., Awaitable[Any]]):
        async def wrapper(*args, **kwargs):
            # Если кэш отключен или используется Redis — пропускаем (реализация Redis не входит в пример)
            if config.USE_REDIS or config.USE_MOCK_EXTERNAL_API:
                return await func(*args, **kwargs)
            # Иначе используем наш in-memory кэш
            cached_value = cache.get(*args, **kwargs)
            if cached_value is not None:
                return cached_value
            result = await func(*args, **kwargs)
            cache.set(result, *args, **kwargs)
            return result
        return wrapper
    return decorator

# Функции для повторных попыток (ретраи)
def retry_config():
    """Настройки повторных попыток для httpx запросов."""
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.ConnectTimeout)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )

# Базовый клиент для внешних API
class ExternalAPIClient:
    """Клиент для безопасных вызовов внешних API с авторизацией и таймаутами."""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, timeout: int = 10):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self._client = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=self._build_headers(),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()

    def _build_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    @retry_config()
    async def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Выполняет HTTP-запрос с повторными попытками."""
        if not self._client:
            raise RuntimeError("Client not initialized; use async context manager")
        try:
            response = await self._client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} for {method} {path}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request error {method} {path}: {str(e)}")
            raise

    async def get(self, path: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        return await self._request("GET", path, params=params)

    async def post(self, path: str, json: Optional[Dict] = None) -> Dict[str, Any]:
        return await self._request("POST", path, json=json)

# Специализированные функции для каждого внешнего API

@cached()
async def check_bankruptcy(inn: str) -> Dict[str, Any]:
    """
    Проверка ИНН в реестре банкротств Федресурса.
    Возвращает структурированный результат.
    """

    if config.USE_MOCK_EXTERNAL_API:
        # Для разработки — мок, но он теперь управляется через настройки
        logger.warning("Using MOCK data for bankruptcy check (USE_MOCK_EXTERNAL_API=True)")
        import random
        if random.random() < 0.15:
            return {
                "is_bankrupt": True,
                "case_number": f"А40-{random.randint(10000, 99999)}/2024",
                "date": "2024-05-15",
                "status": "Конкурсное производство"
            }
        return {"is_bankrupt": False}

    # Реальный запрос к API Федресурса
    async with ExternalAPIClient(
        base_url=config.FEDRESURS_API_URL,
        api_key=config.FEDRESURS_API_KEY,
        timeout=config.FEDRESURS_TIMEOUT
    ) as client:
        # Предположим, что API имеет эндпоинт /bankruptcy/by-inn?inn=...
        result = await client.get("/bankruptcy/by-inn", params={"inn": inn})
        # Преобразуем ответ к нашему формату
        return {
            "is_bankrupt": result.get("isBankrupt", False),
            "case_number": result.get("caseNumber"),
            "date": result.get("date"),
            "status": result.get("status"),
        }

@cached()
async def check_fssp(name: str, region: Optional[str] = None) -> Dict[str, Any]:
    """
    Проверка ФИО в базе ФССП.
    """
    if config.USE_MOCK_EXTERNAL_API:
        logger.warning("Using MOCK data for FSSP check")
        import random
        if random.random() < 0.20:
            return {
                "has_debts": True,
                "amount": random.randint(10000, 500000),
                "cases": [
                    {
                        "number": f"ИП № {random.randint(100000, 999999)}/24/{random.randint(10, 99)}",
                        "amount": random.randint(10000, 500000),
                        "status": "Активно"
                    }
                ]
            }
        return {"has_debts": False}

    async with ExternalAPIClient(
        base_url=config.FSSP_API_URL,
        api_key=config.FSSP_API_KEY,
        timeout=config.FSSP_TIMEOUT
    ) as client:
        # Предположим, что API имеет эндпоинт /search?name=...
        result = await client.get("/search", params={"name": name, "region": region or ""})
        return {
            "has_debts": result.get("hasDebts", False),
            "amount": result.get("totalDebt"),
            "cases": result.get("cases", []),
        }

# @cached()
# async def check_rosreestr(cadastral_number: str) -> Dict[str, Any]:
#     """
#     Получение выписки из ЕГРН по кадастровому номеру.
#     В реальности требует ЭЦП; здесь мы имитируем запрос к условному API.
#     """
#     if settings.USE_MOCK_EXTERNAL_API:
#         logger.warning("Using MOCK data for Rosreestr check")
#         import random
#         return {
#             "cadastral_number": cadastral_number,
#             "owner": "Иванов Иван Иванович",
#             "area": random.randint(30, 120),
#             "encumbrances": random.choice([[], ["Арест", "Ипотека"]]),
#             "rights_registered": True
#         }

#     async with ExternalAPIClient(
#         base_url=settings.ROSREESTR_API_URL,
#         api_key=settings.ROSREESTR_API_KEY,
#         timeout=settings.ROSREESTR_TIMEOUT
#     ) as client:
#         result = await client.get(f"/egrn/{cadastral_number}")
#         return {
#             "cadastral_number": cadastral_number,
#             "owner": result.get("owner"),
#             "area": result.get("area"),
#             "encumbrances": result.get("encumbrances", []),
#             "rights_registered": result.get("rightsRegistered", False),
#         }

# # --- Функция для проверки наличия арестов/обременений ---
# async def check_arrests(cadastral_number: Optional[str] = None) -> Dict[str, Any]:
#     """
#     Проверяет наличие арестов. Если кадастровый номер не указан, возвращает None.
#     """
#     if not cadastral_number:
#         return {"has_arrest": False, "details": None}
#     data = await check_rosreestr(cadastral_number)
#     encumbrances = data.get("encumbrances", [])
#     arrest_found = any("арест" in enc.lower() for enc in encumbrances)
#     return {
#         "has_arrest": arrest_found,
#         "details": encumbrances if arrest_found else None,
#     }