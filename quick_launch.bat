@echo off
title Quick Launch - Antigravity Prime
set WORKSPACE_WIN=E:\Dev\organized

if not exist "%WORKSPACE_WIN%" (
    echo ERROR: Workspace not found at %WORKSPACE_WIN%
    pause
    exit /b
)

wsl -d Ubuntu -e bash -c "cd /mnt/e/Dev/organized && tmux set -g mouse on && ./launch_team.sh"

pause