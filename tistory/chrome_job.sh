#!/bin/bash
# 크롬 읽기·확인 작업 공용 실행기(11/24). 사용: ./chrome_job.sh <영어 프롬프트 파일> [허용 도구...]
# - 프롬프트는 영어로 쓴다. 한글 값(라벨·목표값)은 UTF-8(BOM) 파일로 만들어 프롬프트에서 Read하게 한다(파이프로 넘긴 한글은 ???로 깨진다, 11/23).
# - 새 창을 열고 그 창만 mark 해 두었다가 끝나면 그 창만 닫는다(closenew 금지: 동시 세션 창까지 닫힌다).
# - 기본 허용 도구: 크롬 MCP + Read + Write
set -e
P="$1"; shift || true
TOOLS="${*:-mcp__claude-in-chrome__* Read Write}"
[ -f "$P" ] || { echo "프롬프트 파일 없음: $P"; exit 1; }
J=/mnt/c/Users/jinsung/Downloads/claude-chrome/formda-job; mkdir -p "$J"; cp "$P" "$J/prompt.txt"
EXE="$(ls -d /mnt/c/Users/jinsung/.vscode/extensions/anthropic.claude-code-*-win32-x64 | sort -V | tail -1)/resources/native-binary/claude.exe"; EXE_WIN="$(wslpath -w "$EXE")"
cp /home/tjd618/formda/tistory/chrome_windows.ps1 /mnt/c/Users/jinsung/Downloads/claude-chrome/chrome_windows.ps1
CW='C:\Users\jinsung\Downloads\claude-chrome\chrome_windows.ps1'; SNAP='C:\Users\jinsung\Downloads\claude-chrome\snap-job.txt'
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" snapshot "$SNAP" >/dev/null)
trap '(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" closemark "$SNAP")' EXIT
powershell.exe -NoProfile -Command "Start-Process chrome.exe -ArgumentList '--new-window','data:text/html,<title>claude-job</title>'"; sleep 3
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" mark "$SNAP" >/dev/null)
TL=""; for t in $TOOLS; do TL="$TL '$t'"; done
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \$p = Get-Content -Raw -Encoding UTF8 'C:\Users\jinsung\Downloads\claude-chrome\formda-job\prompt.txt'; \$p | & '$EXE_WIN' --chrome -p --output-format text --max-turns 120 --allowedTools $TL" 2>&1 | grep -v "^Permission allow rule")
