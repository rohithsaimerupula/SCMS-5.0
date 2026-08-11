from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend import models, schemas
from backend.auth import require_admin, get_current_user
from backend.ai.deduplicator import find_similar

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/complaints", response_model=List[schemas.ComplaintOut])
def admin_list_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    location_block: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    query = db.query(models.Complaint)

    # Department-scoped admins only see their queue
    if current_user.role == "admin" and current_user.department:
        dept = db.query(models.Department).filter(
            models.Department.name == current_user.department
        ).first()
        if dept:
            query = query.filter(models.Complaint.department_id == dept.id)

    if status:
        query = query.filter(models.Complaint.status == status)
    if category:
        query = query.filter(models.Complaint.category == category)
    if priority:
        query = query.filter(models.Complaint.priority == priority)
    if department_id:
        query = query.filter(models.Complaint.department_id == department_id)
    if location_block:
        query = query.filter(models.Complaint.location_block == location_block)
    if search:
        query = query.filter(models.Complaint.text.ilike(f"%{search}%"))

    return query.order_by(
        models.Complaint.priority.desc(),
        models.Complaint.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/complaints/{complaint_id}", response_model=schemas.ComplaintOut)
def admin_get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    return c


@router.patch("/complaints/{complaint_id}")
def admin_update_complaint(
    complaint_id: int,
    update: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")

    old_status = c.status
    old_priority = c.priority
    old_category = c.category

    if update.status:
        c.status = update.status
        if update.status == "Resolved" and not c.resolved_at:
            c.resolved_at = datetime.utcnow()
    if update.priority:
        if update.priority != c.ai_priority:
            c.priority_overridden = True
        c.priority = update.priority
    if update.category:
        if update.category != c.ai_category:
            c.category_overridden = True
        c.category = update.category
    if update.assigned_to:
        c.assigned_to = update.assigned_to
    if update.internal_note:
        c.internal_note = update.internal_note
    if update.department_id:
        c.department_id = update.department_id

    c.updated_at = datetime.utcnow()

    # Log the action
    changes = []
    if update.status and update.status != old_status:
        changes.append(f"Status: {old_status} → {update.status}")
    if update.priority and update.priority != old_priority:
        changes.append(f"Priority: {old_priority} → {update.priority}")
    if update.category and update.category != old_category:
        changes.append(f"Category: {old_category} → {update.category}")
    if update.assigned_to:
        changes.append(f"Assigned to: {update.assigned_to}")

    log = models.ComplaintLog(
        complaint_id=c.id,
        action="Admin Update",
        actor_id=current_user.id,
        note="; ".join(changes) if changes else update.internal_note or "Updated",
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(c)
    return {"message": "Updated", "complaint_id": c.complaint_id}


@router.post("/complaints/merge")
def merge_complaints(
    merge: schemas.MergeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    source = db.query(models.Complaint).filter(models.Complaint.id == merge.source_id).first()
    target = db.query(models.Complaint).filter(models.Complaint.id == merge.target_id).first()
    if not source or not target:
        raise HTTPException(status_code=404, detail="Complaint not found")

    source.duplicate_of = target.id
    source.status = "Closed"
    target.upvote_count = (target.upvote_count or 1) + (source.upvote_count or 1)
    target.updated_at = datetime.utcnow()

    log = models.ComplaintLog(
        complaint_id=source.id,
        action="Merged as Duplicate",
        actor_id=current_user.id,
        note=f"Merged into {target.complaint_id}",
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    return {"message": f"Merged {source.complaint_id} into {target.complaint_id}"}


@router.get("/similar/{complaint_id}")
def get_similar_for_admin(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c or not c.embedding:
        return []

    candidates = db.query(models.Complaint).filter(
        models.Complaint.id != complaint_id,
        models.Complaint.status.notin_(["Resolved", "Closed"]),
        models.Complaint.embedding.isnot(None),
        models.Complaint.category == c.category,
    ).all()

    cands = [{"id": x.id, "complaint_id": x.complaint_id, "text": x.text,
              "category": x.category, "location_block": x.location_block,
              "location_room": x.location_room, "status": x.status,
              "upvote_count": x.upvote_count, "embedding": x.embedding,
              "created_at": x.created_at} for x in candidates]

    similar = find_similar(c.text, cands, threshold=0.60)
    return similar


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    total = db.query(models.Complaint).count()
    open_count = db.query(models.Complaint).filter(
        models.Complaint.status.notin_(["Resolved", "Closed"])
    ).count()
    resolved = db.query(models.Complaint).filter(models.Complaint.status == "Resolved").count()
    high_priority = db.query(models.Complaint).filter(models.Complaint.priority == "High").count()

    # AI accuracy (override rate)
    total_ai = db.query(models.Complaint).count()
    overridden = db.query(models.Complaint).filter(
        (models.Complaint.category_overridden == True) | (models.Complaint.priority_overridden == True)
    ).count()
    accuracy = round((1 - overridden / max(total_ai, 1)) * 100, 1)

    return {
        "total": total,
        "open": open_count,
        "resolved": resolved,
        "high_priority": high_priority,
        "ai_accuracy": accuracy,
        "override_count": overridden,
    }


@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()
