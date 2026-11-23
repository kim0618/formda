#!/bin/bash
# 티스토리 예약 발행(윈도우 크롬 자동화). 사용: ./publish.sh t002 t003 ...
# 필요 파일: posts/tNNN-*.html, meta/tNNN.txt(TITLE/CATEGORY/TAGS/DATE/ALT), thumbs/tNNN.jpg, caps/tNNN-cap.jpg(본문에 [[CAPTURE1]] 있을 때)
set -e
cd "$(dirname "$0")"
MODE=new; if [ "$1" = "--update" ]; then MODE=update; shift; fi
WIN='C:\Users\jinsung\Downloads\claude-chrome\formda-batch'
D=/mnt/c/Users/jinsung/Downloads/claude-chrome/formda-batch
EXE="$(ls -d /mnt/c/Users/jinsung/.vscode/extensions/anthropic.claude-code-*-win32-x64 | sort -V | tail -1)/resources/native-binary/claude.exe"
EXE_WIN="$(wslpath -w "$EXE")"
rm -rf "$D"; mkdir -p "$D" /mnt/c/Users/jinsung/Downloads/claude-chrome/formda-shots
rm -f /mnt/c/Users/jinsung/Downloads/claude-chrome/formda-shots/*
LIST=""
for t in "$@"; do
  post=$(ls posts/$t-*.html)
  python3 check_post.py "$post" || { echo "검사 실패: $post"; exit 1; }
  LD_LIBRARY_PATH=$HOME/.local/emulib node mobile_check.mjs "$post" || { echo "휴대폰 폭 초과: $post (fix_tables.py)"; exit 1; }
  [ -f meta/$t.txt ] && [ -f thumbs/$t.jpg ] || { echo "meta 또는 thumb 없음: $t"; exit 1; }
  if [ $MODE = update ]; then grep -q "^POSTNO:" meta/$t.txt || { echo "POSTNO 없음(--update): $t"; exit 1; }; fi
  if grep -q '\[\[CAPTURE1\]\]' "$post"; then [ -f caps/$t-cap.jpg ] || { echo "캡처 없음: $t"; exit 1; }; cp caps/$t-cap.jpg "$D/$t-cap.jpg"; fi
  cp "$post" "$D/$t-body.html"; cp meta/$t.txt "$D/$t-meta.txt"; cp thumbs/$t.jpg "$D/$t-thumb.jpg"
  LIST="$LIST $t"
done
if [ $MODE = update ]; then
cat > "$D/prompt.txt" <<P
You are operating the user's own Tistory blog (https://formda.tistory.com) in their logged-in Chrome. The user asked to REPLACE THE BODY of these already RESERVED posts. Posts:$LIST

For EACH post id tNNN, files are in $WIN (UTF-8; Read them, use exactly): tNNN-meta.txt (POSTNO = Tistory post number, DATE = its reservation, ALT), tNNN-body.html, tNNN-cap.jpg (if body has [[CAPTURE1]]).
Per post (reuse ONE tab):
1. Open https://formda.tistory.com/manage/post/POSTNO . Set the title field to TITLE from the meta file if it differs. Do not touch category, tags or visibility.
2. tinymce.activeEditor.setContent(<body html>).
3. If the body contains a paragraph [[TOPIMG]] (it is the first paragraph): put the cursor there and upload tNNN-thumb.jpg exactly once via the BASIC-mode toolbar photo button so it becomes the first element of the body, delete the marker, set its alt to TITLE. Then if [[CAPTURE1]] exists: cursor in that paragraph, upload tNNN-cap.jpg exactly once via the BASIC-mode toolbar photo button (첨부/사진) file input (not a hidden HTML-mode input), delete the marker, set image alt to ALT. Verify no "[[CAPTURE" or "[[TOPIMG" text remains and the body has exactly 2 images (thumb at top, capture).
4. 완료 -> if the post is still RESERVED: check 발행일 is 예약 at DATE and 공개 (fix back if changed). If the post is ALREADY PUBLISHED (DATE is in the past / no 예약 shown): keep it published and 공개, do not change its date, and save with the update button. Replace the representative image (대표이미지) with tNNN-thumb.jpg (remove the old one, upload via its file input). Save. Never publish immediately; if the reservation cannot be kept, do not save and report.
After all: confirm each shows [예약] DATE on https://formda.tistory.com/manage/posts; open each post page and screenshot top to bottom through the end of the body (save_to_disk true), copy with PowerShell to C:\\Users\\jinsung\\Downloads\\claude-chrome\\formda-shots\\ as tNNN-01.jpg ...; CLOSE every tab you opened.
Final answer (English): per post: reservation shown, capture placed+alt, problems, any "검토중" placeholder.
P
else
cat > "$D/prompt.txt" <<P
You are operating the user's own Tistory blog (https://formda.tistory.com) in their logged-in Chrome. The user explicitly asked you to create these posts as SCHEDULED (reserved) posts. Posts:$LIST

For EACH post id tNNN, files are in $WIN (UTF-8, Korean; Read them, use text exactly, never rewrite):
- tNNN-meta.txt : TITLE, CATEGORY, TAGS (comma separated), DATE (KST reservation, e.g. 2026-11-23 08:00), ALT (alt text for the capture image)
- tNNN-body.html : body HTML
- tNNN-thumb.jpg : representative image (대표이미지)
- tNNN-cap.jpg : capture image, only if the body contains a paragraph [[CAPTURE1]]

Per post:
1. Open https://formda.tistory.com/manage/newpost/ (reuse ONE tab for all posts). If asked to restore a draft, decline.
2. Category = CATEGORY, title = TITLE.
3. tinymce.activeEditor.setContent(<body html>). Then make sure the editor registered it: tinymce.activeEditor.getContent({format:'text'}).length must be over 500; if not, set it again, type one space at the end and delete it, and re-check (an earlier save went out with an EMPTY body).
4. If the body contains a paragraph [[TOPIMG]] (it is the first paragraph): put the cursor there and upload tNNN-thumb.jpg exactly once via the BASIC-mode toolbar photo button so it becomes the first element of the body, delete the marker, set its alt to TITLE. Then if [[CAPTURE1]] exists: put the cursor in that paragraph, upload tNNN-cap.jpg via the BASIC-mode toolbar photo button (첨부/사진) file input, NOT any hidden HTML/Markdown-mode attach input (that caused duplicate uploads before), so it lands there; upload it exactly once, delete the marker, set the image alt (대체 텍스트) to ALT. Verify no "[[CAPTURE" or "[[TOPIMG" text remains and the body has exactly 2 images (thumb at top, capture).
5. Tags: the tag box is the input BELOW the editor area (placeholder like "#태그입력"), not inside the body. Before typing, confirm document.activeElement is that tag input and NOT inside the tinymce iframe; type each tag + Enter. Afterwards confirm the body text length did not change (twice before, tags went into the body).
6. 완료 -> publish layer: 공개, 발행일 = 예약 at DATE. Tistory auto-picks the body capture as 대표이미지: remove it and upload tNNN-thumb.jpg instead (file input). Save with the layer button. Never publish immediately; if reservation cannot be set, save as draft (임시저장) and report.
After all posts:
7. On https://formda.tistory.com/manage/posts confirm each shows [예약] with its DATE.
8. For each post open its page and take screenshots top to bottom through the end of the body (save_to_disk true); copy them with PowerShell to C:\Users\jinsung\Downloads\claude-chrome\formda-shots\ as tNNN-01.jpg, tNNN-02.jpg, ...
9. CLOSE every tab you opened.
Do not change settings, skin, menu, categories or other posts.
Final answer (English): per post: post number/URL, reservation date shown, capture placed+alt, thumbnail set, any problem. Note if any body image shows the "검토중" censoring placeholder.
P
fi
cd /mnt/c/Users/jinsung && powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \$p = Get-Content -Raw -Encoding UTF8 '$WIN\prompt.txt'; \$p | & '$EXE_WIN' --chrome -p --output-format text --max-turns 250 --allowedTools 'mcp__claude-in-chrome__*' 'PowerShell' 'Bash' 'Read'" 2>&1 | grep -v "^Permission allow rule"
