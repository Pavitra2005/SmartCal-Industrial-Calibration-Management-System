# SmartCal Server Startup Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SmartCal - Industrial Calibration Management System   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Check if MySQL is listening on port 3307
$port3307 = Get-NetTCPConnection -LocalPort 3307 -ErrorAction SilentlyContinue
if (-not $port3307) {
    Write-Host "[*] MariaDB is not running on port 3307. Starting database..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList '--defaults-file="C:\xampp\mysql\bin\my.ini" --port=3307 --console' -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "[*] Database service detected on port 3307." -ForegroundColor Green
}

$pythonExe = "C:\Users\Prasa\AppData\Local\Programs\Python\Python313\python.exe"
if (Test-Path $pythonExe) {
    Write-Host "[*] Launching application with Python 3.13..." -ForegroundColor Green
    & $pythonExe -m backend.app
} else {
    Write-Host "[*] Launching application with default python..." -ForegroundColor Yellow
    python -m backend.app
}
