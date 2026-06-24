// 도구 페이지 템플릿 (좌 입력 / 우 A4 미리보기 + 프리렌더 본문)
import { head, header, footer, trustBadge, steps } from './shell.mjs';
import { site, categoryBySlug, toolsBySlug } from '../data/registry.js';

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
  <h1 class="title">${tool.title}</h1>
  <p class="subtitle">입력하면 바로 완성됩니다. 가입 없이 무료로 PDF·PNG까지.</p>
  ${trustBadge()}
  ${steps()}

  <div class="tabs no-print">
    <button id="tabInput" class="on" onclick="Formda.app.showPane('input')">입력</button>
    <button id="tabPreview" onclick="Formda.app.showPane('preview')">미리보기</button>
  </div>

  <div class="cols">
    <section class="card pane-input">
      <div id="formPanel"><!-- 입력폼: 엔진이 렌더 --></div>
    </section>

    <section class="pane-preview">
      <div class="preview-wrap">
        <div class="paper" id="doc"><!-- 미리보기: 엔진이 렌더 --></div>
        <div class="actions no-print">
          <button class="btn btn-ghost" onclick="Formda.app.print()">인쇄</button>
          <button class="btn btn-ghost" onclick="Formda.app.downloadPNG(this)">PNG</button>
          <button class="btn btn-primary" onclick="Formda.app.downloadPDF(this)">PDF 다운로드</button>
        </div>
      </div>
    </section>
  </div>

  ${guideHTML(tool)}
</main>

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

// 프리렌더 본문 (정적 = 네이버 색인 + 애드센스). JS 빈 껍데기 금지.
function guideHTML(tool) {
  const p = tool.prerender;
  const sections = (p.sections || [])
    .map((s) => `<h3>${s.h}</h3>\n${s.html}`)
    .join('\n');
  const faq = (p.faq || [])
    .map((f) => `<p class="faq-q">Q. ${f.q}</p>\n<p>${f.a}</p>`)
    .join('\n');
  const related = relatedHTML(tool);
  return `<article class="guide">
    <h2>${tool.navTitle}란?</h2>
    <p>${p.intro}</p>
    ${sections}
    <h3>자주 묻는 질문</h3>
    ${faq}
    ${related}
  </article>`;
}

function relatedHTML(tool) {
  const links = (tool.related || [])
    .map((slug) => toolsBySlug[slug])
    .filter(Boolean) // 아직 없는 도구는 죽은 링크 방지 위해 제외
    .map((t) => `<a href="/tools/${t.slug}.html">${t.title}</a>`);
  const cat = categoryBySlug[tool.category];
  links.push(`<a href="/category/${cat.slug}.html">${cat.label} 전체</a>`);
  return `<div class="related"><b>관련 도구</b>${links.join('')}</div>`;
}

// FAQ 구조화 데이터 (검색 리치 결과)
function jsonLd(tool) {
  const faq = (tool.prerender.faq || []).map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq,
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}
