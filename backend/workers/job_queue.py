"""In-process background job queue.

Heavy work (report generation, news ingestion, embedding) runs here so it
never blocks user-facing requests. The interface (``submit`` / ``status``)
mirrors what a Celery/RQ/SQS worker would expose, so it can be replaced by
a distributed queue without touching the API layer.
"""

import logging
import threading
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Dict, Optional

from core.settings import settings
from repositories.excel_store import utc_now

logger = logging.getLogger(__name__)


class JobQueue:
    def __init__(self, workers: int = None):
        self._executor = ThreadPoolExecutor(max_workers=workers or settings.WORKER_THREADS,
                                            thread_name_prefix="worker")
        self._jobs: Dict[str, Dict] = {}
        self._lock = threading.Lock()

    def submit(self, job_type: str, fn: Callable, *args, **kwargs) -> Dict:
        job_id = uuid.uuid4().hex
        job = {"id": job_id, "type": job_type, "status": "queued", "created_at": utc_now(),
               "started_at": None, "finished_at": None, "result": None, "error": None}
        with self._lock:
            self._jobs[job_id] = job

        def run():
            self._update(job_id, status="running", started_at=utc_now())
            try:
                result = fn(*args, **kwargs)
                self._update(job_id, status="completed", result=result, finished_at=utc_now())
            except Exception as exc:
                logger.error("Job %s (%s) failed: %s\n%s", job_id, job_type, exc, traceback.format_exc())
                self._update(job_id, status="failed", error=str(exc), finished_at=utc_now())

        self._executor.submit(run)
        return dict(job)

    def _update(self, job_id: str, **changes) -> None:
        with self._lock:
            self._jobs[job_id].update(changes)

    def status(self, job_id: str) -> Optional[Dict]:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None


job_queue = JobQueue()
