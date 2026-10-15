@echo off
chcp 65001 >nul
schtasks /delete /f /tn "ClaudeCodeAutoPush"
echo.
echo 已关闭自动推送。之后需要推送时，双击「推送到GitHub.bat」即可。
echo.
pause
