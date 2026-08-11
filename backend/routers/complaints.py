from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid, os, shutil

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.ai.classifier import classify, embed_text
from backend.ai.priority import score_priority, get_resolution_estimate
from backend.ai.router import route
from backend.ai.deduplicator import find_similar, embedding_to_str

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _generate_complaint_id(db: Session) -> str:
    count = db.query(models.Complaint).count()
    return f"SCMS-{datetime.utcnow().year}-{str(count + 1000).zfill(4)}"


# ─── AI Preview (live chip while typing) ─────────────────────────────────────

@router.post("/ai-preview", response_model=schemas.AIPreviewResponse)
def ai_preview(req: schemas.AIPreviewRequest):
    """Real-time AI analysis endpoint. Called with debounce from frontend."""
    if len(req.text.strip()) < 10:
        raise HTTPException(status_code=422, detail="Text too short for analysis")

    category, confidence, keywords = classify(req.text)
    priority, priority_reason = score_priority(req.text, category)
    routing = route(category)

    return schemas.AIPreviewResponse(
        category=category,
        confidence=round(confidence * 100, 1),
        priority=priority,
        priority_reason=priority_reason,
        department=routing["department"],
        keywords=keywords,
    )


# ─── Similarity check (pre-submit duplicate modal) ────────────────────────────

@router.post("/check-similar", response_model=List[schemas.SimilarComplaint])
def check_similar(req: schemas.SimilarityRequest, db: Session = Depends(get_db)):
    """Check for similar open complaints before submission."""
    query = db.query(models.Complaint).filter(
        models.Complaint.status.notin_(["Resolved", "Closed"]),
        models.Complaint.embedding.isnot(None),
    )
    if req.category:
        query = query.filter(models.Complaint.category == req.category)
    if req.location_block:
        query = query.filter(models.Complaint.location_block == req.location_block)

    candidates = query.all()

    candidate_dicts = []
    for c in candidates:
        candidate_dicts.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "text": c.text,
            "category": c.category,
            "location_block": c.location_block,
            "location_room": c.location_room,
            "status": c.status,
            "upvote_count": c.upvote_count,
            "embedding": c.embedding,
            "created_at": c.created_at,
        })

    similar = find_similar(req.text, candidate_dicts, threshold=0.65)

    result = []
    for s in similar:
        result.append(schemas.SimilarComplaint(
            id=s["id"],
            complaint_id=s["complaint_id"],
            text=s["text"],
            category=s["category"],
            location_block=s.get("location_block"),
            location_room=s.get("location_room"),
            status=s["status"],
            upvote_count=s["upvote_count"],
            similarity=s["similarity"],
            created_at=s["created_at"],
        ))
    return result


# ─── Upvote existing complaint ────────────────────────────────────────────────

@router.post("/{complaint_id}/upvote")
def upvote_complaint(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    c.upvote_count = (c.upvote_count or 1) + 1
    c.updated_at = datetime.utcnow()

    # Re-score priority with new upvote count
    priority, reason = score_priority(c.text, c.category or "Other", c.upvote_count)
    c.priority = priority
    c.priority_reason = reason

    log = models.ComplaintLog(
        complaint_id=c.id,
        action="Upvoted",
        note=f"Student reported the same issue. Total votes: {c.upvote_count}",
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    return {"message": "Upvoted successfully", "upvote_count": c.upvote_count}


# ─── Submit new complaint ─────────────────────────────────────────────────────

@router.post("/", response_model=schemas.ComplaintOut)
async def submit_complaint(
    text: str = Form(...),
    location_block: Optional[str] = Form(None),
    location_floor: Optional[str] = Form(None),
    location_room: Optional[str] = Form(None),
    category_override: Optional[str] = Form(None),
    is_anonymous: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    # AI pipeline
    ai_category, confidence, _ = classify(text)
    final_category = category_override if category_override else ai_category
    category_overridden = bool(category_override and category_override != ai_category)

    priority, priority_reason = score_priority(text, final_category)
    routing = route(final_category, location_block)

    # Embedding
    emb = embed_text(text)
    emb_str = embedding_to_str(emb)

    # Department lookup
    dept_name = routing["department"].split("—")[0].strip()
    dept = db.query(models.Department).filter(
        models.Department.name.ilike(f"%{dept_name}%")
    ).first()

    # Photo upload
    photo_url = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1]
        fname = f"{uuid.uuid4()}{ext}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        with open(fpath, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        photo_url = f"/uploads/{fname}"

    complaint = models.Complaint(
        complaint_id=_generate_complaint_id(db),
        student_id=current_user.id if current_user else None,
        text=text,
        category=final_category,
        ai_category=ai_category,
        confidence_score=confidence,
        priority=priority,
        ai_priority=priority,
        priority_reason=priority_reason,
        location_block=location_block,
        location_floor=location_floor,
        location_room=location_room,
        department_id=dept.id if dept else None,
        status="Submitted",
        photo_url=photo_url,
        is_anonymous=is_anonymous,
        category_overridden=category_overridden,
        embedding=emb_str,
    )
    db.add(complaint)
    db.flush()

    log = models.ComplaintLog(
        complaint_id=complaint.id,
        action="Complaint Submitted",
        note=f"AI Category: {ai_category} ({round(confidence*100,1)}% confidence). Priority: {priority}.",
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(complaint)
    return complaint


# ─── Get complaint by ID ──────────────────────────────────────────────────────

@router.get("/track/{complaint_id}", response_model=schemas.ComplaintOut)
def track_complaint(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return c


@router.get("/my", response_model=List[schemas.ComplaintOut])
def my_complaints(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required")
    return db.query(models.Complaint).filter(
        models.Complaint.student_id == current_user.id
    ).order_by(models.Complaint.created_at.desc()).all()


# ─── List all (for admin) ─────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.ComplaintOut])
def list_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    location_block: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.Complaint)
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
    return query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()


# ─── Feedback ─────────────────────────────────────────────────────────────────

@router.post("/{complaint_id}/feedback")
def submit_feedback(
    complaint_id: int,
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if c.status != "Resolved":
        raise HTTPException(status_code=400, detail="Can only provide feedback for resolved complaints")
    existing = db.query(models.Feedback).filter(models.Feedback.complaint_id == complaint_id).first()
    if existing:
        existing.satisfied_bool = feedback.satisfied_bool
        existing.comment = feedback.comment
    else:
        fb = models.Feedback(
            complaint_id=complaint_id,
            satisfied_bool=feedback.satisfied_bool,
            comment=feedback.comment,
        )
        db.add(fb)
    db.commit()
    return {"message": "Feedback recorded"}
