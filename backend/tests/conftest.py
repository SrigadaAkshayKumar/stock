import os
import sys

# Ensure 'backend' package root is on sys.path for tests
THIS_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(THIS_DIR, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# Keep test artefacts (Excel dev DB, generated reports) out of the repository.
import tempfile
os.environ.setdefault("STORAGE_DIR", tempfile.mkdtemp(prefix="stock-tests-"))
os.environ.setdefault("CACHE_ENABLED", "false")
os.environ.setdefault("NEWS_API_KEY", "")
