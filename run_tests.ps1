# SmartCal Test Runner Script
Write-Host "Running SmartCal Automated Verification Tests..." -ForegroundColor Cyan
$pythonExe = "C:\Users\Prasa\AppData\Local\Programs\Python\Python313\python.exe"
if (Test-Path $pythonExe) {
    & $pythonExe tests\test_smartcal_e2e.py
} else {
    python tests\test_smartcal_e2e.py
}
