import asyncio
from fastapi import APIRouter, HTTPException, Query, Request
from typing import List
from app.services.redis_client import get_redis_client
from backend.app.services.dgis import fetch_nearby_yandex
from app.services.classifier import classify_place, get_place_type
from app.config import config
from app.models.property import NearbyPlace, NearbyResponse

router = APIRouter(prefix="/api/nearby", tags=["nearby"])

# Список категорий для точечного поиска
CATEGORIES = {
    "education": "школа, детский сад, гимназия, лицей",
    "health": "поликлиника, больница, медцентр",
    "parks": "парк, сквер, набережная",
    "transport": "метро, ж/д станция",
    "industry": "завод, промзона, тэц, котельная",
    "unpleasant": "свалка, кладбище, лэп"
}

@router.get("/", response_model=NearbyResponse)
async def get_nearby_places(
    request: Request,
    lat: float = Query(..., description="Широта"),
    lon: float = Query(..., description="Долгота"),
    radius: int = Query(config.DEFAULT_SEARCH_RADIUS, ge=500, le=5000),
):
    redis_client = get_redis_client()
    cache_key = f"yandex_nearby:{lat:.6f}:{lon:.6f}:{radius}"

    
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return NearbyResponse.model_validate_json(cached_data)

    http_client = request.app.state.yandex_client
    
    # Параллельный запрос по категориям
    tasks = [
        fetch_nearby_yandex(http_client, lat, lon, radius, search_query=query)
        for query in CATEGORIES.values()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Фильтрация: максимум 5 объектов на каждую категорию
    raw_items = []
    for res in results:
        if isinstance(res, list):
            # Сортируем по дистанции и берем только топ-5
            raw_items.extend(sorted(res, key=lambda x: x["distance"])[:5])

    # Удаление дубликатов по координатам
    unique_items = {f"{i['lat']}_{i['lon']}": i for i in raw_items}.values()

    # Классификация
    good, bad = [], []
    for item in unique_items:
        category = classify_place(item["name"], item.get("rubrics", []))

        if category == "unknown":
            continue
        
        place = NearbyPlace(
            name=item["name"],
            address=item.get("address", ""),
            category=category,
            type=get_place_type(item["name"], item.get("rubrics", [])),
            distance_meters=round(item["distance"], 1),
            lat=item["lat"],
            lon=item["lon"],
        )

        if category == "good":
            good.append(place)
        elif category == "bad":
            bad.append(place)

    # Финализация ответа
    response = NearbyResponse(
        good=sorted(good, key=lambda x: x.distance_meters),
        bad=sorted(bad, key=lambda x: x.distance_meters),
        total_good=len(good),
        total_bad=len(bad),
        radius_used=radius,
        cached=False,
    )

    redis_client.setex(cache_key, config.CACHE_TTL_SECONDS, response.model_dump_json())
    return response