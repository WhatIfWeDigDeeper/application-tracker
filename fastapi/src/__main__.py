import os

import uvicorn

from .config import get_api_port

if __name__ == "__main__":
    reload_enabled = os.getenv("FASTAPI_RELOAD", "true").lower() == "true"
    uvicorn.run("src.main:app", host="0.0.0.0", port=get_api_port(), reload=reload_enabled)
