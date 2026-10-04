"""Data-access layer.

Services never talk to a storage engine directly; they use the repository
returned by :func:`get_repository`. During development the repository is an
Excel workbook (one sheet per table). The same table/column contract is
defined for PostgreSQL in ``db/schema.sql`` so the backend can be switched
with ``DB_BACKEND=postgres`` once a Postgres implementation is plugged in.
"""

import threading

from core.settings import settings
from repositories.excel_store import ExcelStore

_repo = None
_lock = threading.Lock()


def get_repository():
    global _repo
    with _lock:
        if _repo is None:
            if settings.DB_BACKEND != "excel":
                raise NotImplementedError(
                    f"DB_BACKEND={settings.DB_BACKEND!r} is not implemented yet; "
                    "use 'excel' for development (see docs/DATABASE.md)"
                )
            _repo = ExcelStore(settings.EXCEL_DB_PATH)
        return _repo


def set_repository(repo) -> None:
    """Override the repository (used by tests)."""
    global _repo
    with _lock:
        _repo = repo
