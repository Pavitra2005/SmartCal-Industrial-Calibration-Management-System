@echo off
echo Running SmartCal Automated Verification Tests...
set PYTHON_EXE=C:\Users\Prasa\AppData\Local\Programs\Python\Python313\python.exe
if exist "%PYTHON_EXE%" (
    "%PYTHON_EXE%" tests\test_smartcal_e2e.py
) else (
    python tests\test_smartcal_e2e.py
)
pause
