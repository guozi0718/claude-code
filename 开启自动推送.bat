@echo off
chcp 65001 >nul
cd /d "%~dp0"
schtasks /create /f /tn "ClaudeCodeAutoPush" /sc minute /mo 10 /tr "wscript.exe \"%~dp0.autopush\autopush.vbs\"" 
if errorlevel 1 (
  echo.
  echo [失败] 自动推送没有开启成功，请把这个窗口截图发给 Claude。
) else (
  echo.
  echo [成功] 已开启自动推送：每 10 分钟自动检查一次，有改动就推送到 GitHub。
  echo        想关闭时，双击「关闭自动推送.bat」。
  start "" wscript.exe "%~dp0.autopush\autopush.vbs"
)
echo.
pause
