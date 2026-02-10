@echo off
title Antigravity Prime - Terminal Command Center
setlocal

:: 1. 경로 설정 (윈도우 및 WSL 기준)
set WORKSPACE_WIN=E:\Dev\organized
set WORKSPACE_WSL=/mnt/e/Dev/organized

:: 2. 화면 초기화
cls
echo.
echo ====================================================================
echo     🚀 ANTIMATTER INTERFACES - ANTIMATTER PRIME v2.0 🚀
echo ====================================================================
echo.
echo [SYSTEM] Antigravity Prime 기동 시퀀스를 시작합니다...
echo.
timeout /t 2 > nul

:: 3. 윈도우 경로 존재 여부 확인
echo [CHECK] 작업 경로 확인 중...
if not exist "%WORKSPACE_WIN%" (
    echo.
    echo [ERROR] 작업 경로 %WORKSPACE_WIN% 를 찾을 수 없습니다.
    echo  [!] 드라이브 마운트 상태를 확인하세요.
    echo  [!] Windows WSL 경로 연결 상태를 확인하세요.
    echo.
    pause
    exit /b
)

:: 경로가 존재하는 경우 확인 메시지 출력
echo [SUCCESS] 작업 경로 확인 완료: %WORKSPACE_WIN%
echo.

:: 4. WSL2 Ubuntu를 통한 사령탑 가동
echo [SYSTEM] WSL2(Ubuntu) 차원 이동 중...
echo [SYSTEM] 사령탑 세션 구동 중...
echo.

:: WSL에서 tmux 마우스 설정 확인 및 활성화
wsl -d Ubuntu -e bash -c "tmux set -g mouse on 2>/dev/null || echo '   [INFO] tmux 마우스 설정 완료'"

:: 팀 런치 스크립트 실행
wsl -d Ubuntu -e bash -c "cd %WORKSPACE_WSL% && ./launch_team.sh"

:: 5. 세션 종료 후 메시지
echo.
echo ====================================================================
echo [SYSTEM] 사령탑 세션이 종료되었습니다.
echo [SYSTEM] Antigravity Prime 시퀀스 완료.
echo ====================================================================
echo.
pause