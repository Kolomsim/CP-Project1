import httpx
import logging
from math import radians, sin, cos, sqrt, atan2
from typing import List, Dict, Any
from app.config import config

logger = logging.getLogger(__name__)

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Расчёт расстояния между двумя точками на сфере (в метрах).
    """
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c

    return distance

async def fetch_nearby_dgis(
        client: httpx.AsyncClient,
        lat: float,
        lon: float,
        radius: int,
        search_query: str,
        skip: int = 0) -> List[Dict[str, Any]]:
    """
    Запрос к 2GIS Search API.
    Ищет организации в прямоугольнике вокруг точки.
    """
        
    params = {
        "apikey": config.YANDEX_API_KEY,
        "text": search_query,                     
        "type": "biz",                  # Только бизнес-объекты
        "lang": "ru_RU",
        "results": 5,                  # число объектов
        "bbox": f"{lon_min},{lat_min}~{lon_max},{lat_max}",
        "skip": skip                    # Для пагинации
    }

    try:
        response = await client.get(config.YANDEX_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Yandex API HTTP error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Yandex API request failed: {str(e)}")
        raise

    items = []
    for feature in data.get("features", []):
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [])
        
        if len(coords) < 2:
            continue
            
        lon_obj, lat_obj = coords[0], coords[1]
        props = feature.get("properties", {})
        
        name = props.get("name", "Без названия")
        
        company_meta = props.get("CompanyMetaData", {})
        address_data = company_meta.get("Address", {})
        address = address_data.get("formatted_address") or address_data.get("AddressLine") or props.get("address", "")
        
        categories = company_meta.get("Categories", [])
        rubrics = [r.get("name", "") for r in categories if r.get("name")]

        items.append({
            "name": name,
            "address": address,
            "lat": lat_obj,
            "lon": lon_obj,
            "rubrics": rubrics,
            "distance": haversine(lat, lon, lat_obj, lon_obj),
        })
    
    items.sort(key=lambda x: x["distance"])
    return items