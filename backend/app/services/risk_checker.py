# app/services/risk_checker.py

import datetime
import logging
import asyncio
from typing import List, Dict, Any, Optional

from app.models import RiskLevel
from app.services.external_api import (
    check_bankruptcy,
    check_fssp
    # check_arrests,
)

logger = logging.getLogger(__name__)

async def check_all_risks(
    address: str,
    seller_name: str,
    inn: Optional[str] = None,
    cadastral_number: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Асинхронная проверка всех рисков. Выполняет параллельные запросы к внешним API.
    """
    risks = []
    # Запускаем все проверки параллельно
    tasks = []

    # 1. Банкротство
    if inn:
        tasks.append(check_bankruptcy(inn))
    else:
        tasks.append(asyncio.sleep(0, result=None))  # заглушка

    # 2. Долги по ФССП
    if seller_name:
        tasks.append(check_fssp(seller_name))
    else:
        tasks.append(asyncio.sleep(0, result=None))

    # 3. Аресты (если есть кадастровый номер)
    # if cadastral_number:
    #     tasks.append(check_arrests(cadastral_number))
    # else:
    #     tasks.append(asyncio.sleep(0, result=None))

    # Запускаем все параллельно
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Обрабатываем результаты
    bankruptcy_data = results[0]
    fssp_data = results[1]
    arrest_data = results[2]

    # Формируем риски
    if bankruptcy_data and isinstance(bankruptcy_data, dict) and bankruptcy_data.get("is_bankrupt"):
        risks.append({
            "type": "bankruptcy",
            "severity": RiskLevel.HIGH,
            "title": "Владелец найден в реестре банкротства",
            "description": "Покупка недвижимости у банкрота связана с риском оспаривания сделки арбитражным управляющим.",
            "recommendation": "Узнайте, чем грозит банкротство продавца и как минимизировать риски.",
            "details": f"Дело № {bankruptcy_data.get('case_number')}, статус: {bankruptcy_data.get('status')}"
        })

    if fssp_data and isinstance(fssp_data, dict) and fssp_data.get("has_debts"):
        risks.append({
            "type": "fssp_debt",
            "severity": RiskLevel.HIGH,
            "title": "Задолженность в ФССП",
            "description": f"У продавца имеются исполнительные производства на сумму {fssp_data.get('amount', 0)} рублей.",
            "recommendation": "Попросите продавца предоставить справку об отсутствии долгов из ФССП.",
            "details": f"Количество дел: {len(fssp_data.get('cases', []))}"
        })

    if arrest_data and isinstance(arrest_data, dict) and arrest_data.get("has_arrest"):
        risks.append({
            "type": "arrest",
            "severity": RiskLevel.CRITICAL,
            "title": "Арест или обременение",
            "description": "На объект наложен арест или зарегистрировано обременение.",
            "recommendation": "НЕ РЕКОМЕНДУЕТСЯ покупать объект до снятия ареста.",
            "details": f"Обременения: {arrest_data.get('details')}"
        })

    # # Дополнительные локальные проверки (без внешних API) — например, маткапитал, наследство
    # # Здесь можно добавить проверку по адресу через локальную базу данных, но пока заглушка
    # # (можно вынести в отдельную функцию, но для демонстрации оставим)
    # if "материнский" in address.lower() or "материнский" in seller_name.lower():
    #     # Имитация нахождения риска
    #     risks.append({
    #         "type": "maternity_capital",
    #         "severity": RiskLevel.MEDIUM,
    #         "title": "Материнский капитал в истории сделок",
    #         "description": "В истории сделок использовался материнский капитал. Требуется проверка выделения долей детям.",
    #         "recommendation": "Запросите нотариальное обязательство о выделении долей.",
    #         "article_link": "/articles/matkapital_risks"
    #     })

    # Формируем итоговый рейтинг
    critical = [r for r in risks if r.get("severity") == RiskLevel.CRITICAL]
    high = [r for r in risks if r.get("severity") == RiskLevel.HIGH]
    medium = [r for r in risks if r.get("severity") == RiskLevel.MEDIUM]

    if critical or high:
        overall_rating = "Не рекомендуется"
    elif medium:
        overall_rating = "Требуется проверка"
    else:
        overall_rating = "Рекомендуется"

    # Чек-лист документов (аналогично предыдущей версии)
    required_documents = _generate_documents_checklist(risks)

    return {
        "problems": risks,
        "overall_rating": overall_rating,
        "required_documents": required_documents,
        "risk_count": len(risks),
        "critical_count": len(critical) + len(high),
        "check_date": datetime.now().isoformat()
    }


def _generate_documents_checklist(risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Генерирует список необходимых документов на основе найденных рисков.
    """
    documents = []
    
    # Базовый набор документов для всех сделок
    base_documents = [
        {
            "name": "Выписка из ЕГРН (свежая)",
            "description": "Подтверждает право собственности и наличие обременений",
            "where_to_get": "Росреестр, МФЦ, или онлайн через Госуслуги",
            "urgency": RiskLevel.CRITICAL
        },
        {
            "name": "Справка об отсутствии задолженности по ЖКХ",
            "description": "Подтверждает, что за объект нет долгов",
            "where_to_get": "Управляющая компания или ТСЖ",
            "urgency": RiskLevel.CRITICAL
        },
    ]
    documents.extend(base_documents)

    # Документы по найденным рискам
    for risk in risks:
        if risk["type"] == "bankruptcy":
            documents.append({
                "name": "Справка об отсутствии исполнительных производств",
                "description": "Из банка данных ФССП",
                "where_to_get": "ФССП, сайт fssp.gov.ru",
                "urgency": RiskLevel.CRITICAL
            })
        elif risk["type"] == "maternity_capital":
            documents.append({
                "name": "Нотариальное обязательство о выделении долей детям",
                "description": "Если в сделке участвовал материнский капитал",
                "where_to_get": "Нотариус",
                "urgency": RiskLevel.IMPORTANT
            })
        elif risk["type"] == "inheritance":
            documents.append({
                "name": "Свидетельство о праве на наследство",
                "description": "Подтверждает законность получения объекта по наследству",
                "where_to_get": "Нотариус, МФЦ",
                "urgency": RiskLevel.CRITICAL
            })
        elif risk["type"] == "arrest":
            documents.append({
                "name": "Решение суда о снятии ареста",
                "description": "Документ, подтверждающий снятие обременения",
                "where_to_get": "Суд, вынесший решение",
                "urgency": RiskLevel.CRITICAL
            })

    # Убираем дубликаты
    unique_docs = []
    seen_names = set()
    for doc in documents:
        if doc["name"] not in seen_names:
            seen_names.add(doc["name"])
            unique_docs.append(doc)

    return unique_docs