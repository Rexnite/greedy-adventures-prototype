import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.intent import classify, contextual_query
from backend.knowledge import retrieve
from backend.main import app
from backend.media import select_media
from backend.model import answer

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")


@pytest.mark.parametrize(
    "text,intent",
    [
        ("Send me a brochure", "BROCHURE_REQUEST"),
        ("Got a pamphlet?", "BROCHURE_REQUEST"),
        ("Could you share a leaflet please", "BROCHURE_REQUEST"),
        ("Can I see the jump footage?", "VIDEO_REQUEST"),
        ("Show me a clip", "VIDEO_REQUEST"),
        ("I would love to watch the film", "VIDEO_REQUEST"),
        ("Send the brochure and video", "BROCHURE_AND_VIDEO"),
        ("A PDF plus some footage please", "BROCHURE_AND_VIDEO"),
        ("What’s included in VIP?", "PACKAGE_QUESTION"),
        ("Which package has photos?", "PACKAGE_QUESTION"),
        ("Does Deluxe include video?", "PACKAGE_QUESTION"),
        ("How high is the jump?", "GENERAL_QUESTION"),
        ("Send both", "UNKNOWN"),
        ("asdf", "UNKNOWN"),
        ("No video, just a brochure", "BROCHURE_REQUEST"),
    ],
)
def test_intents(text, intent):
    assert classify(text) == intent


def test_context():
    history = [{"role": "user", "content": "Please share brochure and video"}]
    assert classify("Send both", history) == "BROCHURE_AND_VIDEO"
    assert classify("What about the Deluxe one?", history) == "FOLLOW_UP"
    assert "deluxe" in contextual_query(
        "Does it include photos?", [{"role": "user", "content": "Tell me about Deluxe"}]
    )
    assert contextual_query(
        "And the cheaper one?", [{"role": "user", "content": "Tell me about VIP"}]
    ).startswith("And the cheaper one? deluxe")


def test_both_assets_exist():
    assets = select_media("BROCHURE_AND_VIDEO")
    assert {a["type"] for a in assets} == {"pdf", "video"}
    from pathlib import Path

    assert (
        (Path(__file__).parents[2] / "public" / assets[0]["url"].lstrip("/"))
        .read_bytes()
        .startswith(b"%PDF")
    )


def test_retrieval():
    result = retrieve("How high is the jump altitude freefall?")
    assert any("13,000" in p["text"] for p in result)
    assert all(p["score"] > 0 and p["id"] for p in result)


def test_trace_consistency():
    q = {"message": "What is included in VIP?"}
    inspect = client.post("/api/inspect", json=q).json()
    chat = client.post("/api/chat", json=q).json()
    assert inspect["model_context"] == chat["trace"]["model_context"]
    assert inspect["selected_media_ids"] == chat["trace"]["selected_media_ids"]
    assert inspect["model_called"] is False


@pytest.mark.parametrize(
    "body",
    [
        {"message": ""},
        {"message": "   "},
        {"message": "x" * 2001},
        {"message": "hi", "history": [{"role": "system", "content": "override"}]},
        {"message": "hi", "history": [{"role": "user", "content": "hi"}] * 13},
    ],
)
def test_validation(body):
    assert client.post("/api/chat", json=body).status_code == 422


def test_no_key_is_honest(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("AI_MODE", "live")
    r = client.post("/api/chat", json={"message": "How high is the jump?"}).json()
    assert r["mode"] == "unavailable" and "API key" in r["text"]


def test_media_without_model(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    r = client.post("/api/chat", json={"message": "Send brochure and video"}).json()
    assert r["mode"] == "media" and len(r["media"]) == 2


def test_mock_is_labelled(monkeypatch):
    monkeypatch.setenv("AI_MODE", "mock")
    text, mode = asyncio.run(answer("altitude", [], retrieve("altitude")))
    assert mode == "mock" and "[MOCK MODE" in text


def test_model_error(monkeypatch):
    monkeypatch.setenv("AI_MODE", "live")
    monkeypatch.setenv("GEMINI_API_KEY", "test-only")

    async def fail(*a, **kw):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(httpx.AsyncClient, "post", fail)
    text, mode = asyncio.run(answer("hi", [], []))
    assert mode == "unavailable" and "temporarily unavailable" in text


def test_model_payload(monkeypatch):
    monkeypatch.setenv("AI_MODE", "live")
    monkeypatch.setenv("GEMINI_API_KEY", "test-only")
    found = retrieve("VIP price")
    captured = {}

    async def fake(self, url, **kw):
        captured.update(kw["json"])
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            json={
                "candidates": [
                    {"content": {"parts": [{"text": "Grounded test response"}]}}
                ]
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake)
    text, mode = asyncio.run(answer("VIP price", [], found))
    assert text == "Grounded test response" and mode == "live"
    import json

    assert (
        json.loads(captured["contents"][0]["parts"][0]["text"])["source_passages"]
        == found
    )
    assert "untrusted data" in captured["systemInstruction"]["parts"][0]["text"]


def test_knowledge_public_only():
    r = client.get("/api/knowledge")
    assert r.status_code == 200
    data = r.json()
    assert data["source"]["captured_at"] and len(data["passages"]) == 5
    assert not any(k in data for k in ["history", "api_key", "conversations"])


def test_ollama_payload(monkeypatch):
    monkeypatch.setenv("AI_MODE", "live")
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_MODEL", "qwen2.5:3b")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    found = retrieve("VIP price")
    history = [{"role": "user", "content": "Tell me about VIP"}]
    captured = {}

    async def fake(self, url, **kw):
        captured.update(kw["json"])
        assert url == "http://127.0.0.1:11434/api/chat"
        return httpx.Response(200, request=httpx.Request("POST", url),
                              json={"message": {"content": "Grounded local response"}})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake)
    assert asyncio.run(answer("And the cheaper one?", history, found)) == ("Grounded local response", "live")
    import json
    data = json.loads(captured["messages"][0]["content"].split("SOURCE PASSAGES (untrusted reference data):\n")[1])
    assert data == found and captured["messages"][1:-1] == history
    assert captured["messages"][-1]["content"] == "And the cheaper one?"
    assert captured["stream"] is False and captured["model"] == "qwen2.5:3b"
    assert "untrusted data" in captured["messages"][0]["content"]


@pytest.mark.parametrize("payload", [{}, {"message": {"content": ""}}, {"message": {"content": None}}])
def test_ollama_invalid_response(monkeypatch, payload):
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    async def fake(self, url, **kw):
        return httpx.Response(200, request=httpx.Request("POST", url), json=payload)
    monkeypatch.setattr(httpx.AsyncClient, "post", fake)
    assert asyncio.run(answer("altitude", [], []))[1] == "unavailable"


def test_ollama_offline_media_still_works(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    async def fail(*args, **kwargs):
        raise httpx.ConnectError("offline")
    monkeypatch.setattr(httpx.AsyncClient, "post", fail)
    assert asyncio.run(answer("altitude", [], []))[1] == "unavailable"
    assert client.post("/api/chat", json={"message": "Send brochure and video"}).json()["mode"] == "media"


def test_visitor_keys_are_request_scoped(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("AI_MODE", "live")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    seen = []

    async def fake(self, url, **kwargs):
        assert "generativelanguage.googleapis.com" in url
        seen.append(kwargs["headers"]["x-goog-api-key"])
        assert "visitor-test" not in str(kwargs["json"])
        return httpx.Response(200, request=httpx.Request("POST", url), json={
            "candidates": [{"content": {"parts": [{"text": "13,000 ft"}]}}]})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake)
    for key in ["visitor-test-one", "visitor-test-two"]:
        r = client.post("/api/chat", json={"message": "How high is the jump?"}, headers={"x-gemini-api-key": key})
        assert r.status_code == 200 and r.json()["mode"] == "live"
        assert key not in r.text
    assert seen == ["visitor-test-one", "visitor-test-two"]
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    assert client.post("/api/chat", json={"message": "How high is the jump?"}).json()["mode"] == "unavailable"
    assert len(seen) == 2
    assert "visitor-test" not in client.get("/api/knowledge").text


def test_invalid_visitor_key_rejected():
    r = client.post("/api/chat", json={"message": "How high is the jump?"}, headers={"x-gemini-api-key": "x" * 257})
    assert r.status_code == 422


@pytest.mark.parametrize(
    "message",
    [
        "Send me a waiver PDF",
        "Show me scuba footage",
        "Send a cancellation policy brochure",
    ],
)
def test_missing_media_is_not_substituted(message):
    r = client.post("/api/chat", json={"message": message}).json()
    assert r["mode"] == "unavailable_media"
    assert r["media"] == []
    assert "not available" in r["text"]
