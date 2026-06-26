# 문서 도구 제작 레시피

새 문서 도구를 "비즈니스 5종처럼" 일정한 품질로 찍어내기 위한 표준 절차.
원칙: **파이프라인은 이미 공통이다. 새로 짜는 건 레이아웃(엔진)뿐이고, 데이터·본문은 이 템플릿을 채운다.**

---

## 0. 무엇이 자동이고 무엇을 내가 짜는가

| 자동 (건드리지 않음) | 내가 채움 |
|---|---|
| 페이지 셸·헤더·푸터·탭 | registry 객체 1개 (`data/registry.js`) |
| SEO 메타·JSON-LD·sitemap | 본문 `prerender` (아래 품질 템플릿) |
| 썸네일·내부링크·가이드 연결 | docType 엔진 2함수 (**새 가족일 때만**) |
| 빌드·반복사용(회사정보 저장) | - |

→ 기존 가족(`business-invoice`)에 속하면 **registry 객체만 추가**하면 끝.
→ 새 가족이면 엔진 2함수(`doc-render`, `form-engine`)를 추가하고 그 뒤 형제는 데이터만.

---

## 1. 가족(docType) 모델

비즈니스 5종이 데이터만으로 된 이유 = 5개가 한 가족(`business-invoice`)이라서.
새 문서는 **가족부터 판단**한다. 같은 가족이면 엔진 재사용, 데이터만 추가.

권장 가족 매핑(예정):
- `business-invoice` — 견적서·거래명세서·영수증·발주서·청구서 (완료)
- `prose-doc` (예정) — 자기소개서·경력기술서·가정통신문 (문항별 텍스트 블록)
- `certificate` (예정) — 재직증명서·사직서·상장 (짧은 증명/증서)
- `resume` (예정) — 이력서 (반복행 표)
- `card` (예정) — 명함 (90×50mm, A4 아님)
- 텍스트 유틸 (`toolType:'text'`) — 글자수·영문이름·주소·정렬·QR (문서 아님)

⚠️ **app.js 일반화는 하지 않는다.** 새 가족은 자기 필드를 가지므로, applyState/clearAll에 그 가족 필드만 추가하면 된다(~10줄). 범용 추상화는 가족이 2개 이상 쌓인 뒤 추출.

---

## 2. registry 객체 스키마 (체크리스트)

`data/registry.js`의 `tools` 배열에 객체 1개 추가. 비즈니스 도구는 `business-invoice` 형태를, 새 가족은 아래 공통 필드 + 가족 전용 `doc`/`sample`.

```js
{
  slug: 'resume',              // [필수] URL·키. 영문 소문자-하이픈
  category: 'job',             // [필수] business|job|life|text
  title: '이력서 만들기',       // [필수] 페이지 h1 후보
  navTitle: '이력서',          // [필수] 카드·메뉴 표기
  icon: 'resume',              // [필수] templates/icons.mjs 키 (없으면 거기 path 추가)
  accent: '#0ea5e9',           // [필수] 카드·표·강조 색 (가족·문서별 고유)

  seoTitle: '...| 폼다',        // [필수] 키워드 앞배치 + 폼다
  seoDescription: '...',       // [필수] 120~155자, 핵심 키워드 포함
  keywords: ['...'],           // [필수] 6개 내외
  summary: '...',              // [필수] 부제(subtitle)로 노출
  use: '...',                  // [필수] 카드 설명 (2줄 분량, 길면 줄임)
  example: '...',              // [선택] 사용 예
  features: ['...'],           // [선택] 4개 기능
  audience: '...',             // [선택] 대상

  docType: 'business-invoice', // [필수] 가족. 새 가족이면 엔진 등록 필요
  doc: { /* 가족 엔진이 읽는 라벨·플래그·fileName·maxItems 등 */ },
  sample: { /* 미리보기·썸네일용 예시 데이터 */ },

  related: ['statement','invoice'], // [선택] 같은 카테고리 슬러그 (내부링크)
  prerender: { /* 3절 참조 */ },     // [필수] 본문 (얇으면 색인·체류 손해)
}
```

`accent` 팔레트 참고: 인디고 #4f46e5, 틸 #0d9488, 앰버 #d97706, 그린 #16a34a, 로즈 #e11d48, 스카이 #0ea5e9, 바이올렛 #8b5cf6.

---

## 3. 본문 `prerender` 품질 템플릿 (가장 중요)

도구 본체는 JS라 크롤러가 읽는 텍스트가 적다. **본문이 색인·체류·신뢰를 만든다.**
목표: 거래문서류 **2,000~3,000자**, 가벼운 유틸 **1,300~1,600자**. 패딩 금지 — 분량은 실질 섹션으로만.

검증된 섹션 구성(비즈니스 5종 기준):

```js
prerender: {
  intro: '...',          // 도입 1문단. 이 문서가 무엇이고 언제 쓰는지.
  sections: [
    { h: 'OO 필수 기재 항목', icon: 'checklist', html: '...표 또는 목록...' },
    { h: 'OO 작성 순서',      icon: 'checklist', html: '<ul><li>1. ...</li>...</ul>' },
    { h: '차이/계산/원리',     icon: 'calc',      html: '...' },         // 문서 성격에 맞게
    { h: 'OO, 이럴 때 씁니다', icon: 'tip',       html: '사례 2~3 + 비교표' },
    { h: '계산 예시 / 자주 하는 실수', icon: 'checklist', html: '...' },
    { h: '작성·발송 팁',       icon: 'tip',       html: '<ul>...</ul>' },
  ],
  faq: [   // 4~5개. 답변 4~5문장, 구체 수치·기준 포함. 일반론 금지.
    { q: '...', a: '...' },
  ],
  // closing: { h: '한 줄로 정리하면', html: '...' }, // 가이드 아티클에서 사용(선택)
}
```

품질 규칙(=/blog 스킬 기준 차용):
- **비교표 1개 이상** — `<div class="tbl-scroll"><table class="g-table">...</table></div>` (전역 CSS, accent 자동 적용). 실수치/실항목으로.
- **"이럴 때 씁니다"** — 인물·상황 사례 2~3개. 추상 설명 금지.
- **계산 예시는 검산 명시** — "검산: 3,300,000 × 1.1 = 3,630,000".
- **신뢰 시그널** — 법조문·고시·기관 인용 (예: 부가가치세법 제30조, 국세청 nts.go.kr). 해당 시.
- **FAQ 답변 4~5문장**, 엣지케이스 위주.
- **금지**: em dash(—) → 하이픈(-). "~일 수 있습니다" 남발. 분량용 반복 문장.
- `icon`은 `checklist|calc|tip|faq|doc` 중 (templates/tool-page.mjs·text-tool-page.mjs의 GUIDE_ICONS).

재사용 CSS 클래스(전역, 그냥 쓰면 됨): `.g-table`, `.tbl-scroll`, `.g-card`(자동), 본문 링크 `<a href="/tools/..">`(accent 자동).

---

## 4. 새 가족(docType) 엔진 추가 (같은 가족이면 건너뜀)

### 4-1. 미리보기 렌더 — `engine/doc-render.js`
```js
function renderResume(state, cfg, opts) {
  // 794×1123(A4) .doc-page 한 장을 문자열로 반환. opts.single=썸네일.
  // 공유 헬퍼 재사용: esc, comma, pageEl, wrap (같은 파일 스코프에 있음)
  return wrap(/* inner HTML */, opts);
}
root.Formda.docRender = {
  'business-invoice': businessInvoice,
  'resume': renderResume,        // ← 추가
};
```
- A4 고정 1123px 안에 들어오게. 행이 많으면 `cfg.maxItems`로 상한.
- 텍스트는 1줄 고정(긴 건 ellipsis)이 안전 — 행 높이 일정 = 안 잘림.

### 4-2. 입력폼 — `engine/form-engine.js`
```js
function resumeForm(cfg) {
  // 입력 HTML 문자열 반환. 인풋 id는 'f-<key>', oninput="Formda.app.onField('<key>', this.value)"
  // 금액칸: oninput="Formda.app.onMoney('<key>', this)"
}
root.Formda.formEngine = {
  'business-invoice': businessInvoiceForm,
  'resume': resumeForm,          // ← 추가
};
```

### 4-3. 상태 배선 — `engine/app.js` (가족 필드만, ~10줄)
- `applyState`에 그 가족 필드 `setVal('<key>', s.<key>)` 추가.
- `clearAll`의 빈 상태 객체에 그 필드 추가.
- (선택) 반복행이 있으면 items처럼 draw 로직.

### 4-4. 썸네일·페이지
- 비-텍스트 docType이면 `renderThumb`가 `docRender[docType]`로 **자동** 생성.
- 페이지는 `toolPage`가 **자동**(docType 무관). 카드 크기가 A4가 아니면(명함 등) 썸네일 CSS만 별도.

---

## 5. 빌드·검증 (문서당 매번)

```bash
node scripts/build.mjs        # 생성
node scripts/check-render.mjs  # 렌더 스모크 (PASS 유지)
node scripts/check-engine.mjs  # 계산 검산
node scripts/proof.mjs         # 출력물 A4 한 장 안에 드는지 (거래문서류)
```

체크리스트:
- [ ] 본문 분량 목표 충족 (거래문서 2,000자+ / 유틸 1,300자+), 패딩 없음
- [ ] 비교표 1개+, "이럴 때 씁니다" 사례 2~3, FAQ 4~5
- [ ] em dash 0 (`grep "—"`), 하이픈 사용
- [ ] 타 문서 요소 누출 0 (새 docType 렌더 후 grep)
- [ ] accent·icon 지정, related 내부링크 유효
- [ ] (거래문서) proof.html에서 최대 항목 A4 안에 듦
- [ ] check-render PASS

---

## 6. 한 줄 요약
**같은 가족 = registry 객체 + 본문 템플릿만. 새 가족 = 거기에 엔진 2함수 + app.js 필드 ~10줄.**
파이프라인·SEO·반복사용은 건드리지 말 것 — 이미 공통이다.
