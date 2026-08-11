@echo off
echo ==========================================
echo   SCMS Frontend - Starting Dev Server
echo ==========================================
echo.
cd frontend
echo Installing dependencies...
npm install
echo.
echo Starting frontend at: http://localhost:5173
echo.
npm run dev
