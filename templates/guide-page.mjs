// 가이드 아티클 페이지 (/guides/{slug}.html) - 롱폼 SEO 콘텐츠 + 도구 CTA + 내부링크
import { head, header, footer, orgNode } from './shell.mjs';
import { svg } from './icons.mjs';
import { site, categories, categoryBySlug, toolsBySlug } from '../data/registry.js';
import { guidesByCategory } from '../data/guides.js';
import { guideExtras } from '../data/guide-extras.js';

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}

export function guidePage(guide) {
  const cat = categoryBySlug[guide.category];
  const canonical = `/guides/${guide.slug}.html`;
  const tool = toolsBySlug[guide.tool];

  const sections = guide.sections
    .map((s) => `<h2>${s.h}</h2>\n${s.html}`).join('\n');

  const toc = (guide.toc && guide.toc.length)
    ? `<div class="article-toc"><div class="article-toc-h">이 글에서 확인할 수 있는 것</div><ul>${guide.toc.map((t) => `<li>${t}</li>`).join('')}</ul></div>`
    : '';

  const faq = (guide.faq || [])
    .map((f) => `<div class="g-faq-item"><p class="faq-q">Q. ${f.q}</p><p>${f.a}</p></div>`).join('\n');

  // GEO: 상단 "빠른 답변" 박스 (AI 답변 엔진이 그대로 인용할 수 있는 자기완결 요약)
  const ex = guideExtras[guide.slug] || {};
  const answerBox = ex.answer
    ? `<div class="answer-box"><div class="answer-box-h">핵심 요약</div><p class="answer-box-a">${ex.answer}</p>${
        (ex.facts && ex.facts.length) ? `<ul class="answer-box-facts">${ex.facts.map((f) => `<li>${f}</li>`).join('')}</ul>` : ''
      }</div>`
    : '';
  // E-E-A-T: 법률·세무 가이드의 출처/참고 자료 + 기준연도
  const sources = (ex.sources && ex.sources.length)
    ? `<div class="article-sources"><div class="article-sources-h">참고 자료${ex.basisYear ? ` · ${ex.basisYear}년 시행 기준` : ''}</div><ul>${
        ex.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener nofollow">${s.label}</a></li>`).join('')
      }</ul></div>`
    : '';

  // 도구 CTA (주 연결 도구)
  const cta = tool ? `<aside class="article-cta" style="--accent:${tool.accent || '#4f46e5'}">
      <div class="article-cta-ic">${svg(tool.icon)}</div>
      <div class="article-cta-body">
        <b>${tool.navTitle}, 지금 바로 만들어 보세요</b>
        <p>${tool.summary || tool.use || ''}</p>
      </div>
      <a class="btn-cta primary" href="/tools/${tool.slug}.html">${tool.navTitle} 만들기 →</a>
    </aside>` : '';

  return `${head({ title: guide.seoTitle, description: guide.seoDescription, canonical, keywords: (guide.keywords || []).join(', '), ogType: 'article', publishedTime: guide.date, modifiedTime: guide.updated || guide.date })}
${header(guide.category)}

<main class="wrap article-wrap">
  <div class="crumb"><a href="/">홈</a> › <a href="/category/${cat.slug}.html">${cat.label}</a> › <a href="/guides/">가이드</a> › ${guide.navTitle || '가이드'}</div>

  <article class="article" style="--accent:${(tool && tool.accent) || '#4f46e5'}">
    <header class="article-head">
      <span class="article-tag">${cat.label} 가이드</span>
      <h1>${guide.title}</h1>
      <div class="article-meta"><span>${fmtDate(guide.date)}</span><span>· 읽는 시간 약 ${guide.readMin}분</span></div>
      <p class="article-lead">${guide.lead}</p>
    </header>

    ${answerBox}
    ${toc}
    ${cta}

    <div class="article-body">
      ${sections}

      <h2>자주 묻는 질문</h2>
      <div class="g-faq-block">${faq}</div>

      ${guide.closing ? `<h2>${guide.closing.h}</h2>\n${guide.closing.html}` : ''}
      ${sources}
    </div>

    ${relatedHTML(guide)}
  </article>
</main>

${footer()}
${jsonLd(guide)}
`;
}

// 가이드 허브 (/guides/index.html)
export function guidesIndexPage(guides) {
  const card = (g) => {
    const tool = toolsBySlug[g.tool];
    return `<a class="guide-card" href="/guides/${g.slug}.html" style="--accent:${(tool && tool.accent) || '#4f46e5'}">
      <h3>${g.title}</h3>
      <p>${g.seoDescription}</p>
      <span class="guide-card-go">읽어보기 →</span>
    </a>`;
  };

  const sections = categories.map((c) => {
    const list = guidesByCategory[c.slug] || [];
    if (!list.length) return '';
    return `<section class="guide-cat">
      <h2 class="guide-cat-h">${c.label}<span class="guide-cat-n">${list.length}</span></h2>
      <div class="guide-grid">${list.map(card).join('\n')}</div>
    </section>`;
  }).filter(Boolean).join('\n');

  return `${head({ title: `문서 작성 가이드 | ${site.name}`, description: '견적서, 거래명세서 등 실무 문서를 제대로 쓰는 방법을 정리한 폼다 가이드 모음입니다.', canonical: '/guides/' })}
${header('guides')}
<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › 가이드</div>
  <div class="cat-hero"><h1>문서 작성 가이드</h1><p>실무 문서를 제대로 쓰는 방법을 쉽게 정리했습니다. 읽고 바로 폼다로 만들어 보세요.</p></div>
  ${sections || '<p class="muted">가이드를 준비하고 있습니다.</p>'}
</main>
${footer()}
`;
}

function relatedHTML(guide) {
  // 도구(만들기)와 가이드를 그룹으로 분리. 가이드는 긴 title 대신 짧은 navTitle로 통일.
  const toolPills = (guide.relatedTools || []).map((slug) => toolsBySlug[slug]).filter(Boolean)
    .map((t) => `<a class="sibling-link" href="/tools/${t.slug}.html">${t.navTitle} 만들기</a>`);
  const guidePills = (guidesByCategory[guide.category] || []).filter((g) => g.slug !== guide.slug)
    .map((g) => `<a class="sibling-link" href="/guides/${g.slug}.html">${g.navTitle || g.title}</a>`);
  guidePills.push('<a class="sibling-link" href="/guides/">가이드 전체 ›</a>');
  const group = (title, items) => items.length
    ? `<div class="sibling-group"><div class="sibling-title">${title}</div><div class="sibling-list">${items.join('')}</div></div>`
    : '';
  return `<div class="sibling-section">${group('관련 도구', toolPills)}${group('관련 가이드', guidePills)}</div>`;
}

function jsonLd(guide) {
  const base = site.domain;
  const url = base + `/guides/${guide.slug}.html`;
  const cat = categoryBySlug[guide.category];
  const article = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: guide.title, inLanguage: 'ko',
    datePublished: guide.date, dateModified: guide.updated || guide.date,
    image: base + '/assets/og.png',
    description: guide.seoDescription, mainEntityOfPage: url,
    author: orgNode(),
    publisher: orgNode(),
  };
  if ((guideExtras[guide.slug] || {}).answer) {
    article.speakable = { '@type': 'SpeakableSpecification', cssSelector: ['.answer-box'] };
  }
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: (guide.faq || []).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const crumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: base + '/' },
      { '@type': 'ListItem', position: 2, name: cat.label, item: base + `/category/${cat.slug}.html` },
      { '@type': 'ListItem', position: 3, name: '가이드', item: base + '/guides/' },
      { '@type': 'ListItem', position: 4, name: guide.title },
    ],
  };
  return [article, faq, crumb].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}
