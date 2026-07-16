import asyncio
from fastapi import APIRouter, HTTPException, Query, Request
from app.services.redis_client import get_redis_client
from app.services.dgis import fetch_nearby_dgis, DEFAULT_PLACE_TYPES
from app.services.classifier import classify_place, get_place_type
from app.config import config
from app.models.property import NearbyPlace, NearbyResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nearby", tags=["nearby"])

# Типы объектов БЕЗ организаций ("branch") — для категорий, где нужен сам
# физический объект (станция, кладбище), а не любая компания, у которой
# в названии просто встречается похожее слово (например, строительная
# фирма "ЖД-Строй" не должна попадать в выдачу по запросу "железная
# дорога"). Это фильтрация ещё на уровне запроса к API — до классификатора.
INFRASTRUCTURE_ONLY_TYPES = "building,station,station.metro,attraction"

# 1. ШИРОКИЕ ЗАПРОСЫ ДЛЯ 2ГИС.
# Формат: (текст запроса, типы объектов для этого конкретного запроса).
# types=None -> используется DEFAULT_PLACE_TYPES (включая организации).
#
# Категории объединены в минимально возможное число запросов (экономим
# лимиты 2ГИС), но при этом покрывают весь список из ТЗ: детские сады,
# школы, площадки, парки/скверы/набережные, спорт (в т.ч. ФОК/бассейн),
# медицину, супермаркеты, метро и наземный транспорт — для "хороших";
# и промышленность/ТЭЦ/очистные, свалки/полигоны, ж/д, ночные клубы/бары,
# кладбища, аэропорт — для "плохих".
API_GOOD_QUERIES = [
    ("школа лицей гимназия детский сад университет образование", None),
    ("парк сквер набережная", None),
    ("детская площадка", None),
    ("спорт фитнес", None),
    ("больница медсанчасть поликлиника медицина", None),
    ("супермаркет", None),
    ("метро остановка транспорта", None),
]

API_BAD_QUERIES = [
    ("промышленность тэц котельная очистные", None),
    ("свалка мусор полигон", None),
    ("железная дорога", INFRASTRUCTURE_ONLY_TYPES),
    ("ночной клуб бар", None),
    ("кладбище", None),
    ("аэропорт", None),
]


@router.get("/", response_model=NearbyResponse)
async def fetch_nearby_2gis(
    request: Request,
    lat: float = Query(..., description="Широта"),
    lon: float = Query(..., description="Долгота"),
    radius: int = Query(config.DEFAULT_SEARCH_RADIUS, ge=500, le=5000),
    nocache: bool = False,
):
    redis_client = get_redis_client()
    cache_key = f"2gis_nearby:{lat:.3f}:{lon:.3f}:{radius}"

    if not nocache:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            response = NearbyResponse.model_validate_json(cached_data)
            response.cached = True
            return response

    http_client = request.app.state.dgis_client

    good_tasks = [
        fetch_nearby_dgis(http_client, lat, lon, radius, search_query=q,
                           place_types=types or DEFAULT_PLACE_TYPES)
        for q, types in API_GOOD_QUERIES
    ]

    bad_tasks = [
        fetch_nearby_dgis(http_client, lat, lon, radius, search_query=q,
                           place_types=types or DEFAULT_PLACE_TYPES)
        for q, types in API_BAD_QUERIES
    ]

    all_good_results = await asyncio.gather(*good_tasks, return_exceptions=True)
    all_bad_results = await asyncio.gather(*bad_tasks, return_exceptions=True)

    unique = {}

    def dedup_key(item):
        # Уникальный id объекта из 2ГИС надёжнее координат: одна и та же
        # организация может встретиться в двух разных запросах (например,
        # и в "образование", и в "медицина"), а float-координаты в двух
        # ответах API иногда отличаются в последнем знаке — из-за этого
        # старый ключ по "lat_lon" изредка создавал дубликаты одного и
        # того же объекта с чуть разным расстоянием.
        if item.get("id"):
            return f"id:{item['id']}"
        return f"coord:{round(item['lat'], 5)}_{round(item['lon'], 5)}"

    def process_items(results_list):
        for items in results_list:
            if isinstance(items, Exception):
                logger.error(f"Ошибка при обращении к API 2GIS: {items}")
                continue
            if not isinstance(items, list):
                continue

            for item in items:
                name = item.get("name", "")
                rubrics = item.get("rubrics", [])

                real_category = classify_place(name, rubrics)

                if real_category == "unknown":
                    continue

                key = dedup_key(item)
                if key not in unique or real_category == "good":
                    unique[key] = (item, real_category)

    process_items(all_good_results)
    process_items(all_bad_results)

    good, bad = [], []
    for item, category in unique.values():
        place = NearbyPlace(
            name=item["name"],
            address=item.get("address", ""),
            category=category,
            type=get_place_type(item.get("rubrics", [])),
            distance_meters=round(item["distance"], 1),
            lat=item["lat"],
            lon=item["lon"],
        )
        if place.type != "other":
            if category == "good":
                good.append(place)
            else:
                bad.append(place)

    response = NearbyResponse(
        good=sorted(good, key=lambda x: x.distance_meters)[:30],
        bad=sorted(bad, key=lambda x: x.distance_meters)[:20],
        total_good=len(good),
        total_bad=len(bad),
        radius_used=radius,
        cached=False,
    )

    redis_client.setex(cache_key, config.CACHE_TTL_SECONDS, response.model_dump_json())
    return response
