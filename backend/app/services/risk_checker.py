# app/services/risk_checker.py

import datetime
import logging
import asyncio
from enum import Enum
from typing import List, Dict, Any, Optional

from app.models import RiskLevel
from app.services.external_api import (
    check_bankruptcy,
    check_fssp
    # check_arrests,
)

logger = logging.getLogger(__name__)


def _field_value(value: Any) -> str:
    """Приводит значение поля анкеты к строке (корректно обрабатывает Enum)."""
    if value is None:
        return ""
    if isinstance(value, Enum):
        return str(value.value)
    return str(value)


async def check_all_risks(
    address: str,
    seller_name: str,
    inn: Optional[str] = None,
    cadastral_number: Optional[str] = None,
    buyer_info: Optional[Dict[str, Any]] = None,
    property_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Асинхронная проверка всех рисков. Выполняет параллельные запросы к внешним API.
    """
    risks: List[Dict[str, Any]] = []

    if buyer_info:
        risks.extend(_check_buyer_risks(buyer_info))

    if property_data:
        risks.extend(_check_property_risks(property_data))

    risks = _deduplicate_risks(risks)
    # Запускаем все проверки параллельно
    tasks = []

    # 1. Банкротство
    if inn:
        tasks.append(check_bankruptcy(inn))
    else:
        tasks.append(asyncio.sleep(0, result=None))  # заглушка

    # 2. Долги по ФССП
    if seller_name and seller_name not in ("", "Неизвестно"):
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
    # arrest_data = results[2]  # Закомментировано, так как check_arrests отсутствует в tasks

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

    # arrest_data отсутствует, поэтому проверка arrest удалена

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
    high_risks = [r for r in risks if r.get("severity") == RiskLevel.HIGH]
    medium = [r for r in risks if r.get("severity") == RiskLevel.MEDIUM]

    if high_risks:
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
        "critical_count": len(high_risks),
        "check_date": datetime.datetime.now().isoformat()
    }


def _check_buyer_risks(buyer_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Локальные проверки на основе данных покупателя из анкеты."""
    risks: List[Dict[str, Any]] = []
    purchase_method = _field_value(buyer_info.get("purchase_method"))
    citizenship = _field_value(buyer_info.get("citizenship"))

    if purchase_method == "Материнский капитал":
        risks.append({
            "type": "maternity_capital_buyer",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупка с использованием материнского капитала",
            "description": (
                "При покупке жилья с материнским капиталом нужно выделить доли всем членам семьи, "
                "включая детей. Также действуют ограничения на тип и состояние жилья."
            ),
            "recommendation": "Проверьте требования ПФР и подготовьте нотариальное обязательство о выделении долей детям.",
            "article_link": "/kb",
        })

    if purchase_method == "Ипотека":
        risks.append({
            "type": "mortgage",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупка в ипотеку",
            "description": (
                "Банк проверит объект и продавца. При наличии обременений или проблем с документами "
                "сделку могут не одобрить."
            ),
            "recommendation": "Запросите свежую выписку из ЕГРН и убедитесь, что объект соответствует требованиям банка.",
            "article_link": "/kb",
        })

    if purchase_method == "Государственная поддержка":
        risks.append({
            "type": "state_support",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупка с господдержкой",
            "description": "Программы господдержки имеют дополнительные требования к объекту, продавцу и покупателю.",
            "recommendation": "Уточните условия программы и список обязательных документов до подписания договора.",
            "article_link": "/kb",
        })

    if purchase_method == "Кредит":
        risks.append({
            "type": "installment",
            "severity": RiskLevel.LOW,
            "title": "Рассрочка от застройщика",
            "description": "При рассрочке важно проверить репутацию застройщика и условия договора.",
            "recommendation": "Изучите проектную декларацию и историю сдачи объектов застройщика.",
            "article_link": "/kb",
        })

    if citizenship and citizenship != "Россия":
        risks.append({
            "type": "foreign_citizenship",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупатель — иностранный гражданин",
            "description": "Для иностранных граждан могут действовать ограничения на покупку отдельных видов недвижимости.",
            "recommendation": "Проверьте актуальные ограничения для вашего гражданства и типа объекта.",
            "article_link": "/kb",
        })

    return risks


def _check_property_risks(property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Локальные проверки на основе данных объекта."""
    risks: List[Dict[str, Any]] = []
    searchable_text = " ".join([
        str(property_data.get("address", "")),
        str(property_data.get("description", "")),
        str(property_data.get("title", "")),
    ]).lower()

    market_category = _field_value(
        property_data.get("market_category") or property_data.get("property_old")
    ).strip().lower()

    if "новостр" in market_category or "первич" in market_category:
        risks.append({
            "type": "primary_market",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупка на первичном рынке",
            "description": "При покупке новостройки важно проверить застройщика, сроки сдачи и условия договора долевого участия.",
            "recommendation": "Изучите проектную декларацию и историю сдачи объектов застройщика.",
            "article_link": "/kb",
        })

    if "втор" in market_category:
        risks.append({
            "type": "secondary_market",
            "severity": RiskLevel.MEDIUM,
            "title": "Покупка на вторичном рынке",
            "description": "При покупке вторичного жилья важно проверить историю объекта, права собственников и отсутствие обременений.",
            "recommendation": "Запросите свежую выписку из ЕГРН и проверьте всех зарегистрированных жильцов.",
            "article_link": "/kb",
        })

    if "материнск" in searchable_text and "капитал" in searchable_text:
        risks.append({
            "type": "maternity_capital_history",
            "severity": RiskLevel.HIGH,
            "title": "Материнский капитал в истории сделок",
            "description": (
                "В описании объекта упоминается материнский капитал. "
                "Необходимо проверить, выделены ли доли детям."
            ),
            "recommendation": "Запросите у продавца документы о выделении долей детям или нотариальное обязательство.",
            "article_link": "/kb",
        })

    if "наследств" in searchable_text:
        risks.append({
            "type": "inheritance",
            "severity": RiskLevel.MEDIUM,
            "title": "Объект получен по наследству",
            "description": "При покупке наследственного имущества важно проверить сроки и законность оформления прав.",
            "recommendation": "Запросите свидетельство о праве на наследство и убедитесь, что прошло достаточно времени для оспаривания.",
            "article_link": "/kb",
        })

    return risks


def _deduplicate_risks(risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    unique: List[Dict[str, Any]] = []
    seen_types: set[str] = set()

    for risk in risks:
        risk_type = risk.get("type")
        if risk_type in seen_types:
            continue
        seen_types.add(risk_type)
        unique.append(risk)

    return unique


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
            "urgency": RiskLevel.HIGH
        },
        {
            "name": "Справка об отсутствии задолженности по ЖКХ",
            "description": "Подтверждает, что за объект нет долгов",
            "where_to_get": "Управляющая компания или ТСЖ",
            "urgency": RiskLevel.HIGH
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
                "urgency": RiskLevel.HIGH
            })
        elif risk["type"] in ("maternity_capital", "maternity_capital_buyer", "maternity_capital_history"):
            documents.append({
                "name": "Нотариальное обязательство о выделении долей детям",
                "description": "Если в сделке участвовал материнский капитал",
                "where_to_get": "Нотариус",
                "urgency": RiskLevel.HIGH
            })
        elif risk["type"] == "inheritance":
            documents.append({
                "name": "Свидетельство о праве на наследство",
                "description": "Подтверждает законность получения объекта по наследству",
                "where_to_get": "Нотариус, МФЦ",
                "urgency": RiskLevel.HIGH
            })
        elif risk["type"] == "arrest":
            documents.append({
                "name": "Решение суда о снятии ареста",
                "description": "Документ, подтверждающий снятие обременения",
                "where_to_get": "Суд, вынесший решение",
                "urgency": RiskLevel.HIGH
            })

    # Убираем дубликаты
    unique_docs = []
    seen_names = set()
    for doc in documents:
        if doc["name"] not in seen_names:
            seen_names.add(doc["name"])
            unique_docs.append(doc)

    return unique_docs
