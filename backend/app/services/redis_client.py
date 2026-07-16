import logging

import redis

from app.config import config

logger = logging.getLogger(__name__)

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            config.REDIS_URL,
            decode_responses=True,
        )
    return _redis_client


def cache_get(key: str) -> str | None:
    if not config.USE_REDIS:
        return None
    try:
        return get_redis_client().get(key)
    except Exception as exc:
        logger.warning("Redis cache read failed for %s: %s", key, exc)
        return None


def cache_set(key: str, value: str, ttl_seconds: int) -> None:
    if not config.USE_REDIS:
        return
    try:
        get_redis_client().setex(key, ttl_seconds, value)
    except Exception as exc:
        logger.warning("Redis cache write failed for %s: %s", key, exc)
