from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    department: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Complaints ───────────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    text: str
    location_block: Optional[str] = None
    location_floor: Optional[str] = None
    location_room: Optional[str] = None
    category: Optional[str] = None          # student override
    is_anonymous: bool = False
    contact_email: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    internal_note: Optional[str] = None
    department_id: Optional[int] = None

class LogOut(BaseModel):
    action: str
    note: Optional[str] = None
    timestamp: datetime
    model_config = {"from_attributes": True}

class FeedbackOut(BaseModel):
    satisfied_bool: bool
    comment: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class ComplaintOut(BaseModel):
    id: int
    complaint_id: str
    text: str
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    priority: Optional[str] = None
    priority_reason: Optional[str] = None
    location_block: Optional[str] = None
    location_floor: Optional[str] = None
    location_room: Optional[str] = None
    department_id: Optional[int] = None
    status: str
    photo_url: Optional[str] = None
    is_anonymous: bool
    duplicate_of: Optional[int] = None
    upvote_count: int
    category_overridden: bool
    priority_overridden: bool
    assigned_to: Optional[str] = None
    internal_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    logs: List[LogOut] = []
    feedback: Optional[FeedbackOut] = None
    model_config = {"from_attributes": True}

class SimilarComplaint(BaseModel):
    id: int
    complaint_id: str
    text: str
    category: Optional[str]
    location_block: Optional[str]
    location_room: Optional[str]
    status: str
    upvote_count: int
    similarity: float
    created_at: datetime
    model_config = {"from_attributes": True}

class AIPreviewRequest(BaseModel):
    text: str

class AIPreviewResponse(BaseModel):
    category: str
    confidence: float
    priority: str
    priority_reason: str
    department: str
    keywords: List[str]

class SimilarityRequest(BaseModel):
    text: str
    category: Optional[str] = None
    location_block: Optional[str] = None

class MergeRequest(BaseModel):
    source_id: int
    target_id: int

class FeedbackCreate(BaseModel):
    satisfied_bool: bool
    comment: Optional[str] = None

class AdminActionRequest(BaseModel):
    action: str
    value: Optional[str] = None
    note: Optional[str] = None
