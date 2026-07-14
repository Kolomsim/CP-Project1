import redis
from app.config import config

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            config.REDIS_URL,
            decode_responses=True,
        )
    return _redis_client