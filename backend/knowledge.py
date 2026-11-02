import json
import re
from pathlib import Path

from rank_bm25 import BM25Okapi

DATA = Path(__file__).parent / "data"
SOURCE = json.loads((DATA / "source.json").read_text(encoding="utf8"))
# Section boundaries follow the source's real heading hierarchy.
text = SOURCE["text"]
markers = [
    "Choose your package",
    "The plan",
    "The details",
    "Where you jump",
    "Good to know",
]
start = text.index(markers[0])
passages = []
for i, heading in enumerate(markers):
    a = text.index(heading, start)
    b = (
        text.index(markers[i + 1], a + len(heading))
        if i + 1 < len(markers)
        else text.index("\n1\n/\n7", a)
    )
    passages.append(
        {
            "id": f"sea-view-{i + 1:02d}",
            "heading": heading,
            "text": text[a:b].strip(),
            "source_id": SOURCE["id"],
            "url": SOURCE["url"],
        }
    )


def tokens(s):
    return re.findall(r"\w+", s.casefold())


index = BM25Okapi([tokens(p["text"]) for p in passages])


def retrieve(query):
    scores = index.get_scores(tokens(query))
    ranked = sorted(zip(passages, scores), key=lambda x: x[1], reverse=True)
    return [
        dict(p, score=round(float(score), 5)) for p, score in ranked[:3] if score > 0
    ]
