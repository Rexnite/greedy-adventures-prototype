"""Deterministic format selection. No model calls, I/O or private session storage."""

import re
import unicodedata


def normalize(text):
    return re.sub(r"[^\w\s]", " ", unicodedata.normalize("NFKC", text).casefold())


def classify(message, history=()):
    text = normalize(message)
    pdf = bool(
        re.search(r"\b(brochures?|pamphlets?|pdfs?|leaflets?|booklets?)\b", text)
    )
    video = bool(re.search(r"\b(videos?|clips?|footage|films?|watch|reels?)\b", text))
    # Negated formats must not be selected.
    if re.search(r"\b(no|without|not)\s+(a\s+|the\s+)?(brochure|pdf|pamphlet)", text):
        pdf = False
    if re.search(r"\b(no|without|not)\s+(a\s+|the\s+)?(video|clip|film)", text):
        video = False
    if re.search(r"\b(both|two files)\b", text):
        context = " ".join(x["content"] for x in history[-6:]).casefold()
        if (
            pdf
            or video
            or (
                re.search(r"brochure|pdf|pamphlet", context)
                and re.search(r"video|footage|clip", context)
            )
        ):
            return "BROCHURE_AND_VIDEO"
        return "UNKNOWN"
    if (
        re.search(r"\b(include|includes|included|have|has|with)\b", text)
        and re.search(r"\b(eco|deluxe|vip|package|packages)\b", text)
        and not re.search(r"\b(send|show|watch|see|download|share)\b", text)
    ):
        return "PACKAGE_QUESTION"
    if pdf and video:
        return "BROCHURE_AND_VIDEO"
    if pdf:
        return "BROCHURE_REQUEST"
    if video:
        return "VIDEO_REQUEST"
    if re.search(r"\b(it|that|one|cheaper|and the|what about)\b", text) and history:
        return "FOLLOW_UP"
    if re.search(
        r"\b(eco|deluxe|vip|package|packages|photos|price|cost|included)\b", text
    ):
        return "PACKAGE_QUESTION"
    if re.search(
        r"\b(how|what|where|when|why|can|is|are|do|does|tell|pickup|jump|skydiving)\b",
        text,
    ):
        return "GENERAL_QUESTION"
    return "UNKNOWN"


def contextual_query(message, history):
    context = " ".join(x["content"] for x in history[-6:] if x["role"] == "user")
    packages = re.findall(r"\b(eco|deluxe|vip)\b", context.casefold())
    package = packages[-1] if packages else ""
    if re.search(r"cheaper", message, re.IGNORECASE):
        package = {"vip": "deluxe", "deluxe": "eco", "eco": "eco"}.get(package, "")
    return (message + " " + package + " " + context[-600:]).strip()
