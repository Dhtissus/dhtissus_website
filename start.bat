@echo off
title DH TISSU - Serveur local
cd /d "%~dp0"

echo.
echo  Demarrage du site DH TISSU...
echo.

set "NODE="

where node >nul 2>&1 && set "NODE=node"

if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE=%ProgramFiles%\nodejs\node.exe"
)

if not defined NODE if exist "%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe" (
  set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
)

if not defined NODE if exist "%LOCALAPPDATA%\Programs\Cursor\resources\app\resources\helpers\node.exe" (
  set "NODE=%LOCALAPPDATA%\Programs\Cursor\resources\app\resources\helpers\node.exe"
)

if defined NODE (
  echo  Serveur Node.js detecte.
  echo  Site public : http://localhost:8080
  echo  Admin       : http://localhost:8080/admin
  echo  Ne fermez pas cette fenetre tant que vous consultez le site.
  echo.
  start "DH TISSU Server" /MIN cmd /c ""%NODE%" "%~dp0scripts\local-server.js""
  ping 127.0.0.1 -n 3 >nul
  start "" "http://localhost:8080"
  echo.
  echo  Site lance. Si la page ne s'ouvre pas, copiez : http://localhost:8080
  echo.
  pause
  exit /b 0
)

echo  Node.js introuvable — demarrage avec PowerShell...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
