// 도구 페이지 템플릿 (좌 입력 / 우 A4 미리보기 + 프리렌더 본문)
import { head, header, footer, trustBadge, steps } from './shell.mjs';
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
  <p class="subtitle">회사 정보와 품목만 입력하면 ${tool.navTitle} PDF·PNG를 바로 만들 수 있습니다. 가입 없이 무료.</p>
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
          <button class="mini-btn" type="button" onclick="Formda.app.loadSample()">샘플 불러오기</button>
          <button class="mini-btn danger" type="button" onclick="Formda.app.clearAll()">전체 비우기</button>
        </div>
      </div>
      <div class="form-scroll"><div id="formPanel"><!-- 입력폼: 엔진이 렌더 --></div></div>
    </section>

    <section class="pane-preview">
      <div class="pane-head">
        <span class="pv-label">미리보기</span>
        <div class="zoom no-print">
          <button type="button" onclick="Formda.app.zoomOut()" aria-label="축소">−</button>
          <button type="button" class="zoom-pct" onclick="Formda.app.zoomReset()" aria-label="맞춤"><span id="zoomLabel">100%</span></button>
          <button type="button" onclick="Formda.app.zoomIn()" aria-label="확대">+</button>
        </div>
      </div>
      <div class="preview-wrap">
        <div class="doc-viewport" id="doc"><!-- 미리보기: 엔진이 A4 페이지로 렌더 --></div>
        <div class="actions no-print">
          <button class="btn btn-ghost" onclick="Formda.app.print()">인쇄</button>
          <button class="btn btn-ghost" onclick="Formda.app.downloadPNG(this)">PNG 저장</button>
          <button class="btn btn-primary btn-pdf" onclick="Formda.app.downloadPDF(this)">PDF 다운로드</button>
        </div>
      </div>
    </section>
  </div>
  </div>

  ${guideHTML(tool)}
</main>

<!-- 모바일 하단 고정 다운로드 바 -->
<div class="mobile-bar no-print">
  <button class="btn btn-ghost" onclick="Formda.app.downloadPNG(this)">PNG</button>
  <button class="btn btn-primary btn-pdf" onclick="Formda.app.downloadPDF(this)">PDF 다운로드</button>
</div>

${footer()}

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>window.FORMDA_TOOL = ${JSON.stringify(toolConfig)};</script>
<script src="/engine/calc.js"></script>
<script src="/engine/doc-render.js"></script>
<script src="/engine/form-engine.js"></script>
<script src="/engine/export.js"></script>
<script src="/engine/app.js"></script>
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
      <article class="g-card g-faq"><div class="g-card-head"><span class="g-ico">${guideIco('faq')}</span><h3>자주 묻는 질문</h3></div>${faq}</article>
    </div>
    ${relatedHTML(tool)}
  </section>`;
}

function relatedHTML(tool) {
  const pills = (tool.related || [])
    .map((slug) => toolsBySlug[slug])
    .filter(Boolean) // 아직 없는 도구는 죽은 링크 방지 위해 제외
    .map((t) => `<a class="sibling-link" href="/tools/${t.slug}.html">${t.navTitle}</a>`);
  const cat = categoryBySlug[tool.category];
  pills.push(`<a class="sibling-link" href="/category/${cat.slug}.html">${cat.label} 전체 ›</a>`);
  // 도구 → 관련 가이드 내부링크
  const guidePills = (guidesByTool[tool.slug] || [])
    .map((g) => `<a class="sibling-link guide" href="/guides/${g.slug}.html">${g.navTitle || g.title}</a>`);
  const guideBlock = guidePills.length
    ? `<div class="sibling-title mt">관련 가이드</div><div class="sibling-list">${guidePills.join('')}</div>` : '';
  return `<div class="sibling-section"><div class="sibling-title">관련 문서 도구</div><div class="sibling-list">${pills.join('')}</div>${guideBlock}</div>`;
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
    publisher: { '@type': 'Organization', name: site.name, url: base + '/' },
  };
  const howto = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `${tool.navTitle} 만드는 방법`, inLanguage: 'ko',
    step: [
      { '@type': 'HowToStep', position: 1, name: '정보 입력', text: '회사 정보와 품목·금액을 입력합니다.' },
      { '@type': 'HowToStep', position: 2, name: '실시간 미리보기', text: '입력하는 즉시 A4 문서에 그대로 반영됩니다.' },
      { '@type': 'HowToStep', position: 3, name: 'PDF·PNG 저장', text: '완성된 문서를 PDF·PNG로 저장하거나 인쇄합니다.' },
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
