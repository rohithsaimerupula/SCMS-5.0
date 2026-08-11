"""
Insight & Trend Generator — Module B5
Template-based (rule-driven) for demo reliability.
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter


def generate_insights(complaints: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Generate plain-English insight cards from complaint data.
    Returns list of {title, body, type: info|warning|critical}
    """
    insights = []
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    prev_week = now - timedelta(days=14)

    # Filter recent complaints
    recent = [c for c in complaints if _parse_dt(c.get("created_at")) >= week_ago]
    prev = [c for c in complaints if prev_week <= _parse_dt(c.get("created_at")) < week_ago]

    if not recent and not complaints:
        return [{"title": "No Data Yet", "body": "Submit some complaints to see insights here.", "type": "info"}]

    # ── Insight 1: Category spike ─────────────────────────────────────────────
    if recent:
        cat_counts = Counter(c.get("category", "Other") for c in recent)
        top_cat, top_count = cat_counts.most_common(1)[0]

        prev_cat_counts = Counter(c.get("category", "Other") for c in prev)
        prev_count = prev_cat_counts.get(top_cat, 0)

        if prev_count > 0:
            change_pct = int(((top_count - prev_count) / prev_count) * 100)
            if change_pct >= 20:
                insights.append({
                    "title": f"📈 {top_cat} Complaints Up {change_pct}%",
                    "body": f"{top_cat} complaints increased by {change_pct}% this week ({prev_count} → {top_count}). Consider a targeted inspection.",
                    "type": "warning",
                })
        elif top_count >= 3:
            insights.append({
                "title": f"🔔 {top_cat} — {top_count} Reports This Week",
                "body": f"{top_count} {top_cat} complaints filed this week — highest among all categories.",
                "type": "info",
            })

    # ── Insight 2: Location hotspot ───────────────────────────────────────────
    location_complaints = [(c.get("location_block"), c.get("category")) for c in complaints
                           if c.get("location_block") and c.get("status") != "Resolved"]
    if location_complaints:
        loc_counts = Counter(location_complaints)
        (top_loc, top_loc_cat), loc_count = loc_counts.most_common(1)[0]
        if loc_count >= 3:
            insights.append({
                "title": f"🗺️ Hotspot: {top_loc}",
                "body": f"{loc_count} unresolved {top_loc_cat} complaints in {top_loc}. Concentrated attention needed.",
                "type": "critical" if loc_count >= 5 else "warning",
            })

    # ── Insight 3: Recurring issue alert ─────────────────────────────────────
    location_cat_counts = Counter(
        (c.get("location_block"), c.get("location_room"), c.get("category"))
        for c in complaints
        if c.get("location_room") and c.get("category")
    )
    for (block, room, cat), count in location_cat_counts.items():
        if count >= 3 and block and room:
            insights.append({
                "title": f"🔁 Recurring Issue Detected",
                "body": f"{cat} issues in {block}, Room {room} have recurred {count} times this month. Recommend immediate inspection.",
                "type": "critical",
            })
            break  # Show one recurring insight

    # ── Insight 4: Resolution rate ────────────────────────────────────────────
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.get("status") == "Resolved")
    if total > 0:
        rate = int((resolved / total) * 100)
        insights.append({
            "title": f"✅ Resolution Rate: {rate}%",
            "body": f"{resolved} of {total} complaints resolved. {'Great work! Keep it up.' if rate >= 70 else 'Resolution rate needs improvement — review backlog.'}",
            "type": "info" if rate >= 70 else "warning",
        })

    # ── Insight 5: High priority backlog ─────────────────────────────────────
    high_open = [c for c in complaints if c.get("priority") == "High" and c.get("status") not in ("Resolved", "Closed")]
    if len(high_open) >= 3:
        insights.append({
            "title": f"🚨 {len(high_open)} High-Priority Complaints Open",
            "body": f"There are {len(high_open)} unresolved High-priority complaints. Immediate escalation recommended.",
            "type": "critical",
        })

    # ── Insight 6: Specific Wi-Fi / Hostel-B observation ─────────────────────
    wifi_hostel_b = [c for c in complaints
                     if c.get("category") == "Wi-Fi" and c.get("location_block") == "Block B"]
    if len(wifi_hostel_b) >= 3:
        insights.append({
            "title": "📡 Wi-Fi Outage Pattern — Hostel Block B",
            "body": f"Wi-Fi complaints in Hostel Block B have spiked ({len(wifi_hostel_b)} reports). "
                    "Router replacement or infrastructure upgrade is recommended.",
            "type": "critical",
        })

    return insights if insights else [{
        "title": "All Clear",
        "body": "No significant patterns detected. Campus facilities appear to be functioning normally.",
        "type": "info"
    }]


def _parse_dt(dt_val):
    if dt_val is None:
        return datetime.min
    if isinstance(dt_val, datetime):
        return dt_val
    if isinstance(dt_val, str):
        try:
            return datetime.fromisoformat(dt_val)
        except Exception:
            return datetime.min
    return datetime.min
