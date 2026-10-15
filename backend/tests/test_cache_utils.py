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


def test_memory_cache_bounded_lru_eviction(monkeypatch):
    import importlib
    monkeypatch.setenv("CACHE_ENABLED", "true")
    monkeypatch.setenv("REDIS_URL", "redis://invalid:0/0")
    monkeypatch.setenv("CACHE_MEMORY_MAX_ENTRIES", "3")
    cache_mod = importlib.import_module('utils.cache')
    importlib.reload(cache_mod)
    cache_mod.clear_memory_cache()

    cache_mod.set_cache("key1", "val1")
    cache_mod.set_cache("key2", "val2")
    cache_mod.set_cache("key3", "val3")

    assert cache_mod.get_cache("key1") == "val1"
    assert cache_mod.get_cache("key2") == "val2"
    assert cache_mod.get_cache("key3") == "val3"

    # Insert key4; key1 was accessed first among 1, 2, 3, but let's check order:
    # get_cache("key1") moved key1 to end. Then key2 moved to end. Then key3 moved to end.
    # Current LRU order: key1, key2, key3.
    # Inserting key4 should evict key1!
    cache_mod.set_cache("key4", "val4")
    assert cache_mod.get_cache("key1") is None
    assert cache_mod.get_cache("key2") == "val2"
    assert cache_mod.get_cache("key3") == "val3"
    assert cache_mod.get_cache("key4") == "val4"


def test_memory_cache_lru_access_updates_recency(monkeypatch):
    import importlib
    monkeypatch.setenv("CACHE_ENABLED", "true")
    monkeypatch.setenv("REDIS_URL", "redis://invalid:0/0")
    monkeypatch.setenv("CACHE_MEMORY_MAX_ENTRIES", "3")
    cache_mod = importlib.import_module('utils.cache')
    importlib.reload(cache_mod)
    cache_mod.clear_memory_cache()

    cache_mod.set_cache("a", "1")
    cache_mod.set_cache("b", "2")
    cache_mod.set_cache("c", "3")

    # Access "a" so "b" becomes the least recently used
    assert cache_mod.get_cache("a") == "1"

    # Insert "d" -> "b" should be evicted, "a" and "c" should remain
    cache_mod.set_cache("d", "4")
    assert cache_mod.get_cache("b") is None
    assert cache_mod.get_cache("a") == "1"
    assert cache_mod.get_cache("c") == "3"
    assert cache_mod.get_cache("d") == "4"


def test_memory_cache_prunes_expired_before_lru_eviction(monkeypatch):
    import importlib
    import time
    monkeypatch.setenv("CACHE_ENABLED", "true")
    monkeypatch.setenv("REDIS_URL", "redis://invalid:0/0")
    monkeypatch.setenv("CACHE_MEMORY_MAX_ENTRIES", "3")
    cache_mod = importlib.import_module('utils.cache')
    importlib.reload(cache_mod)
    cache_mod.clear_memory_cache()

    # Insert key1 with short TTL, keys 2 and 3 with long TTL
    cache_mod.set_cache("key1", "val1", ttl=1)
    cache_mod.set_cache("key2", "val2", ttl=60)
    cache_mod.set_cache("key3", "val3", ttl=60)

    # Wait for key1 to expire
    time.sleep(1.1)

    # Insert key4. Because key1 is expired, it should be pruned,
    # preserving valid keys 2 and 3 without evicting them.
    cache_mod.set_cache("key4", "val4", ttl=60)
    assert cache_mod.get_cache("key1") is None
    assert cache_mod.get_cache("key2") == "val2"
    assert cache_mod.get_cache("key3") == "val3"
    assert cache_mod.get_cache("key4") == "val4"