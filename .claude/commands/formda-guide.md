---
description: 폼다 가이드(블로그) 작성 - 도구 짝 가이드를 data/guides.js에 추가하고 build로 /guides 페이지+sitemap 생성. 제이퍼 /blog 품질 기준 이식.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

# 폼다 가이드 작성

폼다 가이드 시스템은 **데이터 기반**이다. `data/guides.js`에 엔트리를 추가하면 `templates/guide-page.mjs`가 TOC·본문·FAQ·관련섹션·**JSON-LD 3종(Article·FAQPage·BreadcrumbList)을 자동 생성**한다. 손으로 HTML/JSON-LD를 쓰지 않는다.

## 편수 원칙 (최우선)
- 사용자가 수를 명시하지 않으면 **1편만** 작성한다.
- "3편", "5편" 등 명시한 경우에만 그 수를 따른다. 한 실행에서 권장 최대 **5편**(품질 유지). 더 필요하면 여러 번 실행.
- 자의적으로 편수를 늘리지 않는다.

## 사전 확인 (작성 전 매번)
1. `node --input-type=module -e 'const{guides}=await import("./data/guides.js");console.log(guides.map(g=>g.slug))'` — 기존 가이드 슬러그(중복 방지)
2. 아래 **주제 큐**에서 미작성([ ]) 항목을 위에서부터 선택. 사용자가 주제를 지정하면 그것을 최우선.
3. 대상 도구의 `use`·`prerender`를 `data/registry.js`에서 읽어 중복 회피(가이드는 도구 본문과 달라야 함 — 도구는 "무엇/어떻게 만드나", 가이드는 "왜·언제·실전 노하우·예시").
4. **직전 2편의 작성 유형·도입부·FAQ 개수 확인**(아래 "구조 다양화 규칙"): `node --input-type=module -e 'const{guides}=await import("./data/guides.js");guides.slice(-2).forEach(g=>console.log(g.slug, "| FAQ:", g.faq.length, "| H2:", g.sections.map(s=>s.h).join(" / ")))'`로 최근 골격을 보고, **다른 유형·다른 도입부·다른 FAQ 개수**를 고른다.

## 주제 큐 — Phase 1: 런칭 전 24편 (수요·CPC·클러스터 가중 확정 2026-06-29)
**목표: 견적서(완료) + 아래 24편 = 25편으로 오픈.** 자료조사 기반으로 flat 1:1을 폐기하고 클러스터·인접 고수요·고CPC로 재구성. 완료 시 `[x] (slug, YYYY-MM-DD)` 표기(누적, 덮어쓰기 금지). 🆕=도구 없는 인접 주제(해당 도구로 퍼널), [허브]=다중 relatedTools.

> **제외(저수요·저CPC, 오픈 후 트래픽 보고 추가)**: 상장·표창장, 가정통신문, 텍스트 정렬 — 도구는 있으나 가이드 ROI 낮음.

### A. 개인 금전·법률 클러스터 (고CPC YMYL · →차용증/위임장)
- [x] 1. 차용증 쓰는 법: 효력·이자제한법·공증 (+지불각서·현금보관증 차이 흡수) →loan (how-to-write-loan, 2026-06-30)
- [x] 2. 🆕 가족 간 돈거래 차용증과 증여세 주의 →loan (family-loan-gift-tax, 2026-06-30)
- [x] 3. 🆕 지불각서·각서 쓰는 법(돈 갚겠다는 각서) →loan (how-to-write-payment-agreement, 2026-06-30)
- [x] 4. 위임장 작성법: 인감증명서·관공서·은행 대리 →mandate (how-to-write-mandate, 2026-06-30)

### B. 퇴사·경력증명 클러스터 (고수요+법적 · →재직증명서/사직서)
- [x] 5. 사직서 작성법: 제출 시기·민법 660조·인수인계 →resignation (how-to-write-resignation, 2026-06-30)
- [x] 6. 재직·경력·퇴직증명서 차이와 발급(3종 흡수) →employment (employment-certificate-types, 2026-06-30)
- [x] 7. 🆕 경력증명서 발급, 퇴사 후에도 받는 법(근로기준법) →employment (how-to-get-employment-certificate, 2026-06-30)
- [x] 8. [허브] 퇴사할 때 챙길 서류 총정리 →resignation/employment (documents-when-leaving-job, 2026-06-30)

### C. 취업 서류 클러스터 (head term 포화 → 롱테일 · →이력서/자소서/경력기술서)
- [x] 9. 신입 이력서 작성법(경력 없을 때) →resume (how-to-write-resume, 2026-06-30)
- [x] 10. 자기소개서 문항별 작성·예시(성장과정·지원동기·포부) →cover-letter (how-to-write-cover-letter, 2026-06-30)
- [x] 11. 경력기술서 작성법(성과 수치화·STAR) →career (how-to-write-career, 2026-06-30)
- [x] 12. [허브] 취업 서류 3종 한 번에 준비 →resume/cover-letter/career (prepare-job-application-documents, 2026-06-30)

### D. 거래 문서 클러스터 (사업자 CPC · →비즈니스 5종)
- [x] 13. 거래명세서 작성법과 세금계산서 차이 →statement (how-to-write-statement, 2026-06-30)
- [x] 14. 영수증 발행: 간이·현금영수증·소득공제 →receipt (how-to-issue-receipt, 2026-06-30)
- [x] 15. 청구서 작성법(대금 청구·납부기한) →invoice (how-to-write-invoice, 2026-06-30)
- [x] 16. 발주서 작성법(납기·결제조건) →order (how-to-write-order, 2026-06-30)
- [x] 17. [허브] 프리랜서·1인 사업자가 챙길 문서 5가지 →estimate/statement/invoice/receipt (documents-for-freelancers, 2026-06-30)

### E. 단독 고수요 (개별 검색량 강함)
- [x] 18. 무료 명함 만드는 법: 규격·필수정보·디자인 →business-card (how-to-make-business-card, 2026-06-30)
- [x] 19. 여권 영문이름 표기법: 로마자·성씨(Kim/Gim) →name-roman (how-to-romanize-korean-name, 2026-06-30)
- [x] 20. QR코드 무료로 만드는 법: URL·와이파이·연락처 →qr (how-to-make-qr-code, 2026-06-30)
- [x] 21. 자기소개서 글자수 맞추는 법(공백 포함/제외) →char-count (how-to-count-characters, 2026-06-30)
- [x] 22. 한글 주소 영문 변환: 도로명·해외배송 →address-roman (how-to-romanize-address, 2026-06-30)

### F. 비교 허브 (롱테일·ChatGPT 인용 magnet)
- [x] (견적서 작성법 = how-to-write-estimate, 2026-06-26)
- [x] 23. [허브] 견적서·거래명세서·세금계산서 차이 한눈에 →estimate/statement (business-documents-difference, 2026-06-30)
- [x] 24. [허브] 1인 사업자 세금계산서·증빙 기초 →estimate/receipt/invoice (freelancer-tax-basics, 2026-06-30)

### 생산 순서 (가치순 8배치 × 3편; 허브는 위성 작성 후가 유리)
1차 **1·10·13**(차용증·자소서·명세서) → 2차 **7·18·19**(경력증명서·명함·영문이름) → 3차 **5·2·14**(사직서·가족차용증·영수증) → 4차 **6·20·9**(증명서3종·QR·신입이력서) → 5차 **4·3·15**(위임장·지불각서·청구서) → 6차 **11·21·16**(경력기술서·글자수·발주서) → 7차 **22·12·8**(주소·취업허브·퇴사허브) → 8차 **17·23·24**(프리랜서·비교허브·세금기초)

## 신규 도구 짝 가이드 (오픈 후 추가된 도구용, 큐 밖 - 사용자 승인 하에 진행)
런칭 후 32종 → 37종으로 늘어난 신규 도구 각각의 짝 가이드. 위 25편 큐와 별개 트랙. **가이드 작성 여부는 매번 사용자에게 먼저 물어보고 진행** (도구만 요청받았는데 가이드까지 자체 판단으로 만들지 않는다).
- [x] 내용증명 → how-to-send-content-proof, 2026-07-03 (steps형·FAQ6)
- [x] 프리랜서 용역계약서 → how-to-write-freelance-contract, 2026-07-03 (strategy형·FAQ4)
- [x] 미성년자 해외여행동의서 → how-to-write-travel-consent, 2026-07-03 (compare형·FAQ5)
- [x] 급여명세서 → how-to-issue-payslip, 2026-07-03 (requirements형·FAQ6)
- [x] 근로계약서 → how-to-write-employment-contract, 2026-07-03 (steps형·FAQ4)
- [x] 지출결의서 → how-to-write-expense-report, 2026-07-03 (compare형·FAQ5)
- [x] 인수인계서 → how-to-write-handover, 2026-07-03 (requirements형·FAQ4)
- [x] 합의서·각서 → how-to-write-agreement, 2026-07-03 (strategy형·FAQ5)
- [x] 퇴직증명서 → how-to-get-resignation-certificate, 2026-07-03 (compare형·FAQ6, 기존 how-to-get-employment-certificate는 tool필드 오류로 'employment'였던 것을 'career-certificate'로 정정)
- [ ] PDF 워터마크 / PDF 회전 → 가이드 미작성 (유틸 도구는 기존 pdf-merge·pdf-split·image-to-pdf도 짝 가이드 없음 - 일관성 유지 위해 보류)

## 주제 큐 — Phase 2: 런칭 후 (트래픽 쌓인 뒤 활성화)
네이버 서치어드바이저 검색어/웹문서 TOP30 + GA/`/report` 기반으로 큐를 월 1회 갱신, 먹힌 주제 더블다운(클러스터). 지금은 비활성.

## 품질 기준 (통과 필수 — 제이퍼 rule 이식)
- **분량**: 순수 텍스트(태그 제외) **2,500자 이상**. 과도하게 길 필요 없음(2,500~5,000 적정).
- **구체 예시 3~4개**: 이름·직업·상황 명시 시나리오 → 결과. 예: "프리랜서 디자이너 김OO, 로고 시안비 300만 원 견적 시 부가세 30만 원 별도로…". 추상 설명만인 글 금지.
- **FAQ 4~5개**: 실제 검색형 질문. `faq` 배열 = 자동 JSON-LD와 일치(별도 작업 불필요).
- **교차링크**: `relatedTools`에 지원 도구 1 + 형제 2(존재하는 slug만). 본문 중 최소 1회 도구 CTA 링크(`/tools/{slug}.html`).
- **표준·법령·수치는 web 검증 후 작성**(WebSearch/WebFetch). 추측 금지(도구 본문 제작과 동일 원칙). 출처가 모호하면 단정하지 말 것.
- **금지**:
  - "안녕하세요! 오늘은…" AI 인사 도입부
  - 하이픈(-)으로 시작하는 리스트 → `<ul><li>` 사용
  - em dash(—) → 하이픈(-) ([[feedback_no_emdash]])
  - "다양한·여러 가지" 막연 표현 남발 → 구체 수치·사례
  - 도구 페이지 prerender 문장 복붙

## 구조 다양화 규칙 (핵심 — 반드시 적용, /blog·/bumo-content 이식)
가이드가 전부 "정의→필수항목표→작성순서→예시 3가지→주의사항" 같은 **동일 골격으로 찍히면** 네이버·구글·애드센스의 AI 필터가 자동 생성·대량생산 콘텐츠로 판단해 강등한다(jptcalc·bumo 검색 붕괴 실증). 템플릿(`guide-page.mjs`)은 `sections` 배열을 순서대로 출력할 뿐이므로, **글의 흐름은 작성자가 매번 다르게 설계**해야 한다.

### 작성 유형 5종 (글마다 1개 택 · 직전 2편과 다른 유형 필수)
주제 성격에 맞는 유형을 고르고, 그 유형의 H2 골격을 따른다. **"예시 3가지" 통블록을 매번 넣지 않는다** — 유형에 따라 사례를 본문에 분산하거나 생략한다.

- **① 단계 워크스루형 (steps)**: 빈 양식을 채우는 순서가 명확한 문서(견적서·거래명세서·이력서). 축 = "N단계 작성 순서". H2 예: 언제 쓰나 → 필수 항목 → **N단계 순서(글의 중심)** → 자주 하는 실수 → 관리 팁.
- **② 비교·구분형 (compare)**: 헷갈리는 문서·개념의 **차이**가 핵심(거래명세서 vs 세금계산서, 증명서 3종, 비교 허브). 축 = **대형 비교표 + 판단 기준**. H2 예: 한 줄 정의 → **A vs B vs C 비교표(중심)** → 언제 무엇을 쓰나 → 헷갈리는 지점 → 선택 가이드. *예시 3가지 블록 없이* 비교로 끌고 간다.
- **③ 요건·체크리스트형 (requirements)**: 법적 효력·필수 요건이 중요한 YMYL 문서(차용증·위임장·지불각서). 축 = "효력을 갖추는 요건 / 무효가 되는 경우". H2 예: 효력 요건 체크 → 자주 무효·분쟁되는 경우 → 핵심 수치·한도 → 안전장치(공증 등) → 사후 관리. **사례는 각 요건 설명에 1~2문장씩 녹인다**(통짜 예시 H2 금지).
- **④ 전략·관점형 (strategy)**: 읽는 상대가 명확한 문서(자기소개서·경력기술서·사직서). 축 = "상대(담당자·거래처)가 무엇을 보는가 + 어떻게 대응하나". H2 예: 상대 관점 → 항목별 전략 → 좋은 예 vs 나쁜 예 → 흔한 실수. **사례를 전략 설명 속에 분산**.
- **⑤ 허브·로드맵형 (hub)**: 여러 문서를 한 상황에서 묶어 안내하는 [허브] 글(퇴사 서류 총정리, 취업 3종 준비, 프리랜서 5종). ②비교형이 "차이"를 다룬다면 이 유형은 **"여정·묶음"**을 다룬다. 축 = "상황 → 필요 문서 묶음 → 준비 순서/체크리스트 → 각 도구로 분기". H2 예: 이 상황에 필요한 문서 한눈 정리 → 시점·순서별 준비 흐름 → 문서별 핵심 포인트(각 도구 CTA) → 자주 빠뜨리는 것. **relatedTools에 다중 도구를 넣어 퍼널**로 쓴다. ※허브라도 #23·24처럼 "차이"가 축이면 ②비교형으로 쓴다.

### 도입부(lead) 패턴 6종 (직전 2~3편과 다른 패턴)
1. **상황 던지기**: "첫 거래처에서 '견적서 한 장 보내 주세요'라는 말을 들으면…"
2. **정의 직격**: "차용증은 ~를 증빙으로 남기는 문서다"로 바로 정의+핵심 결론(TL;DR 강).
3. **통념 반박**: "~라고 생각하기 쉽지만, 실제로는 정반대다."
4. **질문형**: "세금계산서를 발행했는데 거래명세서도 써야 할까?"
5. **비용·리스크 환기**: "이 문서 한 장이 없으면 나중에 받을 돈을 못 받는다."
6. **통계·수치 환기**: "직장인 ○○%가 1년 안에 이직한다" 등 공식 수치로 연다. **출처를 web 검증한 수치만**(추측 금지), GEO·신뢰에 유리.

### FAQ·헤딩·시각요소 다양화
- **FAQ 개수 4~6개 가변 (직전 2편과 다른 개수 권장)**: ⚠️매번 4개로 쓰는 경향이 있어 실제로는 고정돼 버린다. 직전 2편의 FAQ 개수를 확인하고(사전 확인 4번에서 함께 봄) **다른 개수**를 고른다. 주제가 풍부하면 6개까지, 단순하면 4개. 4개를 3편 연속 쓰지 않는다.
- **H2 제목 스타일 섞기**: 질문형("~써야 하나?")·태스크형("필수 항목 7가지")·단정형("~는 무효가 된다")을 한 글 안에서, 또 글마다 다르게.
- **섹션 수 5~8개 가변**: 6개 고정 금지.
- **시각 요소 다양화**: 표(`g-table`)만 반복하지 않는다. 글마다 표·SVG 다이어그램(견적서 막대그래프 참고)·번호 리스트·체크리스트형 `<ul>` 중 **서로 다른 요소를 1개 이상 섞는다**. 직전 글이 표만 썼다면 이번 글엔 SVG나 타임라인을 시도.

## 검색·AI인용·애드센스 동시 최적화 (필수 — 모든 글에 적용)
폼다 가이드는 ① 네이버·구글 **SEO** ② ChatGPT·Perplexity·구글 AI개요의 **인용(GEO)** ③ 구글 **애드센스** 3가지를 동시에 노린다.

### A. 검색의도·실제 쿼리 타깃 (SEO)
- 도구명이 아니라 **실제 검색 쿼리**를 타깃한다: "거래명세서"(X) → "거래명세서 양식", "거래명세서 작성법", "거래명세서 거래명세표 차이"(O). 막히면 WebSearch로 연관검색어·"사람들이 많이 찾는 질문" 확인.
- 핵심 키워드를 **seoTitle 앞부분 · H1(title) · lead 첫 문장 · H2 최소 1곳**에 자연스럽게 배치.
- 제목에 **연도("2026") · "무료" · "양식" · "작성법"** 등 의도형 수식 + 폼다 도구로 잇는 흐름.

### B. 답 먼저 · 추출 가능 구조 (SEO 스니펫 + GEO 인용)
- **lead = TL;DR**: 검색 의도에 2~3문장으로 즉답(정의 + 핵심 결론). 스니펫·LLM이 이 문장을 그대로 인용한다.
- **H2는 질문형/태스크형**으로("거래명세서는 어떻게 쓰나요?", "필수 기재 항목 7가지"). 사람이 AI에 묻는 형태와 일치.
- **각 H2 직후 첫 문장 = 그 질문의 직답**(featured snippet·AI 추출 대상). 부연 설명은 그 뒤에.
- **정의 문장 1개 명시**: "거래명세서란 ~를 정리한 문서다"처럼 단정형. LLM이 엔티티 정의로 인용.
- **사실·수치·비교는 표(g-table)·번호 리스트로 구조화** → 기계 추출성↑.
- 각 섹션은 **자기완결**(앞 섹션 안 읽어도 이해)되게 쓴다.

### C. 권위·정확성·최신성 (E-E-A-T = 애드센스 YMYL 통과 + GEO 신뢰)
- 차용증·위임장·세금·재직증명서·연금 관련 등은 **YMYL(법률·금융)** 영역 → 구글·애드센스가 더 엄격히 본다.
- **표준·법령·수치는 공식 출처를 본문에 명시**: 예) "이자제한법상 최고 연 20%", "근로기준법 제39조", "국세청/정부24 기준". WebSearch/WebFetch로 검증 후 작성. 링크는 **권위 도메인(go.kr·법령·공공)만**.
- **면책 1문장**: 법률·세무 글은 "본 글은 일반 정보이며 법률·세무 자문이 아닙니다. 구체적 사안은 전문가에게 확인하세요."를 closing 또는 관련 섹션에 포함.
- **최신성**: title·본문에 "2026 기준", `date`=오늘, `dateModified` 자동 동기. 수치가 연도 의존적이면 연도 명시.
- 추측·과장 금지. 불확실하면 단정하지 않는다.

### D. 애드센스 통과·유지 포인트
- **원본·실질 가치**: 도구 prerender 복붙 금지(이미 규칙). 도구가 못 주는 맥락·예시·비교·주의점을 담아 독립 가치를 만든다.
- 글당 충분 분량(2,500자+)·명확한 구조(H2·표·FAQ)로 "thin/대량생산" 인상 회피.
- 신뢰 페이지(소개·약관·개인정보·문의)·내부링크 완비 상태 유지. 글마다 relatedTools로 응집도 확보.

## guides.js 엔트리 스키마
```
{
  slug, category(도구와 동일), tool(대상 도구 slug; 허브형은 대표 도구),
  navTitle(짧은 표시명), title(H1), seoTitle(…| 폼다), seoDescription(50~160자),
  keywords[5~8], date('YYYY-MM-DD' 오늘), readMin(분량/700 반올림),
  lead(=TL;DR, 2~3문장 즉답: 정의+핵심결론), toc[5~7] (이 글에서 확인할 것),
  sections[{h, html}] 6~8개  // h=질문형/태스크형, html 첫 문장=그 질문 직답 후 부연. <p>·<ul><li>·<div class="tbl-scroll"><table class="g-table">…</table></div>·인물 예시
  faq[{q,a}] 4~5개,
  closing{ ... }(마무리/CTA),
  relatedTools[3] (slug)
}
```
- `closing` 형식은 기존 `how-to-write-estimate` 엔트리를 그대로 참고(Read로 확인 후 동일 구조).
- 표는 `tbl-scroll`로 감싸고 `g-table` 클래스 사용(모바일 가로스크롤·반응형 보장).

## 작성 절차
1. 주제 선택 + 중복 확인
2. 필요 시 web으로 표준/수치 검증
3. `data/guides.js`에 엔트리 추가(스키마대로, 기존 엔트리 구조 모방)
4. 대상 도구의 양방향 링크 확인: `templates/tool-page.mjs`의 guidesByTool가 `tool` 값으로 자동 매칭하므로 `tool` slug를 정확히. relatedTools도 유효 slug만.
5. `node scripts/build.mjs` 실행 → `/guides/{slug}.html` + sitemap 자동 생성
6. **검증**(아래)
7. 1줄 보고: 슬러그 · 텍스트 자수 · 연결 도구

## 검증 (작성 후)
- 빌드 성공 + `node scripts/check-render.mjs` 21 PASS 유지
- 가이드 본문 텍스트 ≥ 2,500자:
  `node -e 'const{readFileSync}=require("fs");const h=readFileSync("guides/SLUG.html","utf8");const m=h.match(/<article[\s\S]*?<\/article>/);console.log((m?m[0]:"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().length)'`
- FAQ 개수 = JSON-LD Question 개수 일치(자동이므로 faq 배열만 확인)
- relatedTools 전부 존재하는 도구 slug
- 금지표현 스캔: `grep -nE "—|안녕하세요" guides/SLUG.html` 결과 없음
- JSON-LD 파싱: `grep -o '<script type="application/ld+json">[^<]*' guides/SLUG.html` 각각 JSON.parse 통과

## 배포·git
- **빌드까지만** 수행. 배포(rsync)는 사용자 직접([[feedback_no_deploy]]). git 커밋·푸시도 사용자([[feedback_git_user_managed]]).
- 가이드 추가 후 사용자에게 "오픈 전 N/25편" 진행률 보고.
