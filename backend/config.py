import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "")
OLLAMA_BASE_URL = os.getenv(
    "OLLAMA_BASE_URL", "https://ollama.com"
).rstrip("/")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "")

APP_NAME = "SILI"
APP_VERSION = "1.0.0"
