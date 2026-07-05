# app/api/articles.py

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional

router = APIRouter(prefix="/api/articles", tags=["Articles"])

# Тестовые данные статей
MOCK_ARTICLES = [
    {
        "id": "matkapital_risks",
        "title": "Материнский капитал: риски при сделке",
        "preview": "Как проверить выделение долей детям и не потерять квартиру.",
        "category": "Юридические риски",
    },
    {
        "id": "inheritance_risks",
        "title": "Покупка квартиры после наследства",
        "preview": "На что обратить внимание, чтобы избежать претензий от других наследников.",
        "category": "Наследство",
    },
    {
        "id": "jkx_debts",
        "title": "Что делать, если у продавца долги по ЖКХ",
        "preview": "Пошаговая инструкция: как проверить и что потребовать от продавца.",
        "category": "Финансы",
    },
    {
        "id": "fssp_check",
        "title": "Как проверить продавца на долги",
        "preview": "Используйте открытые базы ФССП, чтобы не купить квартиру с обременением.",
        "category": "Проверка контрагента",
    },
    {
        "id": "eco_risks",
        "title": "Экологические риски при покупке недвижимости",
        "preview": "Как узнать, находится ли объект в санитарно-защитной зоне.",
        "category": "Экология",
    },
]

@router.get("/", response_model=List[dict])
async def get_articles(limit: Optional[int] = Query(3, ge=1, le=20)):
    """
    Возвращает список статей. По умолчанию — последние 3.
    """
    return MOCK_ARTICLES[:limit]

@router.get("/{article_id}", response_model=dict)
async def get_article(article_id: str):
    """
    Возвращает полный текст статьи по ID.
    """
    for article in MOCK_ARTICLES:
        if article["id"] == article_id:
            # Добавляем полный текст (заглушка)
            return {
                **article,
                "content": "Полный текст статьи. Здесь может быть подробное описание рисков, ссылки на законы и пошаговые инструкции."
            }
    raise HTTPException(status_code=404, detail="Статья не найдена")