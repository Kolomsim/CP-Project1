"""
Сервис для поиска информации о компании в ФНС (Прозрачный бизнес — pb.nalog.ru).
"""
import json
import logging
import asyncio
from typing import Optional, Dict, Any
import httpx

from app.models.nalog import NalogCompanyInfo

logger = logging.getLogger(__name__)

SEARCH_URL = "https://pb.nalog.ru/search-proc.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "https://pb.nalog.ru",
    "Referer": "https://pb.nalog.ru/search.html",
}


async def _post_request(data: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """Выполняет POST запрос к search-proc.json и возвращает JSON."""
    async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
        try:
            response = await client.post(SEARCH_URL, data=data, headers=HEADERS)
            if response.status_code == 200:
                return response.json()
            logger.warning(f"ФНС API вернул статус {response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Ошибка HTTP запроса к ФНС: {e}")
            return None


async def search_company(query: str) -> Optional[NalogCompanyInfo]:
    """Ищет компанию в ФНС по наименованию или ИНН."""
    if not query or query.strip() in ("", "Неизвестно"):
        return None

    payload = {
        "page": "1",
        "pageSize": "10",
        "pbFormMode": "reg",
        "searchMode": "string",
        "string": query.strip(),
    }

    res = await _post_request(payload)
    if not res or "id" not in res:
        return None

    request_id = res["id"]
    await asyncio.sleep(0.5)

    # Вторым запросом забираем результат обработки
    response_data = await _post_request({"id": request_id, "method": "get-response"})
    if not response_data or "searchResult" not in response_data:
        return None

    items = response_data.get("searchResult", {}).get("data", [])
    if not items:
        return None

    first = items[0]
    return NalogCompanyInfo(
        inn=first.get("inn"),
        ogrn=first.get("ogrn"),
        short_name=first.get("shortName") or first.get("name"),
        full_name=first.get("fullName"),
        status=first.get("status"),
        registration_date=first.get("dtReg"),
        region=first.get("regionName"),
        okved=first.get("okvedName"),
    )


async def get_company_details(inn: str) -> Optional[NalogCompanyInfo]:
    """Получает детали о компании по ИНН."""
    return await search_company(inn)


async def analyze_company_auto_answers(nalog_info: Optional[NalogCompanyInfo]) -> Dict[str, Any]:
    """Формирует автоматические ответы для чек-листа застройщика."""
    if not nalog_info:
        return {}

    auto_answers = {}
    
    # Пример автоматического ответа по статусу ликвидации
    if nalog_info.status and "ликвидирован" in nalog_info.status.lower():
        auto_answers["dev_status"] = {
            "value": "yes",
            "source": "ФНС (Прозрачный Бизнес)",
            "details": f"Компания имеет статус: {nalog_info.status}"
        }
    else:
        auto_answers["dev_status"] = {
            "value": "no",
            "source": "ФНС (Прозрачный Бизнес)",
            "details": f"Действующая организация ({nalog_info.status or 'Активна'})"
        }

    return auto_answers