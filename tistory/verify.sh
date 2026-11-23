#!/bin/bash
# 예약·발행된 글을 크롬에서 읽기 전용으로 추출 → verify.py로 원본 대조. 사용: ./verify.sh 2 3 4 ...
set -e; cd "$(dirname "$0")"
D=/mnt/c/Users/jinsung/Downloads/claude-chrome/formda-verify; mkdir -p "$D"; rm -f "${D:?}"/post-*.json "${D:?}"/list.json
sed "s#POSTNOS#$(echo "$@" | tr ' ' ',')#" verify_prompt.txt > "$D/prompt.txt"
EXE="$(ls -d /mnt/c/Users/jinsung/.vscode/extensions/anthropic.claude-code-*-win32-x64 | sort -V | tail -1)/resources/native-binary/claude.exe"; EXE_WIN="$(wslpath -w "$EXE")"
cp /home/tjd618/formda/tistory/chrome_windows.ps1 /mnt/c/Users/jinsung/Downloads/claude-chrome/chrome_windows.ps1
CW='C:\Users\jinsung\Downloads\claude-chrome\chrome_windows.ps1'; SNAP='C:\Users\jinsung\Downloads\claude-chrome\snap.txt'
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" snapshot "$SNAP" >/dev/null)
trap '(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" closemark "$SNAP")' EXIT  # 11/23 사용자: 끝나면 자동화가 연 창 모두 닫기
powershell.exe -NoProfile -Command "Start-Process chrome.exe -ArgumentList '--new-window','data:text/html,<title>claude-job</title>'" ; sleep 3
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$CW" mark "$SNAP" >/dev/null)  # 방금 연 우리 창만 기억
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \$p = Get-Content -Raw -Encoding UTF8 'C:\Users\jinsung\Downloads\claude-chrome\formda-verify\prompt.txt'; \$p | & '$EXE_WIN' --chrome -p --output-format text --max-turns 80 --allowedTools 'mcp__claude-in-chrome__*' 'Write'" 2>&1 | grep -v "^Permission allow rule" | tail -8)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'C:\Users\jinsung\Downloads\claude-chrome\close_job_windows.ps1' | tail -1
python3 verify.py
