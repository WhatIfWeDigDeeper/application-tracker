import uvicorn

from .config import get_api_port

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=get_api_port(), reload=True)
