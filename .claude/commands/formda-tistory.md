---
description: 폼다 티스토리(formda.tistory.com) 원고 작성 전용 - 큐 기반 본문·사실 검증·도구 캡처·대표이미지·메타까지. 재검증은 /formda-tistory-verify, 크롬 예약 발행은 /formda-tistory-publish
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# /formda-tistory [번호]

예: `/formda-tistory` (큐에서 다음 대기 5편), `/formda-tistory t1-t5`, `/formda-tistory t3`

모든 파일은 `~/formda/tistory/` 한 폴더에 있다. 제이퍼 `/tistory`를 옮겨 온 스킬이다(계산기 → 폼다 도구, 숫자 검증 → 법 조항·서식·도구 동작 검증).

**이 스킬은 원고 작성까지만 한다. 크롬을 열지 않는다.** 순서: `/formda-tistory`(작성) → `/formda-tistory-verify`(새 에이전트 독립 재검증) → `/formda-tistory-publish`(예약). 모든 단계 Opus.

| 파일 | 내용 |
|---|---|
| `rules.md` | **원고 규칙 정본.** 시작 전에 전부 읽는다. 특히 §2 겹침, §4 본문(9 법 효력 단정 금지), §6 이미지, §7 사실 검증, §11 품질(최우선) |
| `queue.md` | 발행 큐(날짜·번호·검색어·도구·축·근거). 완료하면 상태 칸 갱신 |
| `ledger.tsv` | 발행 기록. 새 글 쓰기 전 직전 4편 구성 확인(§11-3) |
| `posts/tNNN-<slug>.html` | 본문 HTML |
| `meta/tNNN.txt` | TITLE / CATEGORY / TAGS / DATE / ALT / HOMETOPIC |
| `claims.mjs` | 글이 설명하는 도구 동작을 배포 사이트에서 다시 재는 검사. 새 글의 도구 주장을 여기 CHECKS에 추가 |
| `caps/setup/tNNN.js`, `caps/tNNN-cap.jpg` | 도구 캡처 설정과 결과 |
| `thumbs/tNNN.jpg` | 대표이미지 |
| `check_post.py` | 품질 자동 검사 |
| `run.mjs` | 도구 페이지에서 값 뽑기(미리보기 글자·합계) |
| `cap.mjs` | 도구 캡처(입력+미리보기, `MODE=preview`면 문서만) |
| `make_thumb.py` | 대표이미지 |
| `publish.sh`, `verify.sh` | 크롬 자동화(`/formda-tistory-publish` 전용, 이 스킬에서는 실행 금지) |

## 글 화면 구성 (제이퍼 11/20 확정 구성과 같음, 바꾸지 않는다)
1. 상단: 흰 바탕·파란 카테고리·검은 제목(스킨 CSS 적용됨)
2. 본문 첫 줄: 대표이미지(`<p>[[TOPIMG]]</p>`)
3. 첫 문단: 목록 요약에 그대로 나가는 문장(기준 줄 금지)
4. 본문 → 도구 캡처(`<p>[[CAPTURE1]]</p>` + 회색 설명) → 도구 링크 → 글쓴이 단락 → 회색 기준·면책 줄

## 절차 (편마다 1~7)

### 1. 슬롯 확인
`queue.md`에서 대상 행을 읽는다. 도구가 미배포면(시말서 등) 쓰지 않고 보고한다(`curl -s -o /dev/null -w "%{http_code}" https://formda.kr/tools/<slug>`가 200인지).

### 2. 겹침·각도 확인 (rules §2)
- 같은 검색어의 사이트 가이드(`grep -n "<검색어>" ~/formda/data/guides.js`), 도구 페이지 FAQ(`~/formda/data/registry.js`), 네이버 블로그(`~/formda/blog/queue.md`의 배정표·발행분 대장 소제목), 티스토리 기존 글을 찾아 **쓴 예시·각도를 확인**하고 피한다. 같은 주제는 괜찮고 같은 글이 되면 안 된다.
- 검색한 사람의 **진짜 질문 1개**를 한 문장으로 적는다(rules §11-4).

### 3. 사실 확인 (rules §7)
- 법 조항: `LD_LIBRARY_PATH=$HOME/.local/emulib node ~/jptcalc/scripts/law-render.mjs <법령명> <출력경로>` → 조문 검색. 조문 번호·기간·비율은 원문 확인 없이 쓰지 않는다.
- 도구 칸 이름·동작: 실제 페이지에서 확인한다. `LD_LIBRARY_PATH=$HOME/.local/emulib node run.mjs <slug> expr.js` (입력칸 id는 `f-<키>`, `set(id, 값)`·`sleep(ms)` 제공, 마지막 식이 JSON 출력). 입력칸 목록: `[...document.querySelectorAll('#formPanel input,#formPanel textarea,#formPanel select')].map(e=>e.id)`. 동작 설명은 `~/formda/engine/` 구현이 정본.
- 계산이 들어간 숫자(부가세·이자·지연손해금·기한 날짜)는 python3로 계산식과 함께 다시 뽑고, 도구 미리보기 숫자와 대조한다.
- 정부 서식·고시는 기관 원문을 찾았을 때만 "공식"이라 쓴다.

### 4. 본문 작성 (rules §4, §11)
- 직전 4편(ledger)과 도입·구성·소제목·표 개수·끝맺음·분량 중 **3가지 이상 다르게**.
- 판단 문장 2곳 이상, 흔한 오해 1개 이상, 도구로 직접 채운 예시 2~4개.
- 법 효력 단정 금지(rules §4-9).
- 간격 스페이서 `<p data-ke-size="size16">&nbsp;</p>`. 표는 4칸 이하 → `python3 fix_tables.py posts/tNNN-*.html` → `LD_LIBRARY_PATH=$HOME/.local/emulib node mobile_check.mjs posts/tNNN-*.html`로 340px 확인.
- 링크: `https://formda.kr/tools/<slug>?utm_source=tistory&utm_medium=blog&utm_campaign=tN` 1~2개(www·끝 슬래시 없이). 끝에 글쓴이 단락(`https://formda.tistory.com/page/about`) + 기준·면책 한 줄.
- 저장: `posts/tNNN-<slug>.html`(첫 줄 `<p>[[TOPIMG]]</p>`), `meta/tNNN.txt`(TITLE·CATEGORY·TAGS 5~8개·DATE `YYYY-MM-DD 08:00`·ALT). CATEGORY는 블로그 카테고리 이름 그대로: 직장·퇴사 서류 / 취업·알바 / 돈·계약 / 사업 거래 / 생활 도구.
- HOMETOPIC(티스토리 홈주제, 11/24 필수): 경영·직장 / 생활정보 / 경제 / IT 인터넷 중 글 내용에 맞는 것. 기본은 직장·퇴사 서류·취업·알바=경영·직장, 돈·계약=생활정보, 사업 거래=경제, 생활 도구는 내용별(PDF·QR 같은 IT 도구=IT 인터넷, 영문이름 같은 생활 서류=생활정보, 상장=경영·직장). 티스토리가 자동으로 고르면 틀릴 때가 있다(11/23 상장·영문이름이 IT 인터넷).
- 도구 주장 검사(11/24 필수): 본문이 도구 동작(칸 이름, 자동으로 해 주는 것, 비웠을 때 표시, 파일명, 쪽수·용량)을 말하면 그 주장마다 `claims.mjs`의 CHECKS에 한 줄씩 추가하고 `LD_LIBRARY_PATH=$HOME/.local/emulib node claims.mjs tNNN`이 PASS여야 한다. 도구 주장이 정말 없으면 meta에 `CLAIMS: 없음`. 도구가 나중에 바뀌면 이 검사가 예약 전에 잡는다.
- 제목: 42자 이하, 첫 쉼표 앞 = 검색어, 뒤 = 결론. 쉼표 필수.

### 4-2. 예시 일관성표 (11/24 필수)
예시 인물·거래의 사실(생년월일·만 나이·학년·입학 연도, 시작일·종료일·기간, 날짜별 요일, 사건 순서(보낸 날→받은 날→입금일), 금액 합계)을 python3로 계산해 `meta/tNNN.txt` 끝에 `EXAMPLE:` 줄로 적고, 본문·캡처 setup의 같은 값과 한 줄씩 대조한다. 11/24 t17(2010년생 고2, 12월 시작 "6개월 이상(5월까지)")·t18(내용증명 보낸 날 입금)이 이걸 안 해서 검증에서 걸렸다. 결론의 이유가 본문의 다른 권고와 충돌하지 않는지도 본다(t20 "괄호 넣으면 -dong 두 번"이 이유인데 괄호는 빼라고 권고).

### 5. 검사
`python3 check_post.py posts/tNNN-*.html --numbers` → PASS까지. `--numbers`가 뽑은 숫자 문장을 3단계 결과와 한 줄씩 대조한다. 그다음 rules §11-1 네 가지에 예라고 답할 수 있는지 다시 읽는다.

### 6. 이미지
- 캡처: `caps/setup/tNNN.js`(본문 예시 하나를 `set()`으로 전부 채움, 마지막 식으로 확인할 값 반환) →
  `cd ~/formda/tistory && LD_LIBRARY_PATH=$HOME/.local/emulib node cap.mjs caps/tNNN-cap.jpg <slug> caps/setup/tNNN.js`
  → 출력된 "미리보기 글자"를 끝까지 읽어 **도구 기본 예시 문구가 남지 않았는지**, 본문 예시와 같은지 확인. 이미지를 Read로 직접 본다(입력칸 잘림, 접힌 영역). 문서만 필요하면 `MODE=preview`.
  - 생활 도구(PDF·QR·증명사진)는 파일 업로드가 필요해 이 방식이 안 맞을 수 있다. 그때는 입력 화면 캡처나 결과 예시를 어떻게 찍을지 정해서 보고한다(지어내지 않는다).
- 대표이미지: `python3 make_thumb.py thumbs/tNNN.jpg "카테고리" "글 제목"` → 목록 크기(가운데 3:2)로 Read 확인.

### 7. 기록·보고
- `queue.md` 상태 "작성 완료(발행 대기)".
- 사용자에게: 편별 제목·분량·주제 고른 이유 한 줄·확인할 점, 작업 중 발견한 도구 문제(칸 이름 오류, 예시 문구 이상 등). 다음은 `/formda-tistory-verify` → `/formda-tistory-publish`.
- 예약 뒤 원고를 고치면 `/formda-tistory-publish --update`가 필요하다고 말한다.

## 하지 말 것
- 큐가 비었다고 측정 없이 채우기. 3편 미만이면 `/keyword formda`로 재측정 후 보고.
- 크롬 열기, publish.sh·verify.sh 실행.
- 실행 중인 스크립트 파일 수정.
- 제이퍼 `~/jptcalc/tistory/` 파일 수정(폴더가 다르다).
