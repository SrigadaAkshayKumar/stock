import os
import sys

# Ensure 'backend' package root is on sys.path for tests
THIS_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(THIS_DIR, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)
