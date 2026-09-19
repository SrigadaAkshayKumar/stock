import os
import json
from utils.cache import cache_key_from, set_cache, get_cache, is_cache_enabled


def test_cache_key_from_stable():
    key1 = cache_key_from('/api/stock/RELIANCE', {"chart_period": "1mo", "table_period": "1mo"})
    key2 = cache_key_from('/api/stock/RELIANCE', {"table_period": "1mo", "chart_period": "1mo"})
    assert key1 == key2
    assert key1.startswith("resp:/api/stock/RELIANCE?")


def test_memory_cache_fallback(monkeypatch):
    monkeypatch.setenv("CACHE_ENABLED", "true")
    # Ensure redis is not used by setting invalid URL so code falls back
    monkeypatch.setenv("REDIS_URL", "redis://invalid:0/0")

    # Re-import to apply env; in real suite, design for DI. Here keep it simple.
    import importlib
    cache_mod = importlib.import_module('utils.cache')
    importlib.reload(cache_mod)

    key = cache_mod.cache_key_from('/api/stock/TCS', {"chart_period": "1d", "table_period": "1d"})
    payload = json.dumps({"ok": True})
    # Use a TTL that comfortably exceeds potential fallback delays
    assert cache_mod.set_cache(key, payload, ttl=5) is True
    assert cache_mod.get_cache(key) == payload


def test_cache_miss_then_hit(monkeypatch):
    import importlib
    monkeypatch.setenv("CACHE_ENABLED", "true")
    monkeypatch.setenv("REDIS_URL", "redis://invalid:0/0")
    cache_mod = importlib.import_module('utils.cache')
    importlib.reload(cache_mod)

    key = cache_mod.cache_key_from('/api/stock/INFY', {"chart_period": "1mo", "table_period": "1mo"})
    assert cache_mod.get_cache(key) is None  # miss
    payload = json.dumps({"ok": 1})
    cache_mod.set_cache(key, payload, ttl=10)
    assert cache_mod.get_cache(key) == payload  # hit