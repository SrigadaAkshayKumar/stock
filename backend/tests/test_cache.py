import unittest
from unittest.mock import patch

from utils import cache


class InMemoryCacheTests(unittest.TestCase):
    def setUp(self):
        cache._memory_cache.clear()
        self.redis_patch = patch.object(cache, "_get_redis_client", return_value=None)
        self.redis_patch.start()
        self.cache_enabled_patch = patch.object(cache, "CACHE_ENABLED", True)
        self.cache_enabled_patch.start()

    def tearDown(self):
        cache._memory_cache.clear()
        self.cache_enabled_patch.stop()
        self.redis_patch.stop()

    def test_memory_cache_evicts_least_recently_used_entry(self):
        with patch.object(cache, "MEMORY_CACHE_MAX_SIZE", 2):
            cache.set_cache("first", "1")
            cache.set_cache("second", "2")
            self.assertEqual(cache.get_cache("first"), "1")
            cache.set_cache("third", "3")

            self.assertEqual(len(cache._memory_cache), 2)
            self.assertEqual(cache.get_cache("first"), "1")
            self.assertIsNone(cache.get_cache("second"))
            self.assertEqual(cache.get_cache("third"), "3")

    def test_expired_entries_are_removed_before_size_eviction(self):
        with patch.object(cache, "MEMORY_CACHE_MAX_SIZE", 2), patch.object(
            cache.time, "time", side_effect=[100.0, 100.0, 103.0, 103.0, 103.0]
        ):
            cache.set_cache("expired", "old", ttl=2)
            cache.set_cache("live", "new", ttl=10)
            cache.set_cache("next", "value", ttl=10)

            self.assertEqual(len(cache._memory_cache), 2)
            self.assertIsNone(cache.get_cache("expired"))
            self.assertEqual(cache.get_cache("live"), "new")
            self.assertEqual(cache.get_cache("next"), "value")


if __name__ == "__main__":
    unittest.main()
