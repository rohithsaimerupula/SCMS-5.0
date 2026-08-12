import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, Base, engine
from backend.models import User, Department, Complaint
from backend.auth import hash_password
from datetime import datetime

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Optional: Clear existing data for a clean slate
    db.query(Complaint).delete()
    db.query(User).delete()
    db.query(Department).delete()
    db.commit()

    print("Seeding Departments...")
    departments_data = [
        {"name": "IT Services", "category_mapping": "Wi-Fi,Network"},
        {"name": "Maintenance", "category_mapping": "Electrical,Washroom,Classroom"},
        {"name": "Hostel Office", "category_mapping": "Hostel"},
        {"name": "Transport Office", "category_mapping": "Transport"},
        {"name": "Lab Administration", "category_mapping": "Lab"}
    ]
    deps = {}
    for data in departments_data:
        dep = Department(**data)
        db.add(dep)
        db.commit()
        db.refresh(dep)
        deps[dep.name] = dep

    print("Seeding Users...")
    student = User(
        name="Test Student",
        email="student@vignan.ac.in",
        hashed_password=hash_password("demo1234"),
        role="student"
    )
    it_admin = User(
        name="IT Admin",
        email="it.admin@vignan.ac.in",
        hashed_password=hash_password("demo1234"),
        role="admin",
        department="IT Services"
    )
    super_admin = User(
        name="Super Admin",
        email="admin@vignan.ac.in",
        hashed_password=hash_password("demo1234"),
        role="superadmin"
    )
    db.add_all([student, it_admin, super_admin])
    db.commit()
    db.refresh(student)

    print("Seeding Complaints...")
    complaints_data = [
        {"id": "C001", "text": "Wi-Fi has been down in Hostel Block B since morning, can't attend online classes", "category": "Wi-Fi", "priority": "Medium", "location_block": "Hostel Block B", "status": "Resolved"},
        {"id": "C002", "text": "Internet extremely slow in Block B hostel, barely loads anything", "category": "Wi-Fi", "priority": "Medium", "location_block": "Hostel Block B", "status": "Open", "duplicate_of": "C001"},
        {"id": "C003", "text": "Network keeps disconnecting every 10 mins in Hostel B", "category": "Wi-Fi", "priority": "Medium", "location_block": "Hostel Block B", "status": "Open", "duplicate_of": "C001"},
        {"id": "C004", "text": "AC not working in CSE Lab 2, very hot, students uncomfortable", "category": "Electrical", "priority": "High", "location_block": "CSE Lab 2", "status": "In Progress"},
        {"id": "C005", "text": "Fan sparking in CSE Lab 2, smells like burning", "category": "Electrical", "priority": "High", "location_block": "CSE Lab 2", "status": "Assigned"},
        {"id": "C006", "text": "Water leakage near washbasin in 2nd floor washroom", "category": "Washroom", "priority": "Medium", "location_block": "Block C, Floor 2", "status": "Open"},
        {"id": "C007", "text": "Washroom tap broken, water wasting continuously", "category": "Washroom", "priority": "Low", "location_block": "Block C, Floor 2", "status": "Open", "duplicate_of": "C006"},
        {"id": "C008", "text": "College bus late by 30 mins every day this week", "category": "Transport", "priority": "Low", "location_block": "Main Gate", "status": "Open"},
        {"id": "C009", "text": "Projector not working in classroom 305", "category": "Classroom", "priority": "Medium", "location_block": "Block A, Room 305", "status": "Resolved"},
        {"id": "C010", "text": "Chairs broken in classroom 210, sharp edges, safety risk", "category": "Classroom", "priority": "High", "location_block": "Block A, Room 210", "status": "In Progress"},
        {"id": "C011", "text": "Hostel room light flickering constantly", "category": "Electrical", "priority": "Low", "location_block": "Hostel Block A", "status": "Resolved"},
        {"id": "C012", "text": "No hot water in hostel bathroom for 3 days", "category": "Hostel", "priority": "Medium", "location_block": "Hostel Block C", "status": "Open"},
        {"id": "C013", "text": "Lab systems in AIDS lab not booting up, 5 systems affected", "category": "Lab", "priority": "High", "location_block": "AIDS Lab", "status": "Assigned"},
        {"id": "C014", "text": "Library Wi-Fi disconnects frequently during exam prep", "category": "Wi-Fi", "priority": "Medium", "location_block": "Library", "status": "Open"},
        {"id": "C015", "text": "Canteen area lights not working after 6pm", "category": "Electrical", "priority": "Low", "location_block": "Canteen", "status": "Resolved"}
    ]

    # Map categories to departments for assigning
    def get_dept_id(cat):
        if cat in ["Wi-Fi", "Network"]: return deps["IT Services"].id
        if cat in ["Electrical", "Washroom", "Classroom"]: return deps["Maintenance"].id
        if cat == "Hostel": return deps["Hostel Office"].id
        if cat == "Transport": return deps["Transport Office"].id
        if cat == "Lab": return deps["Lab Administration"].id
        return None

    # First pass: create all complaints
    complaint_objs = {}
    for c_data in complaints_data:
        comp = Complaint(
            complaint_id=c_data["id"],
            student_id=student.id,
            text=c_data["text"],
            category=c_data["category"],
            ai_category=c_data["category"],
            priority=c_data["priority"],
            ai_priority=c_data["priority"],
            location_block=c_data["location_block"],
            status=c_data["status"],
            department_id=get_dept_id(c_data["category"])
        )
        if comp.status == "Resolved":
            comp.resolved_at = datetime.utcnow()
        db.add(comp)
        db.commit()
        db.refresh(comp)
        complaint_objs[c_data["id"]] = comp
        
    # Second pass: link duplicates
    for c_data in complaints_data:
        if "duplicate_of" in c_data:
            orig_id = c_data["duplicate_of"]
            if orig_id in complaint_objs:
                duplicate_comp = complaint_objs[c_data["id"]]
                duplicate_comp.duplicate_of = complaint_objs[orig_id].id
                # Increment upvote on the original
                complaint_objs[orig_id].upvote_count += 1
                db.commit()

    print("Seed complete! Database is populated with test data.")

if __name__ == "__main__":
    seed()
