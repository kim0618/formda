// 카테고리 허브 = 문서 선택 허브
// 사용 가능 도구는 균일한 그리드 카드(확장 대비), 준비중은 작게(리스트), 선택 가이드 + FAQ로 깊이.
import { head, header, footer } from './shell.mjs';
import { svg } from './icons.mjs';
import { site, tools } from '../data/registry.js';
import { guides } from '../data/guides.js';

// 받침 유무로 조사 선택 (을/를, 은/는)
function josa(word, withBatchim, withoutBatchim) {
  const c = word.charCodeAt(word.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
  return word + (has ? withBatchim : withoutBatchim);
}

// 카테고리에 faq가 없을 때의 폴백 (전 카테고리에 faq를 채우면 거의 안 쓰임)
const FAQ = [
  { q: '입력한 정보가 서버에 저장되나요?', a: '아니요. 입력 정보는 서버로 전송하지 않고 사용자 브라우저에서만 처리됩니다.' },
  { q: '무료인가요?', a: '네. 문서 작성과 PDF·PNG 저장, 인쇄까지 모두 무료로 제공합니다.' },
];

const GUIDE_ICONS = {
  checklist: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="m7.5 9 1.4 1.4L11.4 8"/><path d="M13.5 9.2h3"/><path d="m7.5 15 1.4 1.4 2.5-2.4"/><path d="M13.5 15.2h3"/>',
  tip: '<path d="M9.5 18.5h5"/><path d="M10.2 21.5h3.6"/><path d="M12 2.5a6.3 6.3 0 0 0-3.9 11.3c.7.6 1 1.2 1 2.2h5.8c0-1 .3-1.6 1-2.2A6.3 6.3 0 0 0 12 2.5z"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.3 1.7c0 1.6-2.4 1.9-2.4 3.4"/><path d="M11.5 17.4h.02"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
};
function guideIco(key) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${GUIDE_ICONS[key] || GUIDE_ICONS.doc}</svg>`; }

export function categoryPage(cat, thumbs = {}) {
  const inCat = tools.filter((t) => t.category === cat.slug);
  const live = inCat.filter((t) => !t.stub);
  const planned = inCat.filter((t) => t.stub);
  const suffix = cat.slug === 'text' ? '' : ' 작성기';

  const badges = [
    live.length ? `${live.length}종 바로 사용` : '곧 출시',
    '무료',
    'PDF·PNG 저장',
    '서버 저장 없음',
  ].map((b) => `<span class="cat-badge">${b}</span>`).join('');

  // 처음 사용자 추천 동선 (사용 가능한 도구가 있을 때)
  const reco = live.length
    ? `<div class="cat-reco">👉 처음이라면 <b>${live[0].navTitle}${suffix}</b>부터 사용해보세요. ${live[0].use || ''} 완성한 문서는 PDF·PNG로 저장해 바로 전달할 수 있어요.</div>`
    : `<div class="cat-reco">지금 바로 쓸 수 있는 <b><a href="/tools/estimate.html">견적서 작성기</a></b>부터 사용해보세요. 이 카테고리 도구는 순차적으로 추가됩니다.</div>`;

  // 사용 가능 = 균일한 그리드 카드 (도구가 늘어도 깔끔하게 확장)
  const liveSection = live.length
    ? `<section class="home-sec" style="margin-top:40px">
        <h2 class="home-sec-h">${planned.length ? '지금 사용 가능한 도구' : (cat.slug === 'text' ? '텍스트 도구' : '문서 작성기')}</h2>
        <div class="grid cat-grid">${live.map((t) => `
          <a class="tool-card" href="/tools/${t.slug}.html" style="--accent:${t.accent || '#4f46e5'}">
            <div class="thumb"><div class="thumb-doc">${thumbs[t.slug] || ''}</div></div>
            <div class="tool-meta">
              <div class="nm"><span class="tool-ic">${svg(t.icon)}</span>${t.navTitle}${suffix}</div>
              <p class="de">${t.use || t.summary || ''}</p>
              <div class="meta-row"><span class="tag free">무료</span><span class="tag alt">PDF·PNG</span><span class="go">만들기 →</span></div>
            </div>
          </a>`).join('')}</div>
      </section>`
    : '';

  // 준비중 = 작은 리스트 (썸네일 없이)
  const soonSection = planned.length
    ? `<section class="home-sec">
        <h2 class="home-sec-h">${live.length ? '곧 추가될 문서' : '곧 출시 예정 문서'}</h2>
        <div class="soon-list">${planned.map((t) =>
          `<a class="soon-item" href="/tools/${t.slug}.html">
            <b>${t.navTitle}${suffix}</b><p>${t.use || ''}</p><span class="soon-tag">준비 중</span>
          </a>`).join('')}</div>
      </section>`
    : '';

  // 카드(위)는 '만들기'(작성기)로, 이 선택 섹션은 '작성법 가이드'로 (역할 분리). 콤팩트 카드 그리드.
  const guide = inCat.map((t) => {
    const g = guides.find((x) => x.tool === t.slug && x.slug.startsWith('how-to')) || guides.find((x) => x.tool === t.slug);
    const href = g ? `/guides/${g.slug}.html` : `/tools/${t.slug}.html`;
    const pick = g ? `${t.navTitle} 가이드` : `${t.navTitle}${suffix}`;
    return `<a class="dg-item" href="${href}" style="--accent:${t.accent || '#4f46e5'}">
      <span class="dg-when">${t.example || t.use || ''}</span>
      <span class="dg-pick"><span class="dg-pick-ic">${svg(t.icon)}</span>${pick} →</span>
    </a>`;
  }).join('');

  const cf = cat.faq || FAQ;
  const catSections = (cat.sections || []).map((s) =>
    `<article class="g-card"><div class="g-card-head"><span class="g-ico">${guideIco(s.icon)}</span><h3>${s.h}</h3></div>${s.html}</article>`).join('');
  const catFaq = cf.map((f) => `<div class="g-faq-item"><p class="faq-q">Q. ${f.q}</p><p>${f.a}</p></div>`).join('');
  const catGuide = cat.intro
    ? `<section class="guide">
        <h2 class="guide-title">${cat.label} 가이드</h2>
        <p class="guide-lead">${cat.intro}</p>
        <div class="guide-cards">${catSections}
          <article class="g-card g-faq"><div class="g-card-head"><span class="g-ico">${guideIco('faq')}</span><h3>자주 묻는 질문</h3></div>${catFaq}</article>
        </div>
      </section>`
    : '';
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: cf.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return `${head({
    title: `${cat.label} 자동작성 도구 모음 | ${site.name}`,
    description: cat.desc,
    canonical: `/category/${cat.slug}.html`,
  })}
${header(cat.slug)}

<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › ${cat.label}</div>

  <div class="cat-hero">
    <h1>${cat.label}</h1>
    <p>${cat.desc}</p>
    <div class="cat-badges">${badges}</div>
  </div>

  ${reco}
  ${liveSection}
  ${soonSection}

  <section class="home-sec">
    <h2 class="home-sec-h">이럴 때 어떤 문서를 쓰나요?</h2>
    <div class="doc-guide">${guide}</div>
  </section>

  ${catGuide}
</main>

<script src="/engine/thumb.js?v=2"></script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: site.domain + '/' }, { '@type': 'ListItem', position: 2, name: cat.label }] })}</script>
${footer()}
`;
}
