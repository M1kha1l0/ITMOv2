#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$PROJECT_DIR"

# Pick python interpreter
PY_BIN=""
if [[ -x ".venv/bin/python" ]]; then
  PY_BIN=".venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PY_BIN="$(command -v python)"
else
  echo "No python interpreter found" >&2
  exit 1
fi

"$PY_BIN" - <<'PY'
import subprocess, sys, os

def has_pkg(name):
    try:
        __import__(name)
        return True
    except Exception:
        return False

if not has_pkg('pytest'):
    venv = os.path.join(os.path.dirname(__file__), '..', '.venv')
    if os.path.isdir(venv):
        py = os.path.join(venv, 'bin', 'python')
        subprocess.check_call([py, '-m', 'pip', 'install', '-r', 'requirements.txt'])
    else:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
PY

# Run tests
if [[ -x ".venv/bin/pytest" ]]; then
  .venv/bin/pytest -q --maxfail=1
else
  pytest -q --maxfail=1
fi
