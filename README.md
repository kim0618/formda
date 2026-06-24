# 폼다 (formda)

입력하면 바로 완성되는 무료 문서 자동작성 도구. 정적 사이트 + registry 기반 빌드.

## 명령어

```bash
npm run check   # 엔진 검산(calc) + 렌더 스모크
npm run build   # registry → 정적 HTML 생성
npm run serve   # 빌드 후 http://localhost:8080
```

빌드 산출물: `index.html` · `tools/*.html` · `category/*.html` · `pages/*.html` · `sitemap.xml` · `robots.txt`
(생성물은 매 빌드마다 재생성됨. 로컬은 file:// 말고 `npm run serve`로 열 것 - 에셋이 루트 상대경로.)

## 구조

```
data/registry.js   도구 정의 1파일 (site·categories·tools). 새 도구 = 여기에 객체 추가
engine/            브라우저 클래식 스크립트, window.Formda 네임스페이스
  calc.js          금액·부가세·한글금액·콤마·esc (node vm로 테스트됨)
  doc-render.js    docType별 A4 미리보기 렌더
  form-engine.js   docConfig → 입력폼 HTML
  export.js        PDF(html2canvas+jsPDF)·PNG·인쇄
  app.js           컨트롤러: 상태·이벤트·도장업로드·탭. window.FORMDA_TOOL로 부팅
templates/*.mjs    shell·tool-page·home·category·page (build가 import)
styles/tokens.css  디자인 시스템 1파일
scripts/build.mjs  registry → HTML + sitemap + robots
scripts/check-*.mjs 검산/스모크
```

## 새 도구 추가 (다음 세션: 거래명세서 등)

거래명세서·영수증·발주서·청구서는 견적서와 같은 `docType: 'business-invoice'`.
**`data/registry.js`의 `tools` 배열에 객체 1개만 추가하면 끝.**

```js
{
  slug: 'statement', category: 'business',
  title: '거래명세서 만들기', navTitle: '거래명세서', icon: '📑',
  seoTitle: '...', seoDescription: '...', keywords: [...], summary: '...',
  docType: 'business-invoice',
  doc: { docTitle: '거 래 명 세 서', dateLabel: '거래일자', numberLabel: '명세서번호',
         leadPhrase: '아래와 같이 거래 내역을 명세합니다.', recipientSuffix: '귀하',
         supplierLabel: '공급자', recipientLabel: '공급받는자',
         showVat: true, showSeal: true, fileName: '거래명세서' },
  sample: { date:'today', no:'...', from:'...', /* ... */ items:[...], vat:'0.1', note:'...' },
  related: ['estimate', 'receipt'],
  prerender: { intro, sections:[{h,html}], faq:[{q,a}] },  // 고유 본문 800~1500자 (복붙 금지)
}
```

`npm run build` → `tools/statement.html` 자동 생성, nav·홈·카테고리·sitemap·내부링크 자동 반영.

문서 구조 자체가 다른 도구(텍스트 도구 등)는 `engine/doc-render.js`·`engine/form-engine.js`에
새 `docType` 함수를 추가한다.
