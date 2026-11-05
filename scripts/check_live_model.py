"""Opt-in real-provider smoke check. Run against the locally running app.

AI_PROVIDER chooses the provider on the backend, not in this script.
For hosted APIs, running this explicitly will consume model requests.
"""
import json
import time

import httpx


def main():
    history = []
    results = []
    with httpx.Client(base_url="http://127.0.0.1:3000", timeout=150) as client:
        for question in ["Tell me about VIP", "And the cheaper one?", "What is the cancellation policy?"]:
            start = time.monotonic()
            response = client.post("/api/chat", json={"message": question, "history": history})
            response.raise_for_status()
            data = response.json()
            assert data["mode"] == "live", data["text"]
            assert data["trace"]["model_called"] and data["citations"]
            assert data["text"].strip() and not data["media"]
            if question == "And the cheaper one?":
                assert "deluxe" in data["text"].lower(), data["text"]
            if "cancellation" in question:
                assert any(term in data["text"].lower() for term in
                           ["not provided", "not available", "does not", "don't have", "not include", "not specified", "isn't"]), data["text"]
            results.append({"question": question, "answer": data["text"],
                            "seconds": round(time.monotonic() - start, 1)})
            history.extend([{"role": "user", "content": question},
                            {"role": "assistant", "content": data["text"]}])
    print(json.dumps(results, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
