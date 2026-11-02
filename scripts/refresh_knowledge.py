"""Explicit development-only single-page capture. Never executed by chat."""

import json
from datetime import UTC, datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.greedyadventures.com/experiences/sea-view-skydiving"


def main():
    r = requests.get(URL, timeout=30)
    r.raise_for_status()
    s = BeautifulSoup(r.text, "html.parser")
    for tag in s(["script", "style", "nav", "footer"]):
        tag.decompose()
    text = s.get_text("\n", strip=True)
    for heading in [
        "Choose your package",
        "The plan",
        "The details",
        "Where you jump",
        "Good to know",
    ]:
        if heading not in text:
            raise RuntimeError(
                "Source structure changed. Review ingestion and retrieval boundaries before refreshing."
            )
    snapshot = {
        "id": "sea-view",
        "title": s.title.get_text() if s.title else "Sea View Skydiving",
        "url": URL,
        "captured_at": datetime.now(UTC).isoformat(),
        "text": text,
    }
    path = ROOT / "backend/data/source.json"
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf8")
    print(
        "Captured one public page. Review the snapshot diff, package prices, location discrepancy and registry before committing. Restart backend to reload."
    )


if __name__ == "__main__":
    main()
