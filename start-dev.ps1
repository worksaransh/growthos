# GrowthOS Dev Server
# Run from PowerShell: .\start-dev.ps1

Write-Host ""
Write-Host "=== GrowthOS Dev Server ===" -ForegroundColor Cyan
Write-Host ""

# Check missing env values
$backendEnvPath = "D:\CODE\OS\growthos\backend\.env"
$backendEnv = Get-Content $backendEnvPath -ErrorAction SilentlyContinue
$missingVars = @()

if ($backendEnv -match "SUPABASE_SERVICE_ROLE_KEY=PASTE") { $missingVars += "SUPABASE_SERVICE_ROLE_KEY" }
if ($backendEnv -match "SUPABASE_JWT_SECRET=PASTE")        { $missingVars += "SUPABASE_JWT_SECRET" }
if ($backendEnv -match "YOUR_DB_PASSWORD")                  { $missingVars += "DATABASE_URL (replace YOUR_DB_PASSWORD)" }

if ($missingVars.Count -gt 0) {
    Write-Host "WARNING: Missing Supabase credentials" -ForegroundColor Yellow
    Write-Host "Backend will start in DEMO MODE (no database)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fill these in backend\.env:" -ForegroundColor White
    foreach ($v in $missingVars) {
        Write-Host "  - $v" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Get them from: supabase.com -> pmrmtajstxnjadrhdvmp -> Settings -> API" -ForegroundColor DarkGray
    Write-Host ""
} else {
    Write-Host "OK: Supabase credentials configured" -ForegroundColor Green
    Write-Host ""
}

# Start Frontend
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\CODE\OS\growthos\frontend'; npm install --legacy-peer-deps --silent; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\CODE\OS\growthos\backend'; pip install -r requirements.txt -q; uvicorn app.main:app --reload --port 8000 --host 0.0.0.0" -WindowStyle Normal

Write-Host ""
Write-Host "  App      -> http://localhost:3000" -ForegroundColor White
Write-Host "  API      -> http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs -> http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health   -> http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "  Sign up at http://localhost:3000/signup or login" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: close the two terminal windows" -ForegroundColor DarkGray
