"""
Caching utilities with Redis backend and bounded in-memory fallback.

Env vars:
  - CACHE_ENABLED (default: true)
  - REDIS_URL (default: redis://localhost:6379/0)
  - CACHE_TTL_STOCK (default: 900 seconds)
  - CACHE_TTL_PRED (default: 3600 seconds)
  - CACHE_MEMORY_MAX_SIZE (default: 1024 entries)

Functions:
  - get_cache(key) -> Optional[str]
  - set_cache(key, value, ttl=None) -> bool
  - cache_key_from(path: str, params: dict) -> str
  - is_cache_enabled() -> bool

Adds X-Cache header handling at call sites; this module only manages storage.
"""

from __future__ import annotations

import json
import logging
import os
import time
from collections import OrderedDict
from typing import Any, Dict, Optional, Tuple

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover - redis optional at runtime
    redis = None  # type: ignore

_logger = logging.getLogger(__name__)


def _str2bool(v: Optional[str], default: bool = True) -> bool:
    if v is None:
        return default
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


CACHE_ENABLED: bool = _str2bool(os.getenv("CACHE_ENABLED"), True)
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DEFAULT_TTL_STOCK: int = int(os.getenv("CACHE_TTL_STOCK", "900"))
DEFAULT_TTL_PRED: int = int(os.getenv("CACHE_TTL_PRED", "3600"))
MEMORY_CACHE_MAX_SIZE: int = int(os.getenv("CACHE_MEMORY_MAX_SIZE", "1024"))
if MEMORY_CACHE_MAX_SIZE < 1:
    raise ValueError("CACHE_MEMORY_MAX_SIZE must be at least 1")

_redis_client = None
_memory_cache: "OrderedDict[str, Tuple[str, Optional[float]]]" = OrderedDict()


def is_cache_enabled() -> bool:
    return CACHE_ENABLED


def _get_redis_client():
    global _redis_client
    if not CACHE_ENABLED:
        return None
    if redis is None:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        # Validate connectivity early
        client.ping()
        _redis_client = client
        _logger.info("Redis cache connected")
        return _redis_client
    except Exception as e:  # pragma: no cover - depends on env
        _logger.warning(f"Redis unavailable ({e}); falling back to in-memory cache")
        return None


def _evict_expired_entries() -> None:
    """Remove expired in-memory entries before applying the size limit."""
    now = time.time()
    expired_keys = [
        key
        for key, (_, expires_at) in _memory_cache.items()
        if expires_at is not None and now > expires_at
    ]
    for key in expired_keys:
        _memory_cache.pop(key, None)


def get_cache(key: str) -> Optional[str]:
    """Return cached string payload if present and not expired."""
    if not CACHE_ENABLED:
        return None

    client = _get_redis_client()
    if client is not None:
        try:
            result = client.get(key)
            return str(result) if result is not None else None
        except Exception as e:  # pragma: no cover
            _logger.warning(f"Redis GET failed: {e}")
            return None

    # Fallback: bounded LRU in-memory cache with TTL.
    entry = _memory_cache.get(key)
    if not entry:
        return None
    value, expires_at = entry
    if expires_at is not None and time.time() > expires_at:
        _memory_cache.pop(key, None)
        return None

    _memory_cache.move_to_end(key)
    return value


def set_cache(key: str, value: str, ttl: Optional[int] = None) -> bool:
    """Set cache value with optional TTL (seconds)."""
    if not CACHE_ENABLED:
        return False

    client = _get_redis_client()
    if client is not None:
        try:
            if ttl:
                client.setex(key, ttl, value)
            else:
                client.set(key, value)
            return True
        except Exception as e:  # pragma: no cover
            _logger.warning(f"Redis SET failed: {e}")

    # Fallback: bounded LRU in-memory cache.
    _evict_expired_entries()
    expires_at = (time.time() + ttl) if ttl else None
    _memory_cache[key] = (value, expires_at)
    _memory_cache.move_to_end(key)

    while len(_memory_cache) > MEMORY_CACHE_MAX_SIZE:
        _memory_cache.popitem(last=False)
    return True


def cache_key_from(path: str, params: Dict[str, Any]) -> str:
    """Stable composite key using sorted params."""
    items = []
    for k in sorted(params.keys()):
        v = params[k]
        if isinstance(v, (dict, list)):
            v = json.dumps(v, sort_keys=True)
        items.append(f"{k}={v}")
    param_str = "&".join(items)
    return f"resp:{path}?{param_str}"


__all__ = [
    "get_cache",
    "set_cache",
    "cache_key_from",
    "is_cache_enabled",
    "DEFAULT_TTL_STOCK",
    "DEFAULT_TTL_PRED",
    "MEMORY_CACHE_MAX_SIZE",
]
