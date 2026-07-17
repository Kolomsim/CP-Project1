"""
Сервис для поиска информации о компании в ФНС (Прозрачный бизнес — pb.nalog.ru).

Использует асинхронный HTTP-клиент httpx для запросов к search-proc.json.
Механизм работы:
1. POST запрос с параметрами поиска → получаем request_id
2. POST запрос с request_id и method=get-response → получаем результат
"""
import json
import logging
import asyncio
from typing import Optional, Dict, Any

import httpx

from app.models.nalog import NalogCompanyInfo

logger = logging.getLogger(__name__)

# Базовый URL для API поиска
SEARCH_URL = "https://pb.nalog.ru/search-proc.json"

# Заголовки для имитации браузера
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
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(SEARCH_URL, data=data, headers=HEADERS)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            logger.warning("Timeout при запросе к pb.nalog.ru")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP ошибка pb.nalog.ru: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Ошибка запроса к pb.nalog.ru: {e}")
            return None


async def search_company(name: str) -> Optional[NalogCompanyInfo]:
    """
    Поиск компании в ФНС по названию.
    
    Args:
        name: Название компании (например, "УСК Сибиряк")
    
    Returns:
        NalogCompanyInfo с данными компании или None, если не найдена
    """
    logger.info(f"[DEBUG] search_company: ищем '{name}' в ФНС")
    
    # Шаг 1: Отправляем поисковый запрос
    search_data = {
        "mode": "search-ul",
        "queryUl": name,
        "page": "1",
        "pageSize": "10",
        "includeOkvedUl": "1",
        "mspUl1": "1",
        "mspUl2": "1",
        "mspUl3": "1",
    }
    
    result = await _post_request(search_data)
    if not result:
        return None
    
    request_id = result.get("id")
    logger.info(f"[DEBUG] search_company: получен request_id={request_id}")
    if not request_id:
        logger.warning(f"[DEBUG] Не получен request_id при поиске '{name}'")
        return None
    
    # Шаг 2: Получаем результат (с повторными попытками)
    for attempt in range(10):
        await asyncio.sleep(1.5)
        
        poll_data = {
            "id": request_id,
            "method": "get-response",
        }
        
        response_data = await _post_request(poll_data)
        if response_data is None:
            continue
        
        # Если результат ещё не готов, response_data будет None (null в JSON)
        if response_data is not None:
            logger.info(f"[DEBUG] search_company: получен результат на попытке {attempt+1}")
            return _parse_search_result(response_data, name)
    
    logger.warning(f"Не удалось получить результат поиска для '{name}' после 10 попыток")
    return None


def _parse_search_result(data: Dict[str, Any], query_name: str) -> Optional[NalogCompanyInfo]:
    """Парсит результат поиска и возвращает NalogCompanyInfo."""
    ul_data = data.get("ul", {})
    companies = ul_data.get("data", [])
    
    if not companies:
        logger.info(f"Компании по запросу '{query_name}' не найдены")
        return None
    
    # Берём первую компанию из результатов
    company = companies[0]
    
    # Логируем все доступные поля для отладки
    logger.info(f"Все поля компании из ФНС: {json.dumps(company, ensure_ascii=False, default=str)}")
    
    # Определяем статус
    status = company.get("sulst_name_ex", "")
    is_active = "действующ" in status.lower()
    
    result = NalogCompanyInfo(
    	inn=company.get("inn"),
    	ogrn=company.get("ogrn"),
    	short_name=company.get("namec"),
    	full_name=company.get("namep"),
    	status=status,
    	registration_date=company.get("dtreg"),
    	region=company.get("regionname"),
    	okved=company.get("okved2mainname"),
    	okved_code=company.get("okved2main"),
    	is_active=is_active,
    )
    
    logger.info(
        f"Найдена компания: {result.short_name} (ИНН: {result.inn}, "
        f"статус: {result.status})"
    )
    
    return result


async def analyze_company_auto_answers(nalog_info: NalogCompanyInfo) -> Dict[str, Dict[str, Any]]:
    """
    Анализирует данные компании из ФНС и формирует автоматические ответы
    на вопросы чек-листа проверки застройщика.
    
    Args:
        nalog_info: Данные компании из ФНС
    
    Returns:
        Словарь {question_id: {"value": "yes"|"no", "source": str, "details": str}}
    """
    answers: Dict[str, Dict[str, Any]] = {}
    
    # 1. Возраст компании (egrul-young-company)
    if nalog_info.registration_date:
        try:
            from datetime import datetime
            # Формат даты: "17.12.2013"
            reg_date = datetime.strptime(nalog_info.registration_date, "%d.%m.%Y")
            now = datetime.now()
            years_old = (now - reg_date).days / 365.25
            is_young = years_old < 3
            
            answers["egrul-young-company"] = {
                "value": "yes" if is_young else "no",
                "source": "ФНС (Прозрачный бизнес)",
                "details": (
                    f"Компания зарегистрирована {nalog_info.registration_date} "
                    f"({years_old:.0f} лет назад)"
                ),
            }
            logger.info(
                f"Авто-ответ egrul-young-company: {'yes' if is_young else 'no'} "
                f"(зарегистрирована {nalog_info.registration_date}, {years_old:.0f} лет)"
            )
        except (ValueError, TypeError) as e:
            logger.warning(f"Не удалось распарсить дату регистрации: {e}")
    
    # 2. ОКВЭД (egrul-no-construction)
    if nalog_info.okved:
    	# Пытаемся получить код ОКВЭД: сначала из отдельного поля okved_code,
    	# иначе извлекаем из названия (первая часть до точки, например "68.31" -> "68")
    	raw_code = nalog_info.okved_code
    	if raw_code:
    		okved_code = raw_code.split(".")[0] if "." in raw_code else raw_code[:2]
    	else:
    		okved_code = nalog_info.okved.split(".")[0] if "." in nalog_info.okved else nalog_info.okved[:2]
    	# Коды строительства и смежных областей:
    	#   41 — строительство зданий
    	#   42 — строительство инженерных сооружений
    	#   43 — работы строительные специализированные
    	#   71 — архитектура и инженерно-техническое проектирование
    	is_construction = okved_code in ("41", "42", "43", "71")
   
    	answers["egrul-no-construction"] = {
    		"value": "yes" if not is_construction else "no",
    		"source": "ФНС (Прозрачный бизнес)",
    		"details": (
    			f"Основной вид деятельности: {nalog_info.okved} "
    			f"(код: {okved_code})"
    		),
    	}
    	logger.info(
    		f"Авто-ответ egrul-no-construction: {'yes' if not is_construction else 'no'} "
    		f"(ОКВЭД: {nalog_info.okved}, код: {okved_code})"
    	)
    
    # 3. Банкротство (bankruptcy-found) — проверка по ИНН
    if nalog_info.inn:
        try:
            from app.services.external_api import check_bankruptcy
            bankruptcy_data = await check_bankruptcy(nalog_info.inn)
            if bankruptcy_data and isinstance(bankruptcy_data, dict):
                is_bankrupt = bankruptcy_data.get("is_bankrupt", False)
                details_parts = []
                if bankruptcy_data.get("case_number"):
                    details_parts.append(f"Дело № {bankruptcy_data['case_number']}")
                if bankruptcy_data.get("status"):
                    details_parts.append(f"Статус: {bankruptcy_data['status']}")
                
                answers["bankruptcy-found"] = {
                    "value": "yes" if is_bankrupt else "no",
                    "source": "Федресурс (bankrot.fedresurs.ru)",
                    "details": "; ".join(details_parts) if details_parts else (
                        "Проверка выполнена, информация о банкротстве не найдена"
                    ),
                }
                logger.info(
                    f"Авто-ответ bankruptcy-found: {'yes' if is_bankrupt else 'no'} "
                    f"(ИНН: {nalog_info.inn})"
                )
        except Exception as e:
            logger.warning(f"Не удалось проверить банкротство по ИНН {nalog_info.inn}: {e}")
    
    return answers


async def get_company_details(inn: str) -> Optional[NalogCompanyInfo]:
    """
    Получение детальной информации о компании по ИНН.
    Сейчас возвращает базовые данные из поиска.
    В будущем можно добавить парсинг страницы компании.
    
    Args:
        inn: ИНН компании
    
    Returns:
        NalogCompanyInfo с детальными данными
    """
    # Пока используем поиск по ИНН
    return await search_company(inn)