// 텍스트 유틸 도구 페이지 (A4·PDF 없는 유틸 레이아웃 + 프리렌더 본문)
import { head, header, footer, trustBadge } from './shell.mjs';
import { svg } from './icons.mjs';
import { site, categoryBySlug, toolsBySlug } from '../data/registry.js';

export function textToolPage(tool) {
  const cat = categoryBySlug[tool.category];
  const canonical = `/tools/${tool.slug}.html`;
  const cfg = { slug: tool.slug, kind: tool.kind, sample: tool.sample };

  return `${head({ title: tool.seoTitle, description: tool.seoDescription, canonical, keywords: (tool.keywords || []).join(', ') })}
${header(tool.category)}

<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › <a href="/category/${cat.slug}.html">${cat.label}</a> › ${tool.navTitle}</div>
  <h1 class="title">${tool.navTitle}</h1>
  <p class="subtitle">${tool.summary}</p>
  ${trustBadge()}

  <section class="text-tool" style="--accent:${tool.accent || '#4f46e5'}">
    <div id="textTool"><!-- 유틸 UI: text-engine 렌더 --></div>
  </section>

  ${guideHTML(tool)}
</main>

${footer()}

<script>window.FORMDA_TEXT_TOOL = ${JSON.stringify(cfg)};</script>
<script src="/engine/text-engine.js"></script>
${jsonLd(tool)}
`;
}

// 카드 썸네일: 입력 → 결과를 보여주는 미니 프리뷰 (도구 성격이 한눈에 드러나게)
export function textThumb(tool) {
  const a = tool.accent || '#4f46e5';
  const body = {
    'char-count':
      '<div class="ttt-lines"><i></i><i></i><i style="width:78%"></i><i></i><i style="width:54%"></i></div>' +
      '<div class="ttt-big"><span class="n">1,248</span><span class="u">글자</span></div>',
    'name-roman':
      '<div class="ttt-io"><div class="ttt-ko">홍길동</div><div class="ttt-arrow">↓</div><div class="ttt-en">Hong Gildong</div></div>',
    'address-roman':
      '<div class="ttt-io"><div class="ttt-ko sm">서울특별시 강남구<br>테헤란로 152</div><div class="ttt-arrow">↓</div>' +
      '<div class="ttt-en sm">152 Teheran-ro,<br>Gangnam-gu, Seoul</div></div>',
    'text-align':
      '<div class="ttt-cols"><ul class="ttt-list before"><li>다람쥐</li><li>가오리</li><li>나비</li><li>다람쥐</li></ul>' +
      '<span class="ttt-arrow">→</span><ul class="ttt-list after"><li>가오리</li><li>나비</li><li>다람쥐</li></ul></div>',
  }[tool.slug] || '';
  return `<div class="tt-thumb" style="--accent:${a}">
    <div class="tt-thumb-head"><span class="tt-thumb-ic">${svg(tool.icon)}</span><span>${tool.navTitle}</span></div>
    <div class="tt-thumb-body ${tool.slug}">${body}</div>
  </div>`;
}

// ---- 아래는 tool-page.mjs와 같은 톤의 가이드/구조화데이터 (텍스트 도구용) ----
const GUIDE_ICONS = {
  checklist: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="m7.5 9 1.4 1.4L11.4 8"/><path d="M13.5 9.2h3"/><path d="m7.5 15 1.4 1.4 2.5-2.4"/><path d="M13.5 15.2h3"/>',
  tip: '<path d="M9.5 18.5h5"/><path d="M10.2 21.5h3.6"/><path d="M12 2.5a6.3 6.3 0 0 0-3.9 11.3c.7.6 1 1.2 1 2.2h5.8c0-1 .3-1.6 1-2.2A6.3 6.3 0 0 0 12 2.5z"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.3 1.7c0 1.6-2.4 1.9-2.4 3.4"/><path d="M11.5 17.4h.02"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
};
function guideIco(key) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${GUIDE_ICONS[key] || GUIDE_ICONS.doc}</svg>`; }

function guideHTML(tool) {
  const p = tool.prerender;
  const cards = (p.sections || [])
    .map((s) => `<article class="g-card"><div class="g-card-head"><span class="g-ico">${guideIco(s.icon)}</span><h3>${s.h}</h3></div>\n${s.html}</article>`)
    .join('\n');
  const faq = (p.faq || []).map((f) => `<div class="g-faq-item"><p class="faq-q">Q. ${f.q}</p><p>${f.a}</p></div>`).join('\n');
  return `<section class="guide" style="--accent:${tool.accent || '#4f46e5'}">
    <h2 class="guide-title">${tool.navTitle} 사용 가이드</h2>
    <p class="guide-lead">${p.intro}</p>
    <div class="guide-cards">
      ${cards}
      <article class="g-card g-faq"><div class="g-card-head"><span class="g-ico">${guideIco('faq')}</span><h3>자주 묻는 질문</h3></div>${faq}</article>
    </div>
    ${relatedHTML(tool)}
  </section>`;
}

function relatedHTML(tool) {
  const pills = (tool.related || []).map((slug) => toolsBySlug[slug]).filter(Boolean)
    .map((t) => `<a class="sibling-link" href="/tools/${t.slug}.html">${t.navTitle}</a>`);
  const cat = categoryBySlug[tool.category];
  pills.push(`<a class="sibling-link" href="/category/${cat.slug}.html">${cat.label} 전체 ›</a>`);
  return `<div class="sibling-section"><div class="sibling-title">관련 도구</div><div class="sibling-list">${pills.join('')}</div></div>`;
}

function jsonLd(tool) {
  const cat = categoryBySlug[tool.category];
  const base = site.domain;
  const url = base + `/tools/${tool.slug}.html`;
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: (tool.prerender.faq || []).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const app = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: `폼다 ${tool.navTitle}`, url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'All',
    inLanguage: 'ko', description: tool.seoDescription,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    publisher: { '@type': 'Organization', name: site.name, url: base + '/' },
  };
  const crumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: base + '/' },
      { '@type': 'ListItem', position: 2, name: cat.label, item: base + `/category/${cat.slug}.html` },
      { '@type': 'ListItem', position: 3, name: tool.navTitle },
    ],
  };
  return [faq, app, crumb].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}
