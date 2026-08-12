"""
Priority/Urgency Scorer — Module B3
Hybrid: keyword rule layer + zero-shot classification fallback.
Explainable output with human-readable reasoning.
"""
from typing import Tuple

# Severity keyword lists
HIGH_KEYWORDS = [
    "spark", "fire", "smoke", "shock", "electric shock", "short circuit",
    "flood", "leak", "injury", "accident", "dangerous", "hazardous",
    "emergency", "urgent", "critical", "burning", "burst pipe",
    "no water since days", "exposed wire", "electrocution",
]

MEDIUM_KEYWORDS = [
    "not working", "broken", "damage", "damaged", "malfunction", "failing",
    "stopped", "outage", "unavailable", "delayed", "missing", "poor quality",
    "infestation", "pest", "foul smell",
]

LOW_KEYWORDS = [
    "slow", "minor", "occasionally", "sometimes", "flicker", "slight",
    "suggestion", "improvement", "request", "upgrade",
]

# Category-level default priority
CATEGORY_DEFAULT_PRIORITY = {
    "Electrical": "High",
    "Hostel": "Medium",
    "Washroom": "Medium",
    "Wi-Fi": "Medium",
    "Classroom": "Medium",
    "Laboratory": "Medium",
    "Transport": "Low",
    "Other": "Low",
}

# Sentiment keywords indicating frustration
SENTIMENT_KEYWORDS = [
    "angry", "frustrated", "fed up", "ridiculous", "pathetic", "unacceptable",
    "third time", "again and again", "not fixed yet", "worst", "terrible",
    "how many times", "ignored", "no action"
]

def score_priority(text: str, category: str = "Other", upvote_count: int = 1, hours_open: float = 0) -> Tuple[str, str]:
    """
    Returns (priority: High|Medium|Low, reason: str)
    """
    text_lower = text.lower()

    # --- Sentiment layer (Feature 4) ---
    matched_sentiment = [kw for kw in SENTIMENT_KEYWORDS if kw in text_lower]
    if matched_sentiment:
        reason = f"High priority: detected strong student frustration/anger ('{matched_sentiment[0]}')."
        return _escalate("High", upvote_count, hours_open, reason)

    # --- Rule layer: check high-severity keywords ---
    matched_high = [kw for kw in HIGH_KEYWORDS if kw in text_lower]
    if matched_high:
        reason = f"High-severity keyword detected: '{matched_high[0]}'. Immediate attention required."
        priority = "High"
        return _escalate(priority, upvote_count, hours_open, reason)

    matched_medium = [kw for kw in MEDIUM_KEYWORDS if kw in text_lower]
    matched_low = [kw for kw in LOW_KEYWORDS if kw in text_lower]

    # --- Derive base priority ---
    if matched_low and not matched_medium:
        priority = "Low"
        reason = f"Minor issue indicated by keyword: '{matched_low[0]}'."
    elif matched_medium:
        priority = "Medium"
        reason = f"Functional disruption detected: '{matched_medium[0]}' — needs timely resolution."
    else:
        # Fall back to category default
        priority = CATEGORY_DEFAULT_PRIORITY.get(category, "Low")
        reason = f"No specific severity keywords found; defaulting to {priority} based on category '{category}'."

    return _escalate(priority, upvote_count, hours_open, reason)


def _escalate(priority: str, upvote_count: int, hours_open: float, reason: str) -> Tuple[str, str]:
    """Apply escalation logic: upvotes or aging."""
    PRIORITY_RANK = {"Low": 0, "Medium": 1, "High": 2}

    original = priority

    # Escalation rule 1: 3+ students reported same issue
    if upvote_count >= 3 and priority != "High":
        priority = "High" if priority == "Medium" else "Medium"
        reason += f" Auto-escalated: {upvote_count} students reported this issue."

    # Escalation rule 2: unresolved >48h
    if hours_open > 48 and PRIORITY_RANK.get(priority, 0) < PRIORITY_RANK.get("High", 2):
        priority = "High"
        reason += f" Auto-escalated: complaint unresolved for {int(hours_open)}h."

    return priority, reason


def get_priority_color(priority: str) -> str:
    return {"High": "#EF4444", "Medium": "#F59E0B", "Low": "#10B981"}.get(priority, "#6B7280")


def get_resolution_estimate(priority: str) -> str:
    return {
        "High": "24 hours",
        "Medium": "3–5 business days",
        "Low": "7–10 business days",
    }.get(priority, "7 business days")
