# Start MariaDB on Port 3307
Write-Host "Starting MariaDB MySQL Server on Port 3307..." -ForegroundColor Cyan
& "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --port=3307 --console
