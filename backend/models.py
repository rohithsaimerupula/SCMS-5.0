from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student")  # student | admin | superadmin
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="student", foreign_keys="Complaint.student_id")
    logs = relationship("ComplaintLog", back_populates="actor")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category_mapping = Column(Text, nullable=True)  # JSON string
    contact_email = Column(String(150), nullable=True)

    complaints = relationship("Complaint", back_populates="department_rel")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(20), unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    text = Column(Text, nullable=False)

    # AI outputs
    category = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    priority = Column(String(20), default="Medium")  # High | Medium | Low
    priority_reason = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    # Location
    location_block = Column(String(50), nullable=True)
    location_floor = Column(String(20), nullable=True)
    location_room = Column(String(50), nullable=True)

    # Status
    status = Column(String(30), default="Submitted")
    # Submitted | In Review | Assigned | In Progress | Resolved | Closed

    # Media
    photo_url = Column(String(500), nullable=True)

    # Flags
    is_anonymous = Column(Boolean, default=False)
    duplicate_of = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    upvote_count = Column(Integer, default=1)

    # Category override tracking
    ai_category = Column(String(50), nullable=True)
    category_overridden = Column(Boolean, default=False)
    ai_priority = Column(String(20), nullable=True)
    priority_overridden = Column(Boolean, default=False)

    # Internal note
    assigned_to = Column(String(100), nullable=True)
    internal_note = Column(Text, nullable=True)

    # Embedding stored as comma-separated floats
    embedding = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="complaints", foreign_keys=[student_id])
    department_rel = relationship("Department", back_populates="complaints")
    logs = relationship("ComplaintLog", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)
    duplicate_complaints = relationship("Complaint", foreign_keys=[duplicate_of])


class ComplaintLog(Base):
    __tablename__ = "complaint_logs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    action = Column(String(100), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="logs")
    actor = relationship("User", back_populates="logs")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    satisfied_bool = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="feedback")
