@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  goto node_missing
)

for /f %%v in ('node -p "process.versions.node"') do set "NODE_VERSION=%%v"
for /f "tokens=1,2 delims=." %%a in ("%NODE_VERSION%") do (
  set "NODE_MAJOR=%%a"
  set "NODE_MINOR=%%b"
)
if not defined NODE_MAJOR goto node_version_error
if %NODE_MAJOR% LSS 20 goto node_version_error
if %NODE_MAJOR% EQU 20 if %NODE_MINOR% LSS 19 goto node_version_error

if not exist "node_modules\next\package.json" (
  echo Project dependencies are not installed yet.
  echo Open PowerShell in this folder and run: npm.cmd ci
  pause
  exit /b 1
)

echo Starting Tracekit on this computer only. Provider keys are not needed to preview the workspace.
echo When the server is ready, open http://localhost:3000 in your browser.
echo Press Ctrl+C here to stop the server.
call npm.cmd run dev
exit /b %errorlevel%

:node_missing
echo Node.js 20.19 or later is required. Install Node.js, then run this launcher again.
pause
exit /b 1

:node_version_error
echo Node.js 20.19 or later is required. Detected: %NODE_VERSION%
pause
exit /b 1
