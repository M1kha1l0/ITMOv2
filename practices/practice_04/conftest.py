import os
import sys

# Ensure project root is on sys.path for tests
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Mark tests environment for main.ensure_runtime guard
os.environ.setdefault("PYTEST_CURRENT_TEST", "1")
