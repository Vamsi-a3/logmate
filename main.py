"""
ASGI entry used by some hosts (Render templates often use `uvicorn main:app`).
Imports via application.py so cwd/sys.path match web_app.py on Render.
"""
from application import app

__all__ = ["app"]
