"""
ASGI entry for PaaS hosts (Render, etc.) where the process cwd is not the app folder.

Use start command:
  uvicorn application:app --host 0.0.0.0 --port $PORT
"""
from pathlib import Path
import os
import sys

_root = Path(__file__).resolve().parent
os.chdir(_root)
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from web_app import app  # noqa: E402

__all__ = ["app"]
