
import re


CAMPUS_KEYWORDS = {
    "silver oak",
    "sou",
    "university",
    "campus",
    "college",
    "faculty",
    "faculties",
    "professor",
    "teacher",
    "department",
    "admission",
    "semester",
    "exam",
    "examination",
    "timetable",
    "attendance",
    "library",
    "laboratory",
    "lab",
    "workshop",
    "classroom",
    "class room",
    "room number",
    "building",
    "block",
    "floor",
    "navigation",
    "directions",
    "location",
    "event",
    "avishkar",
    "student",
    "students",
    "hostel",
    "canteen",
    "parking",
    "placement",
    "placements",
    "fees",
    "scholarship",
    "id card",
    "office",
    "department",
    "computer",
    "engineering",
    "aiml",
    "artificial intelligence",
    "machine learning",
    "ieee",
    "facility",
    "facilities",
    "sili",
}


def is_campus_related(message: str) -> bool:
    """Return True when a message appears related to Silver Oak University."""

    if not isinstance(message, str):
        return False

    text = re.sub(r"\s+", " ", message.lower()).strip()

    if not text:
        return False

    # Require at least one recognized campus-related term.
    return any(keyword in text for keyword in CAMPUS_KEYWORDS)
