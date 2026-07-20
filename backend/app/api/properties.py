"""
API эндпоинты для сохранённых объектов недвижимости пользователя.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.api.auth import get_current_user_id
from app.services.db_service import (
    save_property,
    get_user_properties,
    get_property_by_id,
    delete_property,
    get_property_by_url,
)
from app.services.property_parser import parse_property_url, ParserError as PropertyParserError
from app.api.exceptions import BusinessError

router = APIRouter(prefix="/api/properties", tags=["Properties"])


class SavePropertyRequest(BaseModel):
    title: str
    property_data: dict


class PropertyItemResponse(BaseModel):
    id: str
    title: str
    property_data: dict
    created_at: str


class PropertyListResponse(BaseModel):
    properties: List[PropertyItemResponse]


PROPERTY_TYPE_LABELS = {
    "flat": "квартира",
    "apartment": "апартаменты",
    "house": "дом",
    "room": "комната",
    "land": "участок",
}

DEAL_TYPE_LABELS = {
    "free_sale": "свободная продажа",
    "alternative": "альтернатива",
    "mortgage": "ипотека",
    "кредит": "ипотека",
    "ипотека": "ипотека",
}


def _map_property_type(value: object) -> str:
    if value is None:
        return ""
    v = str(value).strip()
    if not v:
        return ""
    lower = v.lower()
    # Если уже пришло в человекочитаемом виде — оставим как есть.
    if any(token in v.lower() for token in ("кварт", "апартам", "дом", "комнат", "участок")):
        if "кварт" in lower:
            return "квартира"
        if "апартам" in lower:
            return "апартаменты"
        if "дом" in lower:
            return "дом"
        if "комнат" in lower:
            return "комната"
        if "участок" in lower:
            return "участок"
    return PROPERTY_TYPE_LABELS.get(lower, v)


def _map_deal_type(value: object) -> str:
    if value is None:
        return "не указан"
    v = str(value).strip()
    if not v:
        return "не указан"

    lower = v.lower()
    return DEAL_TYPE_LABELS.get(lower, v)


def _map_market_category(value: object) -> str:
    if value is None:
        return ""
    v = str(value).strip()
    if not v:
        return ""

    normalized = v.lower().replace("\xa0", " ")
    if "новостр" in normalized or "первич" in normalized:
        return "новостройка"
    if "втор" in normalized:
        return "вторичка"
    # Если данные приходят как primary/secondary и т.п.
    if "primary" in normalized:
        return "новостройка"
    if "secondary" in normalized:
        return "вторичка"
    return ""


def _safe_float(value: object) -> float:
    try:
        if value is None:
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _safe_int(value: object) -> int:
    try:
        if value is None:
            return 0
        return int(value)
    except (TypeError, ValueError):
        return 0


def _map_parsed_property_to_deal_preview(parsed: dict) -> dict:
    seller = parsed.get("seller") or {}
    location = parsed.get("location") or {}

    property_type = _map_property_type(parsed.get("property_type"))
    market_category = _map_market_category(parsed.get("market_category") or parsed.get("property_old"))
    deal_type = _map_deal_type(parsed.get("deal_type"))

    return {
        "id": str(parsed.get("id") or ""),
        "platform": str(parsed.get("platform") or ""),
        "url": str(parsed.get("url") or ""),
        "title": str(parsed.get("title") or ""),
        "address": str(parsed.get("address") or ""),
        "price": _safe_int(parsed.get("price")),
        "totalArea": _safe_float(parsed.get("total_area")),
        "livingArea": _safe_float(parsed.get("living_area")) if parsed.get("living_area") is not None else 0.0,
        "kitchenArea": _safe_float(parsed.get("kitchen_area")) if parsed.get("kitchen_area") is not None else 0.0,
        "floor": _safe_int(parsed.get("floor")),
        "totalFloors": _safe_int(parsed.get("total_floors")),
        "rooms": _safe_int(parsed.get("rooms")),
        "propertyType": property_type,
        "marketCategory": market_category,
        "dealType": deal_type,
        "description": parsed.get("description") or "",
        "seller": {
            "name": str(seller.get("name") or ""),
            "phone": seller.get("phone"),
            "type": seller.get("type"),
            "company_name": seller.get("company_name"),
        },
        "location": {
            "lat": _safe_float(location.get("lat")),
            "lon": _safe_float(location.get("lon")),
            "address": location.get("address"),
        },
    }


@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Получить все сохранённые объекты недвижимости пользователя."""
    props = await get_user_properties(db, user_id)
    return PropertyListResponse(
        properties=[
            PropertyItemResponse(
                id=p.id,
                title=p.title,
                property_data=p.property_data,
                created_at=p.created_at.isoformat(),
            )
            for p in props
        ]
    )


@router.post("/", response_model=PropertyItemResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: SavePropertyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Сохранить объект недвижимости.

    Если объект с таким URL уже существует, то возвращаем его.
    """
    # Извлекаем URL объекта из property_data
    property_data = body.property_data
    property_obj = property_data.get("property", {})
    url = property_obj.get("url", "") if isinstance(property_obj, dict) else ""

    if url:
        existing = await get_property_by_url(db, user_id, url)
        if existing is not None:
            return PropertyItemResponse(
                id=existing.id,
                title=existing.title,
                property_data=existing.property_data,
                created_at=existing.created_at.isoformat(),
            )

    prop = await save_property(db, user_id, body.title, body.property_data)
    return PropertyItemResponse(
        id=prop.id,
        title=prop.title,
        property_data=prop.property_data,
        created_at=prop.created_at.isoformat(),
    )


@router.get("/{property_id}", response_model=PropertyItemResponse)
async def get_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Получить конкретный объект недвижимости."""
    prop = await get_property_by_id(db, property_id, user_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )
    return PropertyItemResponse(
        id=prop.id,
        title=prop.title,
        property_data=prop.property_data,
        created_at=prop.created_at.isoformat(),
    )


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Удалить сохранённый объект."""
    deleted = await delete_property(db, property_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )


@router.post("/{property_id}/refresh", response_model=PropertyItemResponse)
async def refresh_property_from_cian(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновляет сохранённые данные объекта недвижимости через повторный парсинг ЦИАН по сохранённому `property.url`.

    Важно: обновляем только поле `property` в `property_data`, чтобы сохранить отчёт/рейтинг.
    """
    prop = await get_property_by_id(db, property_id, user_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )

    property_data = prop.property_data or {}
    saved_property = property_data.get("property") or {}
    if not isinstance(saved_property, dict):
        raise BusinessError("Некорректный формат сохранённых данных.")

    url = saved_property.get("url")
    if not url:
        raise BusinessError("Не найден URL объекта для обновления.")

    try:
        parsed = parse_property_url(str(url))
    except PropertyParserError as e:
        raise e
    except ValueError as e:
        raise BusinessError(str(e), status_code=400)
    except Exception:
        raise BusinessError("Не удалось обновить данные с Циана.")

    if not parsed:
        raise BusinessError("Не удалось распарсить объявление с Циана.")

    mapped_property = _map_parsed_property_to_deal_preview(parsed)

    # Обновляем карточку, но если какие-то "подписи" не удалось корректно распознать,
    # оставляем старые значения (чтобы UI не терял смысловые поля).
    updated_property = dict(saved_property)
    updated_property.update(mapped_property)
    for derived_key in ("propertyType", "marketCategory", "dealType"):
        if not mapped_property.get(derived_key):
            updated_property[derived_key] = saved_property.get(derived_key)

    # Обновляем только `property` внутри JSON, сохраняя чек/рейтинг/проблемы.
    updated_property_data = dict(property_data)
    updated_property_data["property"] = updated_property

    prop.property_data = updated_property_data
    prop.title = updated_property.get("title") or prop.title

    await db.flush()

    return PropertyItemResponse(
        id=prop.id,
        title=prop.title,
        property_data=prop.property_data,
        created_at=prop.created_at.isoformat(),
    )