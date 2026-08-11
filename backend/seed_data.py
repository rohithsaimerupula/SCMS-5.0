"""
Seed database with 40 synthetic complaints + demo users + departments.
Run: python -m backend.seed_data
"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend import models
from backend.auth import hash_password
from backend.ai.classifier import classify, embed_text
from backend.ai.priority import score_priority
from backend.ai.router import route
from backend.ai.deduplicator import embedding_to_str
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

COMPLAINTS_RAW = [
    # Wi-Fi — Hostel Block B spike (6 complaints → triggers insight)
    {"text": "Wi-Fi is not working in Hostel Block B since yesterday. Cannot attend online classes.", "block": "Block B", "room": "Room 201", "status": "Submitted"},
    {"text": "Internet connection keeps dropping in Block B hostel. Very frustrating during exams.", "block": "Block B", "room": "Room 203", "status": "In Review"},
    {"text": "No WiFi signal at all in Block B ground floor. Router seems to be down.", "block": "Block B", "room": "Room 101", "status": "Assigned"},
    {"text": "Broadband speed in Block B is extremely slow, cannot stream lectures.", "block": "Block B", "room": "Room 205", "status": "In Progress"},
    {"text": "Network outage in Hostel B wing, affecting all rooms on 2nd floor.", "block": "Block B", "room": "Room 202", "status": "Submitted"},
    {"text": "WiFi disconnects every 10 minutes in Block B — impossible to work.", "block": "Block B", "room": "Room 207", "status": "Resolved", "days_ago": 5},
    # Wi-Fi — other locations
    {"text": "No internet in CSE Lab, computers cannot connect to campus network.", "block": "Academic Block", "room": "CSE Lab 1", "status": "Resolved", "days_ago": 3},
    {"text": "WiFi password stopped working in library reading room.", "block": "Library Block", "room": "Reading Room", "status": "Resolved", "days_ago": 7},

    # Electrical — high priority (with dangerous keywords)
    {"text": "Sparks coming from the switchboard near Room 105 in Block A. Very dangerous!", "block": "Block A", "room": "Room 105", "status": "In Progress"},
    {"text": "Electric shock hazard in the corridor outside ECE lab. Exposed wiring on the wall.", "block": "Academic Block", "room": "ECE Corridor", "status": "Submitted"},
    {"text": "Power outage in the entire Mechanical block since morning. Generator not starting.", "block": "Mech Block", "room": "All Rooms", "status": "Assigned"},
    {"text": "Short circuit in Block C second floor. There was a small fire in the socket.", "block": "Block C", "room": "Room 214", "status": "Resolved", "days_ago": 10},
    {"text": "Streetlights on the main road inside campus are not working for past 3 nights.", "block": "Campus Road", "room": "Main Gate Area", "status": "Submitted"},

    # Classroom — near-duplicate pair 1
    {"text": "AC not working in CSE Lab 2. It's extremely hot and students can't concentrate.", "block": "Academic Block", "room": "CSE Lab 2", "status": "Submitted"},
    {"text": "Air conditioner in Computer Science Lab 2 is broken. Temperature is unbearable.", "block": "Academic Block", "room": "CSE Lab 2", "status": "Submitted"},  # near-duplicate
    {"text": "Projector in Room 301 keeps shutting down during lectures. Please fix urgently.", "block": "Academic Block", "room": "Room 301", "status": "In Review"},
    {"text": "Whiteboard markers and duster missing from classroom 204 for two weeks.", "block": "Academic Block", "room": "Room 204", "status": "Resolved", "days_ago": 4},
    {"text": "Broken chairs in seminar hall — more than 10 chairs are damaged.", "block": "Academic Block", "room": "Seminar Hall", "status": "Assigned"},

    # Laboratory
    {"text": "Several computers in the data structures lab are not booting. OS corrupted.", "block": "Academic Block", "room": "DS Lab", "status": "In Progress"},
    {"text": "Printer in the research lab is out of paper and toner since a week.", "block": "Academic Block", "room": "Research Lab", "status": "Submitted"},
    {"text": "Chemistry lab fume hood is non-functional. Safety risk for students during experiments.", "block": "Science Block", "room": "Chem Lab", "status": "Submitted"},
    {"text": "Networking lab server has crashed. Cannot access virtual machines for practicals.", "block": "Academic Block", "room": "Net Lab", "status": "Resolved", "days_ago": 2},

    # Hostel — near-duplicate pair 2
    {"text": "No hot water in Block A hostel bathrooms since 3 days. Very inconvenient.", "block": "Block A", "room": "Bathroom Floor 1", "status": "Submitted"},
    {"text": "Hot water supply has stopped in Hostel Block A. Geysers not working at all.", "block": "Block A", "room": "Bathroom Floor 2", "status": "In Review"},  # near-duplicate
    {"text": "Pest infestation in Block D — cockroaches seen in common room and corridors.", "block": "Block D", "room": "Common Room", "status": "Submitted"},
    {"text": "Mess food quality has drastically reduced. Undercooked dal and stale chapati.", "block": "Mess Block", "room": "Main Mess", "status": "In Progress"},
    {"text": "Hostel room door lock is broken in Room 312, Block C. Security concern.", "block": "Block C", "room": "Room 312", "status": "Resolved", "days_ago": 6},

    # Transport
    {"text": "College bus route 3 was 45 minutes late today, causing students to miss first lecture.", "block": "Campus Gate", "room": "Bus Stop", "status": "Submitted"},
    {"text": "Bus driver over-speeding on city road — very dangerous for students.", "block": "Campus Gate", "room": "Bus Stop", "status": "In Review"},
    {"text": "Shuttle service to railway station has been cancelled without any notice.", "block": "Campus Gate", "room": "Station Gate", "status": "Assigned"},

    # Washroom — near-duplicate pair 3
    {"text": "Girls washroom on 3rd floor is extremely dirty and not cleaned since 2 days.", "block": "Academic Block", "room": "Washroom 3F", "status": "Submitted"},
    {"text": "Women's restroom on third floor is very unclean. Strong foul smell.", "block": "Academic Block", "room": "Washroom 3F", "status": "Submitted"},  # near-duplicate
    {"text": "Washroom flush is broken in Block B ground floor. Water overflowing.", "block": "Block B", "room": "Washroom GF", "status": "In Progress"},
    {"text": "Soap dispensers in the lab block washrooms are all empty.", "block": "Academic Block", "room": "Lab Washroom", "status": "Resolved", "days_ago": 1},

    # Other / Miscellaneous
    {"text": "Campus water cooler near canteen is not working for past week.", "block": "Canteen Block", "room": "Near Canteen", "status": "Submitted"},
    {"text": "Notice boards in the corridors have outdated information — request for update.", "block": "Academic Block", "room": "Corridor 1", "status": "Low"},
    {"text": "Parking lot lights are not working, making it unsafe at night.", "block": "Parking Lot", "room": "Main Parking", "status": "Assigned"},
    {"text": "Request to increase library timings to 10 PM for exam preparation.", "block": "Library Block", "room": "Library", "status": "Resolved", "days_ago": 12},
    {"text": "ATM machine on campus is out of cash since Friday.", "block": "Admin Block", "room": "ATM Corner", "status": "In Review"},
    {"text": "Security guard at Gate 2 is rude and obstructs students unnecessarily.", "block": "Gate 2", "room": "Security Booth", "status": "Submitted"},
]

DEPARTMENTS_DATA = [
    {"name": "IT Services", "category_mapping": "Wi-Fi", "contact_email": "it@college.edu"},
    {"name": "Academic Affairs", "category_mapping": "Classroom", "contact_email": "academic@college.edu"},
    {"name": "Laboratory Management", "category_mapping": "Laboratory", "contact_email": "labs@college.edu"},
    {"name": "Warden Office", "category_mapping": "Hostel", "contact_email": "warden@college.edu"},
    {"name": "Transport Office", "category_mapping": "Transport", "contact_email": "transport@college.edu"},
    {"name": "Housekeeping & Sanitation", "category_mapping": "Washroom", "contact_email": "housekeeping@college.edu"},
    {"name": "Electrical Maintenance", "category_mapping": "Electrical", "contact_email": "electrical@college.edu"},
    {"name": "Administration", "category_mapping": "Other", "contact_email": "admin@college.edu"},
]

USERS_DATA = [
    {"name": "Super Admin", "email": "superadmin@scms.edu", "password": "Admin@123", "role": "superadmin"},
    {"name": "IT Admin", "email": "it.admin@scms.edu", "password": "Admin@123", "role": "admin", "dept": "IT Services"},
    {"name": "Maintenance Admin", "email": "maint.admin@scms.edu", "password": "Admin@123", "role": "admin", "dept": "Electrical Maintenance"},
    {"name": "Warden Admin", "email": "warden.admin@scms.edu", "password": "Admin@123", "role": "admin", "dept": "Warden Office"},
    {"name": "Rahul Sharma", "email": "rahul@student.edu", "password": "Student@123", "role": "student"},
    {"name": "Priya Singh", "email": "priya@student.edu", "password": "Student@123", "role": "student"},
    {"name": "Arjun Mehta", "email": "arjun@student.edu", "password": "Student@123", "role": "student"},
]

def get_complaint_id(idx: int) -> str:
    return f"SCMS-2024-{str(idx + 1000).zfill(4)}"

def seed():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(models.Feedback).delete()
        db.query(models.ComplaintLog).delete()
        db.query(models.Complaint).delete()
        db.query(models.User).delete()
        db.query(models.Department).delete()
        db.commit()

        # Seed departments
        dept_map = {}
        for d in DEPARTMENTS_DATA:
            dept = models.Department(name=d["name"], category_mapping=d["category_mapping"], contact_email=d["contact_email"])
            db.add(dept)
        db.flush()
        for dept in db.query(models.Department).all():
            dept_map[dept.name] = dept.id

        # Seed users
        user_map = {}
        for u in USERS_DATA:
            user = models.User(
                name=u["name"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                department=u.get("dept"),
            )
            db.add(user)
        db.flush()
        students = db.query(models.User).filter(models.User.role == "student").all()
        admins = db.query(models.User).filter(models.User.role.in_(["admin", "superadmin"])).all()

        print(f"[Seed] Seeding {len(COMPLAINTS_RAW)} complaints with AI processing...")

        for idx, raw in enumerate(COMPLAINTS_RAW):
            text = raw["text"]
            days_ago = raw.get("days_ago", 0)
            status = raw.get("status", "Submitted")
            if status == "Low":
                status = "Submitted"

            created_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
            resolved_at = None
            if status == "Resolved":
                resolved_at = created_at + timedelta(hours=random.randint(4, 72))

            # Run AI pipeline
            category, confidence, keywords = classify(text)
            priority, priority_reason = score_priority(text, category)
            routing = route(category, raw.get("block"))

            # Compute embedding
            emb = embed_text(text)
            emb_str = embedding_to_str(emb)

            # Look up department
            dept_name = routing["department"].split("—")[0].strip()
            dept_id = None
            for name, did in dept_map.items():
                if dept_name.lower() in name.lower() or name.lower() in dept_name.lower():
                    dept_id = did
                    break

            student = random.choice(students) if random.random() > 0.2 else None

            c = models.Complaint(
                complaint_id=get_complaint_id(idx),
                student_id=student.id if student else None,
                text=text,
                category=category,
                ai_category=category,
                confidence_score=confidence,
                priority=priority,
                ai_priority=priority,
                priority_reason=priority_reason,
                location_block=raw.get("block"),
                location_room=raw.get("room"),
                department_id=dept_id,
                status=status,
                is_anonymous=random.random() < 0.15,
                embedding=emb_str,
                created_at=created_at,
                updated_at=created_at,
                resolved_at=resolved_at,
                upvote_count=random.randint(1, 8),
            )
            db.add(c)
            db.flush()

            # Add log entry
            log = models.ComplaintLog(
                complaint_id=c.id,
                action="Complaint Submitted",
                actor_id=c.student_id,
                note="Complaint submitted via SCMS portal. AI analysis completed.",
                timestamp=created_at,
            )
            db.add(log)

            if status == "Resolved":
                log2 = models.ComplaintLog(
                    complaint_id=c.id,
                    action="Marked as Resolved",
                    actor_id=admins[0].id if admins else None,
                    note="Issue resolved. Maintenance team completed the repair.",
                    timestamp=resolved_at,
                )
                db.add(log2)

                # Add feedback for resolved complaints
                feedback = models.Feedback(
                    complaint_id=c.id,
                    satisfied_bool=random.random() > 0.25,
                    comment=random.choice([
                        "Issue was resolved promptly, thank you!",
                        "Took a bit long but it's fixed now.",
                        "Good response time.",
                        None,
                    ]),
                )
                db.add(feedback)

            print(f"  [{idx+1}/{len(COMPLAINTS_RAW)}] {get_complaint_id(idx)} - {category} / {priority} - {status}")

        db.commit()
        print("\n[OK] Seeded successfully!")
        print(f"   Departments: {len(DEPARTMENTS_DATA)}")
        print(f"   Users: {len(USERS_DATA)}")
        print(f"   Complaints: {len(COMPLAINTS_RAW)}")
        print("\n[LOGIN CREDENTIALS]")
        print("   Super Admin: superadmin@scms.edu / Admin@123")
        print("   Student:     rahul@student.edu / Student@123")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
