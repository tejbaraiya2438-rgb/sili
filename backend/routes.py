from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.guardrails import is_campus_related
from backend.ollama_client import ask_ollama

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a campus-related question.",
        )

    if not is_campus_related(message):
        return ChatResponse(
            reply=(
                "Main SILI-PRO hoon, Silver Oak University (SOU) ki "
                "campus assistant. Main aapki campus navigation, "
                "buildings, rooms, laboratories, faculties aur university "
                "events se judi jaankari dene mein madad kar sakti hoon."
            )
        )

    try:
        answer = await ask_ollama(message)

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty response.",
            )

        return ChatResponse(reply=answer.strip())

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service is temporarily unavailable. "
                "Please try again shortly."
            ),
        )
