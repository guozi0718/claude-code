@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title 推送到 GitHub - guozi0718/claude-code
set "REPO=https://github.com/guozi0718/claude-code.git"

echo ============================================
echo   一键推送到 GitHub：guozi0718/claude-code
echo ============================================
echo.

rem ---------- 1. 检查 / 安装 Git ----------
where git >nul 2>nul
if errorlevel 1 (
  echo [1/5] 未检测到 Git，正在自动安装 Git for Windows ...
  winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
  set "PATH=%PATH%;C:\Program Files\Git\cmd"
)
where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo [错误] Git 安装失败。请到 https://git-scm.com/download/win 手动下载安装后，再双击本文件。
  pause
  exit /b 1
)
echo [1/5] Git 已就绪

rem ---------- 2. 首次初始化 ----------
set "SAFE=%CD:\=/%"
git config --global --get-all safe.directory 2>nul | findstr /x /c:"!SAFE!" >nul || git config --global --add safe.directory "!SAFE!"
git config --global core.quotepath false
git config --global credential.helper manager

if not exist ".git" (
  echo [2/5] 首次使用，正在初始化本地仓库 ...
  git init -q
)
git config user.name >nul 2>nul || git config user.name "郭子"
git config user.email >nul 2>nul || git config user.email "guoguoxi25@gmail.com"
git config core.longpaths true
git remote get-url origin >nul 2>nul
if errorlevel 1 (git remote add origin "%REPO%") else (git remote set-url origin "%REPO%")
echo [2/5] 已关联远程仓库 %REPO%

rem ---------- 3. 识别远程分支 ----------
set "BRANCH="
for /f "tokens=2" %%a in ('git ls-remote --symref origin HEAD 2^>nul ^| findstr /b "ref:"') do set "BRANCH=%%a"
if defined BRANCH set "BRANCH=!BRANCH:refs/heads/=!"
if not defined BRANCH set "BRANCH=main"
git symbolic-ref HEAD refs/heads/!BRANCH! >nul 2>nul
echo [3/5] 目标分支：!BRANCH!

rem ---------- 4. 提交本地修改 ----------
git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -q -m "更新：%date% %time:~0,8%"
  echo [4/5] 已提交本地修改
) else (
  echo [4/5] 没有新的本地修改
)

rem ---------- 5. 同步远程并推送 ----------
git ls-remote --exit-code --heads origin !BRANCH! >nul 2>nul
if not errorlevel 1 (
  git pull -q --no-rebase --allow-unrelated-histories -X ours --no-edit origin !BRANCH!
  if errorlevel 1 (
    echo.
    echo [错误] 与 GitHub 上的内容合并失败，请把这个窗口截图发给 Claude。
    pause
    exit /b 1
  )
)
git push -u origin !BRANCH!
if errorlevel 1 (
  echo.
  echo [错误] 推送失败。若弹出了浏览器登录窗口，请登录 GitHub 后再双击本文件重试；
  echo        否则请把这个窗口截图发给 Claude。
  pause
  exit /b 1
)
echo.
echo [5/5] 推送成功！ https://github.com/guozi0718/claude-code
echo.
pause
