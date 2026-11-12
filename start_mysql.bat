@echo off
echo Starting MariaDB MySQL Server on Port 3307...
"C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --port=3307 --console
pause
