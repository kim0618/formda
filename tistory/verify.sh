#!/bin/bash
# 예약·발행된 글을 크롬에서 읽기 전용으로 추출 → verify.py로 원본 대조. 사용: ./verify.sh 2 3 4 ...
set -e; cd "$(dirname "$0")"
D=/mnt/c/Users/jinsung/Downloads/claude-chrome/formda-verify; mkdir -p "$D"; rm -f "${D:?}"/post-*.json "${D:?}"/list.json
sed "s#POSTNOS#$(echo "$@" | tr ' ' ',')#" verify_prompt.txt > "$D/prompt.txt"
EXE="$(ls -d /mnt/c/Users/jinsung/.vscode/extensions/anthropic.claude-code-*-win32-x64 | sort -V | tail -1)/resources/native-binary/claude.exe"; EXE_WIN="$(wslpath -w "$EXE")"
(cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \$p = Get-Content -Raw -Encoding UTF8 'C:\Users\jinsung\Downloads\claude-chrome\formda-verify\prompt.txt'; \$p | & '$EXE_WIN' --chrome -p --output-format text --max-turns 80 --allowedTools 'mcp__claude-in-chrome__*' 'Write'" 2>&1 | grep -v "^Permission allow rule" | tail -8)
python3 verify.py
