"""Simple per-client sliding-window rate limiter (in-process).

For multi-instance deployments swap this for a Redis-backed limiter; the
decorator interface stays the same.
"""

import threading
import time
from collections import defaultdict, deque
from functools import wraps

from flask import jsonify, request

from core.settings import settings

_lock = threading.Lock()
_hits = defaultdict(deque)


def _client_id() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    return forwarded.split(",")[0].strip() or request.remote_addr or "unknown"


def rate_limited(limit_per_minute: int = None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            limit = limit_per_minute or settings.RATE_LIMIT_PER_MINUTE
            key = f"{fn.__name__}:{_client_id()}"
            now = time.time()
            with _lock:
                window = _hits[key]
                while window and now - window[0] > 60:
                    window.popleft()
                if len(window) >= limit:
                    retry = int(60 - (now - window[0])) + 1
                    resp = jsonify({"error": "Rate limit exceeded", "retry_after_seconds": retry})
                    resp.status_code = 429
                    resp.headers["Retry-After"] = str(retry)
                    return resp
                window.append(now)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def reset_rate_limits() -> None:
    with _lock:
        _hits.clear()
