import re

VIDEO = "https://www.greedyadventures.com/greedy/films/sea-view-studio-hero.mp4"
MEDIA = [
    {
        "id": "demo-brochure",
        "title": "Sea View experience guide",
        "type": "pdf",
        "url": "/media/sea-view-demo-brochure.pdf",
        "source_url": "https://www.greedyadventures.com/experiences/sea-view-skydiving",
        "official": False,
        "status": "available",
        "attribution": "Demo document generated from Greedy Adventures public experience page.",
    },
    {
        "id": "official-jump-film",
        "title": "Main video of the jump",
        "type": "video",
        "url": VIDEO,
        "source_url": VIDEO,
        "official": True,
        "status": "available",
        "attribution": "Greedy Adventures. Remote media, verified HTTP 206 video/mp4.",
    },
]


def select_media(intent, message=""):
    # This registry has no policy documents, waivers or other sports' media.
    if re.search(
        r"\b(waiver|insurance|invoice|receipt|cancellation|scuba|paragliding|snowboarding)\b",
        message,
        re.IGNORECASE,
    ):
        return []
    return [
        m
        for m in MEDIA
        if (m["type"] == "pdf" and intent in ("BROCHURE_REQUEST", "BROCHURE_AND_VIDEO"))
        or (m["type"] == "video" and intent in ("VIDEO_REQUEST", "BROCHURE_AND_VIDEO"))
    ]
