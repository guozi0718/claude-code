@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
set "LOG=%~dp0last-run.log"
where git >nul 2>nul || set "PATH=%PATH%;C:\Program Files\Git\cmd"
echo [%date% %time%] start> "%LOG%"
if exist ".git\index.lock" (
  echo skip: git is busy ^(index.lock^)>> "%LOG%"
  exit /b 0
)
git add -A >> "%LOG%" 2>&1
git diff --cached --quiet
if errorlevel 1 git commit -q -m "auto: %date% %time:~0,8%" >> "%LOG%" 2>&1
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set "BR=%%b"
git ls-remote --exit-code --heads origin !BR! >nul 2>nul
if not errorlevel 1 git pull -q --no-rebase --allow-unrelated-histories -X ours --no-edit origin !BR! >> "%LOG%" 2>&1
git push -q origin !BR! >> "%LOG%" 2>&1
if errorlevel 1 (echo result: PUSH FAILED>> "%LOG%") else (echo result: ok>> "%LOG%")
