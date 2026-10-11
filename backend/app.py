
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import APP_VERSION
from backend.routes import router as chat_router
from services.text_to_speech import router as speech_router

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="SILI-PRO | Silver Oak University",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static",
)

@app.get("/", include_in_schema=False)
async def home():
    return FileResponse(BASE_DIR / "index.html")

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "app": "SILI-PRO",
        "version": APP_VERSION,
    }

app.include_router(chat_router, prefix="/api")
app.include_router(speech_router, prefix="/api")
