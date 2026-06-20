@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0spritenote-launch.ps1" %*
exit /b %ERRORLEVEL%
