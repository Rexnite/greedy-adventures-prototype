from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

from .intent import classify, contextual_query
from .knowledge import SOURCE, passages, retrieve
from .media import MEDIA, select_media
from .model import answer

app = FastAPI(title="Greedy Adventures Concierge", docs_url=None, redoc_url=None)


class Turn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: str = Field(max_length=6000)


class Query(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=2000, pattern=r".*\S.*")
    history: list[Turn] = Field(default_factory=list, max_length=12)


class ChatResponse(BaseModel):
    text: str
    mode: str
    intent: str
    media: list[dict]
    citations: list[dict]
    trace: dict


def route(q):
    history = [t.model_dump() for t in q.history]
    intent = classify(q.message, history)
    media = select_media(intent, q.message)
    found = retrieve(contextual_query(q.message, history))
    return history, intent, media, found


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/knowledge")
def knowledge():
    return {"source": SOURCE, "passages": passages, "media": MEDIA}


@app.post("/api/inspect")
def inspect(q: Query):
    _, intent, media, found = route(q)
    return {
        "question": q.message,
        "intent": intent,
        "selected_media_ids": [m["id"] for m in media],
        "retrieved_passage_ids": [p["id"] for p in found],
        "model_context": found,
        "model_called": False,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(q: Query):
    history, intent, media, found = route(q)
    if media:
        text = "Here " + (
            "are the brochure and official jump film."
            if len(media) == 2
            else "is the "
            + ("demo brochure." if media[0]["type"] == "pdf" else "official jump film.")
        )
        mode = "media"
    elif intent in ("BROCHURE_REQUEST", "VIDEO_REQUEST", "BROCHURE_AND_VIDEO"):
        text = "That requested file is not available in my media library. I can share the Sea View demo brochure or the official skydiving film instead."
        mode = "unavailable_media"
    elif intent == "UNKNOWN":
        text = "Would you like package information, a PDF brochure, or a video? If you mean both files, please say brochure and video."
        mode = "clarification"
    else:
        text, mode = await answer(q.message, history, found)
    return {
        "text": text,
        "mode": mode,
        "intent": intent,
        "media": media,
        "citations": [
            {"id": p["id"], "title": p["heading"], "url": p["url"]} for p in found
        ],
        "trace": {
            "intent": intent,
            "selected_media_ids": [m["id"] for m in media],
            "model_context": found,
            "model_called": mode == "live",
        },
    }
