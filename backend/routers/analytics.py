from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict

from backend.database import get_db
from backend import models
from backend.ai.insights import generate_insights

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def analytics_overview(db: Session = Depends(get_db)):
    all_complaints = db.query(models.Complaint).all()
    total = len(all_complaints)

    open_c = sum(1 for c in all_complaints if c.status not in ("Resolved", "Closed"))
    resolved = sum(1 for c in all_complaints if c.status == "Resolved")
    high = sum(1 for c in all_complaints if c.priority == "High")

    # Avg resolution time
    resolved_complaints = [c for c in all_complaints if c.resolved_at and c.created_at]
    if resolved_complaints:
        avg_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600
            for c in resolved_complaints
        ) / len(resolved_complaints)
        avg_resolution = round(avg_hours, 1)
    else:
        avg_resolution = 0

    return {
        "total": total,
        "open": open_c,
        "resolved": resolved,
        "high_priority": high,
        "avg_resolution_hours": avg_resolution,
        "resolution_rate": round((resolved / max(total, 1)) * 100, 1),
    }


@router.get("/by-category")
def by_category(db: Session = Depends(get_db)):
    rows = db.query(
        models.Complaint.category,
        func.count(models.Complaint.id).label("count")
    ).group_by(models.Complaint.category).all()
    return [{"category": r.category or "Other", "count": r.count} for r in rows]


@router.get("/by-status")
def by_status(db: Session = Depends(get_db)):
    rows = db.query(
        models.Complaint.status,
        func.count(models.Complaint.id).label("count")
    ).group_by(models.Complaint.status).all()
    return [{"status": r.status, "count": r.count} for r in rows]


@router.get("/by-priority")
def by_priority(db: Session = Depends(get_db)):
    rows = db.query(
        models.Complaint.priority,
        func.count(models.Complaint.id).label("count")
    ).group_by(models.Complaint.priority).all()
    return [{"priority": r.priority or "Medium", "count": r.count} for r in rows]


@router.get("/trend")
def trend(days: int = Query(30, ge=7, le=90), db: Session = Depends(get_db)):
    """Daily complaint count over the last N days."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    complaints = db.query(models.Complaint).filter(models.Complaint.created_at >= cutoff).all()

    day_counts = defaultdict(int)
    for c in complaints:
        day_key = c.created_at.strftime("%Y-%m-%d")
        day_counts[day_key] += 1

    # Fill missing days with 0
    result = []
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        result.append({"date": d, "count": day_counts.get(d, 0)})

    return result


@router.get("/by-location")
def by_location(db: Session = Depends(get_db)):
    rows = db.query(
        models.Complaint.location_block,
        func.count(models.Complaint.id).label("count")
    ).filter(models.Complaint.location_block.isnot(None)).group_by(
        models.Complaint.location_block
    ).order_by(func.count(models.Complaint.id).desc()).all()
    return [{"location": r.location_block, "count": r.count} for r in rows]


@router.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    all_complaints = db.query(models.Complaint).all()
    data = [
        {
            "id": c.id,
            "category": c.category,
            "status": c.status,
            "priority": c.priority,
            "location_block": c.location_block,
            "location_room": c.location_room,
            "created_at": c.created_at,
        }
        for c in all_complaints
    ]
    return generate_insights(data)


@router.get("/recurring-alerts")
def recurring_alerts(db: Session = Depends(get_db)):
    """Complaints at same location+category reported 3+ times."""
    all_complaints = db.query(models.Complaint).all()
    counter = Counter(
        (c.location_block, c.location_room, c.category)
        for c in all_complaints
        if c.location_room and c.category
    )
    alerts = []
    for (block, room, cat), count in counter.items():
        if count >= 3:
            alerts.append({
                "location_block": block,
                "location_room": room,
                "category": cat,
                "count": count,
                "message": f"{cat} issues at {block} - {room} reported {count} times.",
            })
    alerts.sort(key=lambda x: x["count"], reverse=True)
    return alerts
