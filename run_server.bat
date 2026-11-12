@echo off
echo ========================================================
echo   SmartCal - Industrial Calibration Management System
echo ========================================================

:: Check if MariaDB MySQL is running on port 3307
netstat -ano | findstr :3307 >nul
if %errorlevel% neq 0 (
    echo [*] MariaDB is not running on port 3307. Starting database...
    start "SmartCal MariaDB" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --port=3307 --console
    timeout /t 3 /nobreak >nul
) else (
    echo [*] Database service detected on port 3307.
)

set PYTHON_EXE=C:\Users\Prasa\AppData\Local\Programs\Python\Python313\python.exe
if exist "%PYTHON_EXE%" (
    echo [*] Launching application with Python 3.13...
    "%PYTHON_EXE%" -m backend.app
) else (
    echo [*] Launching application with default python...
    python -m backend.app
)
pause
