# Changelog

All notable changes to this project are documented here. This log maps changes to specific files so you can review or revert confidently.

## 2025-08-30

### Added
- Backend response caching utilities with Redis and in-memory fallback:
  - File: `backend/utils/cache.py`
  - Env vars: `CACHE_ENABLED`, `REDIS_URL`, `CACHE_TTL_STOCK`, `CACHE_TTL_PRED`
  - Helpers: `get_cache`, `set_cache`, `cache_key_from`, `is_cache_enabled`
  - Behavior: Tries Redis; falls back to in-memory TTL cache when Redis is unavailable.
- Caching integration tests using Flask test client to validate MISS/HIT/BYPASS and call counts:
  - File: `backend/tests/test_integration_cache.py`
- Cache utility unit tests to validate stable keys and memory fallback:
  - File: `backend/tests/test_cache_utils.py`
- Test configuration to add backend to `sys.path`:
  - File: `backend/tests/conftest.py`
- Setup documentation for optional API response caching (headers, refresh bypass, env vars):
  - File: `SETUP.md` (added the “Optional: Enable API response caching (Redis or in-memory)” section)

### Changed
- Stock API routes now leverage cache and emit cache headers:
  - File: `backend/routes/stock_routes.py`
  - Endpoints:
    - `GET /api/stock/<symbol>` (key includes `chart_period`, `table_period`)
    - `GET /api/stock/<symbol>/predict`
  - Behavior:
    - Adds `X-Cache` header: `HIT`, `MISS`, or `BYPASS`
    - Supports `?refresh=true` to bypass cache
    - Normalizes handler outputs to a Flask `Response` before adding headers/caching
- Frontend layout refinements for sticky, non-overlapping footer:
  - File: `src/App.css`
    - `.app-container` is the flex container; `.content` grows to push footer down
  - File: `src/components/Footer.css`
    - Sticky bottom via `margin-top: auto`, `flex-shrink: 0`, and `z-index`
  - File: `src/components/StockList.module.css`
    - Adjusted spacing and `z-index` to avoid overlap with footer
- App shell cleanup (removed debug overlay entry points):
  - File: `src/App.js` (removed any Theme debug overlay usage)

### Dependencies
- Backend requirements updated to include runtime and optional cache client:
  - File: `backend/requirements.txt`
  - Notable: `redis` added (optional at runtime); ensured `Flask` and testing stack present

### How to verify
- Headers:
  - Call `/api/stock/TEST?chart_period=1d&table_period=1d` twice and observe `X-Cache`: `MISS` ➜ `HIT`. Use `&refresh=true` to observe `BYPASS`.
- Tests:
  - From repo root (with backend venv), run `pytest` in `backend/` to execute unit and integration tests.

### Notes
- Caching is fail-open: on Redis issues, the app falls back to in-memory cache.
- Default TTLs: 15m for stock data, 60m for predictions; configurable via env vars.