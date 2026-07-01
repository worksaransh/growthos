Write-Host "=== GrowthOS Project Verification ===" -ForegroundColor Cyan
Write-Host ""

$base = "D:\CODE\OS\growthos"

# Check frontend structure
Write-Host "📁 Frontend Structure:" -ForegroundColor Yellow
$frontendFiles = @(
    "$base\frontend\package.json",
    "$base\frontend\tsconfig.json",
    "$base\frontend\tailwind.config.ts",
    "$base\frontend\next.config.js",
    "$base\frontend\postcss.config.js",
    "$base\frontend\middleware.ts",
    "$base\frontend\app\layout.tsx",
    "$base\frontend\app\globals.css",
    "$base\frontend\app\providers.tsx",
    "$base\frontend\app\(auth)\login\page.tsx",
    "$base\frontend\app\(auth)\signup\page.tsx",
    "$base\frontend\app\(auth)\reset-password\page.tsx",
    "$base\frontend\app\(onboarding)\onboarding\page.tsx",
    "$base\frontend\app\(dashboard)\dashboard\page.tsx",
    "$base\frontend\app\(dashboard)\layout.tsx",
    "$base\frontend\app\api\auth\callback\route.ts"
)
$allOk = $true
foreach ($f in $frontendFiles) {
    if (Test-Path $f) {
        Write-Host "  ✅ $f" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $f" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "📁 Backend Structure:" -ForegroundColor Yellow
$backendFiles = @(
    "$base\backend\requirements.txt",
    "$base\backend\pyproject.toml",
    "$base\backend\app\__init__.py",
    "$base\backend\app\main.py",
    "$base\backend\app\core\config.py",
    "$base\backend\app\core\database.py",
    "$base\backend\app\core\security.py",
    "$base\backend\app\core\vault.py",
    "$base\backend\app\midleware\auth_middleware.py",
    "$base\backend\app\midleware\logging_middleware.py",
    "$base\backend\app\models\dashboard.py",
    "$base\backend\app\models\integration.py",
    "$base\backend\app\models\settings.py",
    "$base\backend\app\repositories\workspace_repo.py",
    "$base\backend\app\repositories\integration_repo.py",
    "$base\backend\app\repositories\metrics_repo.py",
    "$base\backend\app\repositories\sync_repo.py",
    "$base\backend\app\services\metrics_service.py",
    "$base\backend\app\services\shopify_service.py",
    "$base\backend\app\services\meta_service.py",
    "$base\backend\app\services\google_service.py",
    "$base\backend\app\services\sync_service.py",
    "$base\backend\app\api\v1\router.py",
    "$base\backend\app\api\v1\dashboard.py",
    "$base\backend\app\api\v1\integrations.py",
    "$base\backend\app\api\v1\sync.py",
    "$base\backend\app\api\v1\settings.py",
    "$base\backend\app\api\v1\auth.py",
    "$base\backend\app\api\v1\oauth.py",
    "$base\backend\app\jobs\scheduler.py"
)
foreach ($f in $backendFiles) {
    if (Test-Path $f) {
        Write-Host "  ✅ $f" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $f" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "📁 Config Files:" -ForegroundColor Yellow
$configFiles = @(
    "$base\.env.example",
    "$base\docker-compose.yml",
    "$base\Dockerfile",
    "$base\backend\Dockerfile",
    "$base\database\growthos_phase1_schema.sql"
)
foreach ($f in $configFiles) {
    if (Test-Path $f) {
        Write-Host "  ✅ $f" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $f" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "🎉 All files verified! Project structure is complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 File counts:" -ForegroundColor Cyan
    $feCount = (Get-ChildItem -Path "$base\frontend" -Recurse -File | Measure-Object).Count
    $beCount = (Get-ChildItem -Path "$base\backend" -Recurse -File | Measure-Object).Count
    Write-Host "  Frontend: $feCount files" -ForegroundColor Cyan
    Write-Host "  Backend:  $beCount files" -ForegroundColor Cyan
    Write-Host "  Total:    $($feCount + $beCount) files" -ForegroundColor Cyan
} else {
    Write-Host "❌ Some files are missing. Check the list above." -ForegroundColor Red
}
