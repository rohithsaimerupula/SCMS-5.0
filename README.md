# Smart Complaint Management System (SCMS)
## HACKMATRIX 1.0 — AI & Data Science Department

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Install Python backend
```bash
pip install -r requirements.txt
```

### 2. Seed the database (required first time)
```bash
python -m backend.seed_data
```

### 3. Start the backend
```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Start the frontend (new terminal)
```bash
cd frontend
npm run dev
```

### 5. Open in browser
- **Student App:** http://localhost:5173
- **Admin Portal:** http://localhost:5173/admin/login
- **API Docs:** http://localhost:8000/docs

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@scms.edu | Admin@123 |
| IT Admin | it.admin@scms.edu | Admin@123 |
| Maintenance Admin | maint.admin@scms.edu | Admin@123 |
| Student | rahul@student.edu | Student@123 |

---

## 3-Minute Demo Script

1. **Landing:** Show live stats ticker
2. **Submit:** Type "AC not working in CSE Lab 2, very hot" → see AI auto-tag in real time
3. **Duplicate:** Submit same complaint → duplicate modal fires
4. **Admin:** Login as superadmin → Kanban sorted by priority → click a High complaint
5. **Analytics:** Show Wi-Fi Hostel-B insight card

---

## Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI:** `sentence-transformers` (all-MiniLM-L6-v2) — real ML, not if-else
- **DB:** SQLite / SQLAlchemy (Postgres-compatible)
- **Charts:** Recharts
- **Auth:** JWT (python-jose)
