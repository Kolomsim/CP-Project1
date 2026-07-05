import re
import logging
from typing import Optional, Dict, Any

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.app.utils.validators import validate_url, detect_platform, extract_id_from_url
from app.config import config

logger = logging.getLogger(__name__)

class ParserError(Exception):
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=5),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    reraise=True,
)
async def _fetch_html(url: str) -> str:
    """Загружает HTML страницы с повторными попытками."""
    async with httpx.AsyncClient(
        timeout=10.0,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text

async def _parse_cian(url: str, obj_id: str) -> Dict[str, Any]:
    """Парсит страницу ЦИАН и извлекает данные."""
    html = await _fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    # Пример извлечения данных (реальные селекторы нужно адаптировать)
    try:
        title = soup.find('h1', class_='a10a3f92e9').text.strip()
    except:
        title = "Неизвестно"
    try:
        price = int(re.sub(r'\D', '', soup.find('span', class_='e2c9b0a07c').text))
    except:
        price = 0
    try:
        address = soup.find('div', class_='address').text.strip()
    except:
        address = "Неизвестно"


    return {
        "id": obj_id,
        "platform": "ЦИАН",
        "url": url,
        "title": title,
        "address": address,
        "price": price,
        # ... остальные поля заполняем заглушками или парсим дальше
        "total_area": 0,
        "living_area": 0,
        "kitchen_area": 0,
        "floor": 0,
        "total_floors": 0,
        "rooms": 0,
        "property_type": "apartment",
        "deal_type": "free_sale",
        "seller": {"name": "Неизвестно", "phone": ""},
        "location": {"lat": 0, "lon": 0, "address": address},
        "is_verified": False,
    }


async def parse_property_url(url: str) -> Optional[Dict[str, Any]]:
    if not validate_url(url):
        raise ValueError("Неподдерживаемая ссылка")
    platform = detect_platform(url)
    if not platform:
        raise ValueError("Не удалось определить платформу")
    obj_id = extract_id_from_url(url)
    if not obj_id:
        raise ValueError("Не удалось извлечь ID объекта")

    parsers = {
        "ЦИАН": _parse_cian
    }
    parser = parsers.get(platform)
    if not parser:
        raise ValueError(f"Платформа {platform} пока не поддерживается")
    return await parser(url, obj_id)