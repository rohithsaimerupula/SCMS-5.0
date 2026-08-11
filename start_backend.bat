@echo off
echo ==========================================
echo   SCMS - Smart Complaint Management System
echo   HACKMATRIX 1.0
echo ==========================================
echo.
echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
echo.
echo [2/3] Seeding database with sample data...
python -m backend.seed_data
echo.
echo [3/3] Starting backend server...
echo.
echo Backend running at: http://localhost:8000
echo API Docs at:        http://localhost:8000/docs
echo.
uvicorn backend.main:app --reload --port 8000
