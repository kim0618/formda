// 도구 페이지 템플릿 (좌 입력 / 우 A4 미리보기 + 프리렌더 본문)
import { head, header, footer, trustBadge, steps, orgNode } from './shell.mjs';
import { site, categoryBySlug, toolsBySlug } from '../data/registry.js';
import { guidesByTool } from '../data/guides.js';

// 스텁(준비중) 도구 페이지 - noindex, 죽은 링크 방지용 안내 페이지
export function stubToolPage(tool) {
  const cat = categoryBySlug[tool.category];
  return `${head({
    title: `${tool.title} - 준비중 | ${site.name}`,
    description: `${tool.navTitle} 자동작성 도구는 곧 추가됩니다.`,
    canonical: `/tools/${tool.slug}.html`,
    robots: 'noindex,follow',
  })}
${header(tool.category)}
<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › <a href="/category/${cat.slug}.html">${cat.label}</a> › ${tool.navTitle}</div>
  <div class="stub-page">
    <span class="stub-badge">준비중</span>
    <h1>${tool.navTitle} 작성기</h1>
    <p>${tool.navTitle} 자동작성 도구를 준비하고 있어요. 견적서처럼 입력하면 바로 완성되는 ${tool.navTitle}로 곧 찾아옵니다.</p>
    <div class="hero-cta" style="justify-content:center">
      <a class="btn-cta primary" href="/tools/estimate.html">지금은 견적서 만들기</a>
      <a class="btn-cta ghost" href="/category/${cat.slug}.html">${cat.label} 전체 보기</a>
    </div>
  </div>
</main>
${footer()}
`;
}

// 결제 painted-door 블록 (수요검증). 단건=전 문서 도구, 구독=비즈니스 문서만(WTP 높음).
function pricingBlock(tool) {
  return `<div class="fd-pricing no-print" data-doc="${tool.slug}">
    <span class="fd-price-lead">더 깔끔하게, 반복 작업은 더 빠르게</span>
    <div class="fd-price-btns">
      <button type="button" class="fd-price-btn single" onclick="Formda.pay.open('single')">
        <span class="fp-t">워터마크 없이 저장</span><span class="fp-p">건당 1,000원</span>
        <span class="fp-note">지금 보는 문서 1건</span>
      </button>
      <button type="button" class="fd-price-btn sub" onclick="Formda.pay.open('subscribe')">
        <span class="fp-t">무제한 저장</span><span class="fp-p">월 4,900원</span>
        <span class="fp-note">전체 문서 워터마크 제거 무제한</span>
      </button>
    </div>
  </div>`;
}

export function toolPage(tool) {
  const cat = categoryBySlug[tool.category];
  const canonical = `/tools/${tool.slug}.html`;

  // window.FORMDA_TOOL: 엔진이 읽는 도구 설정 (도구별 데이터만 직렬화)
  const toolConfig = {
    slug: tool.slug,
    docType: tool.docType,
    doc: tool.doc,
    sample: tool.sample,
  };

  return `${head({
    title: tool.seoTitle,
    description: tool.seoDescription,
    canonical,
    keywords: (tool.keywords || []).join(', '),
  })}
${header(tool.category)}

<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › <a href="/category/${cat.slug}.html">${cat.label}</a> › ${tool.navTitle}</div>
  <h1 class="title">${tool.navTitle} 작성기</h1>
  <p class="use-lead"><b>${tool.use}</b>${tool.example ? ` <span class="use-eg">예: ${tool.example}</span>` : ''}</p>
  <p class="subtitle">입력만 하면 ${tool.navTitle} PDF·PNG로 바로 완성됩니다. 가입 없이 무료.</p>
  ${trustBadge()}
  ${steps()}

  <div class="tabs no-print">
    <button id="tabInput" class="on" onclick="Formda.app.showPane('input')">입력</button>
    <button id="tabPreview" onclick="Formda.app.showPane('preview')">미리보기</button>
  </div>

  <div class="editor">
  <div class="cols">
    <section class="pane-input">
      <div class="pane-head">
        <span class="pv-label">입력</span>
        <div class="head-actions no-print">
          <button class="mini-btn sample" type="button" onclick="Formda.app.loadSample()">✨ 예시로 10초 만에 확인하기</button>
          <button class="mini-btn danger" type="button" onclick="Formda.app.clearAll()">전체 비우기</button>
        </div>
      </div>
      <div class="form-scroll"><div id="formPanel"><!-- 입력폼: 엔진이 렌더 --></div></div>
    </section>

    <section class="pane-preview">
      <div class="pane-head">
        <span class="pv-label">미리보기</span>
        <div class="head-actions no-print">
          <button class="mini-btn pv-exp" type="button" onclick="Formda.app.downloadPNG(this)">PNG 저장</button>
          <button class="mini-btn primary pv-exp" type="button" onclick="Formda.app.downloadPDF(this)">PDF 다운로드</button>
          <div class="zoom">
            <button type="button" onclick="Formda.app.zoomOut()" aria-label="축소">−</button>
            <button type="button" class="zoom-pct" onclick="Formda.app.zoomReset()" aria-label="맞춤"><span id="zoomLabel">100%</span></button>
            <button type="button" onclick="Formda.app.zoomIn()" aria-label="확대">+</button>
          </div>
        </div>
      </div>
      <div class="preview-wrap">
        <div class="doc-viewport" id="doc"><!-- 미리보기: 엔진이 A4 페이지로 렌더 --></div>
        ${pricingBlock(tool)}
      </div>
    </section>
  </div>
  </div>

  ${legalNoteHTML(tool)}
  ${guideHTML(tool)}
</main>

<!-- 모바일 하단 고정 다운로드 바 -->
<div class="mobile-bar no-print">
  <button class="btn btn-ghost" onclick="Formda.app.downloadPNG(this)">PNG</button>
  <button class="btn btn-primary btn-pdf" onclick="Formda.app.downloadPDF(this)">PDF 다운로드</button>
  <button class="btn btn-buy" onclick="Formda.pay.open('single')" aria-label="워터마크 제거">✦ 제거</button>
</div>

${footer()}

<script>window.FORMDA_TOOL = ${JSON.stringify(toolConfig)};</script>
<script src="/engine/calc.js"></script>
<script src="/engine/doc-render.js"></script>
<script src="/engine/form-engine.js"></script>
<script src="/engine/export.js"></script>
<script src="/engine/app.js"></script>
<script src="/engine/pay.js" defer></script>
${jsonLd(tool)}
`;
}

// 가이드 카드 라인 아이콘 (이모지 대신 직접 그린 SVG)
const GUIDE_ICONS = {
  checklist: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="m7.5 9 1.4 1.4L11.4 8"/><path d="M13.5 9.2h3"/><path d="m7.5 15 1.4 1.4 2.5-2.4"/><path d="M13.5 15.2h3"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="8" y="6.3" width="8" height="3.4" rx="1"/><path d="M9 13.5h.01M12 13.5h.01M15 13.5h.01M9 16.8h.01M12 16.8h.01M15 16.8h.01"/>',
  tip: '<path d="M9.5 18.5h5"/><path d="M10.2 21.5h3.6"/><path d="M12 2.5a6.3 6.3 0 0 0-3.9 11.3c.7.6 1 1.2 1 2.2h5.8c0-1 .3-1.6 1-2.2A6.3 6.3 0 0 0 12 2.5z"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.3 1.7c0 1.6-2.4 1.9-2.4 3.4"/><path d="M11.5 17.4h.02"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
};
function guideIco(key) {
  const p = GUIDE_ICONS[key] || GUIDE_ICONS.doc;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

// 저장·요금 안내 공통 FAQ (전 도구 동일). 무료/워터마크 경계를 정직하게 명시하되,
// 워터마크 제거는 수요검증(painted-door)이라 "준비 중·알림 신청"으로 안내한다.
const SAVE_FAQ = [
  { q: '저장은 무료인가요?', a: '네. 가입이나 결제 없이 완성한 문서를 PDF·PNG로 무료 저장할 수 있습니다. 문서 내용과 작성 기능에는 제한이 없습니다.' },
  { q: 'PDF와 PNG 둘 다 무료인가요?', a: '네, 두 형식 모두 무료입니다. 인쇄용은 PDF, 카톡·메일 첨부용은 PNG로 저장하시면 됩니다.' },
  { q: '무료로 저장하면 워터마크가 붙나요?', a: '무료 저장본에는 폼다 로고 워터마크와 하단에 사이트 주소가 옅게 표기됩니다. 문서 자체는 그대로 사용할 수 있습니다.' },
  { q: '워터마크만 없앨 수는 없나요?', a: '워터마크 없이 저장하는 기능을 준비하고 있습니다. 미리보기 아래 버튼에서 알림을 신청하시면 출시 시 가장 먼저 안내해 드립니다.' },
]
  .map((f) => `<div class="g-faq-item"><p class="faq-q">Q. ${f.q}</p><p>${f.a}</p></div>`)
  .join('\n');

// 민감 문서(법률·노무) 안내: 법률 자문이 아님을 명시해 분쟁 리스크를 차단한다.
// 법률형(차용증·합의서·내용증명·지불각서·위임장·프리랜서계약서) vs 노무형(근로계약서)로 문구 구분.
const LEGAL_NOTE_LABOR = new Set(['employment-contract']);
const LEGAL_NOTE_LEGAL = new Set(['loan', 'agreement', 'content-proof', 'payment-pledge', 'mandate', 'freelance-contract']);
function legalNoteHTML(tool) {
  const isLabor = LEGAL_NOTE_LABOR.has(tool.slug);
  const isLegal = LEGAL_NOTE_LEGAL.has(tool.slug);
  if (!isLabor && !isLegal) return '';
  const body = isLabor
    ? '이 도구는 표준 근로계약서 양식을 제공할 뿐, 노무 자문이 아닙니다. 근로조건·수당·계약 형태는 근로기준법과 개별 사정에 따라 달라질 수 있으니, 중요한 계약은 공인노무사나 고용노동부 상담을 함께 확인하시기 바랍니다.'
    : `이 도구는 일반적인 ${tool.navTitle} 양식을 제공할 뿐, 법률 자문이 아닙니다. 문서의 법적 효력과 분쟁 결과는 금액·조건·개별 상황에 따라 달라질 수 있으니, 중요한 사안은 변호사 등 전문가의 검토를 받으시길 권합니다.`;
  return `<div class="legal-note no-print"><span class="ln-ico">⚖️</span><p><b>법적 효력 안내</b> · ${body}</p></div>`;
}

// 프리렌더 본문 (정적 = 네이버 색인 + 애드센스). 제목+리드+섹션 카드로 분리.
function guideHTML(tool) {
  const p = tool.prerender;
  const cards = (p.sections || [])
    .map((s) => `<article class="g-card"><div class="g-card-head"><span class="g-ico">${guideIco(s.icon)}</span><h3>${s.h}</h3></div>\n${s.html}</article>`)
    .join('\n');
  const faq = (p.faq || [])
    .map((f) => `<div class="g-faq-item"><p class="faq-q">Q. ${f.q}</p><p>${f.a}</p></div>`)
    .join('\n');
  return `<section class="guide" style="--accent:${tool.accent || '#4f46e5'}">
    <h2 class="guide-title">${tool.navTitle} 작성 가이드</h2>
    <p class="guide-lead">${p.intro}</p>
    <div class="guide-cards">
      ${cards}
      <article class="g-card g-faq"><div class="g-card-head"><span class="g-ico">${guideIco('faq')}</span><h3>자주 묻는 질문</h3></div>${faq}${SAVE_FAQ}</article>
    </div>
    ${relatedHTML(tool)}
  </section>`;
}

function relatedHTML(tool) {
  const cat = categoryBySlug[tool.category];
  const toolPills = (tool.related || [])
    .map((slug) => toolsBySlug[slug])
    .filter(Boolean) // 아직 없는 도구는 죽은 링크 방지 위해 제외
    .map((t) => `<a class="sibling-link" href="/tools/${t.slug}.html">${t.navTitle}</a>`);
  toolPills.push(`<a class="sibling-link" href="/category/${cat.slug}.html">${cat.label} 전체 ›</a>`);
  // 도구 → 관련 가이드 내부링크
  const guidePills = (guidesByTool[tool.slug] || [])
    .map((g) => `<a class="sibling-link" href="/guides/${g.slug}.html">${g.navTitle || g.title}</a>`);
  // 도구 → 제이퍼(jptcalc) 관련 계산기 (크로스사이트, 새 탭)
  const calcPills = (tool.calcLinks || [])
    .map((c) => `<a class="sibling-link" href="${c.href}" target="_blank" rel="noopener">${c.label}</a>`);
  const group = (title, items) => items.length
    ? `<div class="sibling-group"><div class="sibling-title">${title}</div><div class="sibling-list">${items.join('')}</div></div>`
    : '';
  return `<div class="sibling-section">${group('관련 문서 도구', toolPills)}${group('관련 가이드', guidePills)}${group('관련 계산기', calcPills)}</div>`;
}

// HowTo 1단계(입력) 안내를 문서 유형/도구별로 정확히. 하드코딩 "품목·금액"이
// 차용증·위임장처럼 품목이 없는 문서에까지 붙던 오류를 방지.
const HOWTO_INPUT_SLUG = {
  employment: '회사·근로자 정보와 재직 사항을 입력합니다.',
  resignation: '소속·직위와 퇴직 사유·퇴직 예정일을 입력합니다.',
  award: '수여 기관과 수상자 이름·상장 문구를 입력합니다.',
  loan: '채권자·채무자 정보와 차용 금액·이자율·변제기일을 입력합니다.',
  mandate: '위임인·수임인 정보와 위임할 내용을 입력합니다.',
};
const HOWTO_INPUT_TYPE = {
  'business-invoice': '공급자·공급받는자 정보와 품목·수량·단가를 입력합니다.',
  'resume': '인적사항·학력·경력 등 이력서 항목을 입력합니다.',
  'cover-letter': '지원 회사·직무와 자기소개 문항 내용을 입력합니다.',
  'career': '경력사항과 담당 업무·성과를 입력합니다.',
  'certificate': '문서에 들어갈 인적사항과 내용을 입력합니다.',
  'notice': '기관 정보와 안내할 내용을 입력합니다.',
  'card': '이름·직함·연락처 등 명함 정보를 입력합니다.',
  'legal': '당사자 정보와 문서 내용을 입력합니다.',
  'payslip': '회사·근로자 정보와 지급·공제 항목을 입력합니다.',
  'contract': '사업주·근로자 정보와 근로시간·임금 등 근로조건을 입력합니다.',
  'expense': '부서·작성자·결재선과 지출 내역을 입력합니다.',
  'handover': '인계자·인수자와 인수인계할 업무 항목을 입력합니다.',
};
function howtoInputText(tool) {
  return HOWTO_INPUT_SLUG[tool.slug] || HOWTO_INPUT_TYPE[tool.docType] || '필요한 정보를 입력합니다.';
}

// 구조화 데이터 (SEO 리치결과 + GEO/AI 인용): FAQ · WebApplication(무료) · HowTo · Breadcrumb
function jsonLd(tool) {
  const cat = categoryBySlug[tool.category];
  const base = site.domain;
  const url = base + `/tools/${tool.slug}.html`;

  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: (tool.prerender.faq || []).map((f) => ({
      '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const app = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: `폼다 ${tool.navTitle} 작성기`, url,
    applicationCategory: 'BusinessApplication', operatingSystem: 'All',
    inLanguage: 'ko', description: tool.seoDescription,
    // 프리미엄 출시 시 무료+유료 티어로 갱신
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    publisher: orgNode(),
  };
  const howto = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `${tool.navTitle} 만드는 방법`, inLanguage: 'ko',
    totalTime: 'PT2M', image: base + '/assets/og.png',
    step: [
      { '@type': 'HowToStep', position: 1, name: '정보 입력', text: howtoInputText(tool) },
      { '@type': 'HowToStep', position: 2, name: '실시간 미리보기', text: `입력하는 즉시 A4 ${tool.navTitle} 문서에 그대로 반영됩니다.` },
      { '@type': 'HowToStep', position: 3, name: 'PDF·PNG 저장', text: '완성된 문서를 PDF나 PNG로 저장합니다.' },
    ],
  };
  const crumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: base + '/' },
      { '@type': 'ListItem', position: 2, name: cat.label, item: base + `/category/${cat.slug}.html` },
      { '@type': 'ListItem', position: 3, name: tool.navTitle },
    ],
  };
  return [faq, app, howto, crumb]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}
