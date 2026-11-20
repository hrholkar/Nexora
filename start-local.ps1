# NEXORA — Windows PowerShell One-Click Launcher
# Runs the local lightweight FastAPI backend and the Vite frontend simultaneously

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " NEXORA — Where Language Models Evolve." -ForegroundColor Cyan
Write-Host " Open-Source Academic LLM Development Platform" -ForegroundColor Cyan
Write-Host " Local CPU Engine (Zero Cost: 0 / $0)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$CurrentDir = Get-Location

# 1. Check Python Virtual Environment
if (Test-Path ".\.venv\Scripts\python.exe") {
    Write-Host "[✓] Found Python virtual environment at .venv" -ForegroundColor Green
} else {
    Write-Host "[!] Virtual environment not found. Creating .venv..." -ForegroundColor Yellow
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements-ml.txt
}

# 2. Check Frontend node_modules
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "[!] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location ".\frontend"
    npm install
    Set-Location $CurrentDir
}

# 3. Launch Backend in new window
Write-Host "[*] Launching NEXORA Backend on http://localhost:8000..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$CurrentDir'; `$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

# 4. Launch Frontend in new window
Write-Host "[*] Launching NEXORA Frontend on http://localhost:5173..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$CurrentDir\frontend'; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " NEXORA IS NOW RUNNING LOCALLY!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host " Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host " API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
