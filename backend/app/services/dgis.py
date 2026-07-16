import httpx
import logging
from math import radians, sin, cos, sqrt, atan2
from typing import List, Dict, Any, Optional
from app.config import config

logger = logging.getLogger(__name__)

# Типы объектов 2ГИС по умолчанию: организации (branch), здания, станции
# (в т.ч. метро) и достопримечательности.
#
# Для инфраструктурных "плохих" категорий (ж/д, кладбище и т.п.) в nearby.py
# передаётся более узкий набор типов БЕЗ "branch" — чтобы не ловить компании,
# у которых просто похожее слово встречается в названии (например,
# "ЖД-Строй" — строительная фирма, а не станция; "branch" — это как раз тип
# для организаций/офисов, а не для физических объектов вроде станции или
# кладбища).
DEFAULT_PLACE_TYPES = "branch,building,station,station.metro,attraction"


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Расстояние между двумя точками в метрах."""
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


async def fetch_nearby_dgis(
        client: httpx.AsyncClient,
        lat: float,
        lon: float,
        radius: int,
        search_query: str,
        place_types: str = DEFAULT_PLACE_TYPES,
        rubric_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Запрос к 2GIS Search API v3.0.
    Ищет организации/объекты вокруг точки и возвращает список с координатами,
    рубриками, уникальным id объекта 2ГИС и расстоянием.

    place_types — какие типы объектов 2GIS учитывать (см. DEFAULT_PLACE_TYPES
                  и комментарий выше). Для точечной инфраструктуры без
                  организаций передавайте набор без "branch".
    rubric_id   — необязательный список id рубрик 2ГИС через запятую. Если
                  задан, поиск идёт по точной категории 2ГИС, а не только по
                  тексту — самый надёжный способ избежать ложных совпадений
                  по названию ("точное совпадение"). id рубрик можно получить
                  один раз через https://catalog.api.2gis.com/2.0/catalog/rubric/search
                  и закэшировать у себя, чтобы не тратить лишние запросы.
    """

    # 2ГИС 3.0 ожидает одну строку с координатами в формате 'lon,lat'
    point = f"{lon},{lat}"

    params = {
        "key": config.DGIS_API_KEY,
        "point": point,
        "radius": radius,
        "type": place_types,
        "fields": "items.point,items.rubrics",  # id/name/address_name возвращаются по умолчанию
        "sort": "distance",
    }

    if rubric_id:
        params["rubric_id"] = rubric_id
    if search_query:
        params["q"] = search_query
        params["search_is_query_text_complete"] = "true"

    try:
        response = await client.get(
            "https://catalog.api.2gis.com/3.0/items",
            params=params
        )
        response.raise_for_status()
        data = response.json()

        meta = data.get("meta", {})
        status_code = meta.get("code", 200)
        if status_code != 200:
            error_info = meta.get("error", {})
            logger.error(
                f"2GIS API returned internal error {status_code} for query '{search_query}': "
                f"{error_info.get('type')} - {error_info.get('message')}"
            )
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"2GIS API HTTP error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"2GIS API request failed: {str(e)}")
        raise

    result = data.get("result", {})
    raw_items = result.get("items", [])

    logger.info(f"2GIS items count for '{search_query or rubric_id}': {len(raw_items)}")

    items = []

    for item in raw_items:
        point_data = item.get("point")
        if not point_data or not isinstance(point_data, dict):
            continue
        try:
            lat_obj = float(point_data.get("lat"))
            lon_obj = float(point_data.get("lon"))
        except (ValueError, AttributeError, TypeError):
            continue

        item_id = item.get("id")
        name = item.get("name", "Без названия")
        address = item.get("address_name") or item.get("full_address_name") or ""
        rubrics = [r.get("name", "") for r in item.get("rubrics", []) if r.get("name")]
        distance = haversine(lat, lon, lat_obj, lon_obj)

        # добавим такое ограничение, потому что API может добавить с большим радиусом
        if distance <= radius:
            items.append({
                "id": item_id,
                "name": name,
                "lat": lat_obj,
                "lon": lon_obj,
                "address": address,
                "rubrics": rubrics,
                "distance": distance
            })

    return items
