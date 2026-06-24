// 카테고리 허브 = 문서 선택 허브
// 사용 가능 도구는 균일한 그리드 카드(확장 대비), 준비중은 작게(리스트), 선택 가이드 + FAQ로 깊이.
import { head, header, footer } from './shell.mjs';
import { site, tools } from '../data/registry.js';

// 받침 유무로 조사 선택 (을/를, 은/는)
function josa(word, withBatchim, withoutBatchim) {
  const c = word.charCodeAt(word.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
  return word + (has ? withBatchim : withoutBatchim);
}

const FAQ = [
  { q: '입력한 정보가 서버에 저장되나요?', a: '아니요. 입력 정보는 서버로 전송하지 않고 사용자 브라우저에서만 처리됩니다.' },
  { q: '무료인가요?', a: '네. 문서 작성과 PDF·PNG 저장, 인쇄까지 모두 무료로 제공합니다.' },
  { q: '모바일에서도 사용할 수 있나요?', a: '네. 모바일에서도 입력·실시간 미리보기·저장이 가능하도록 지원합니다.' },
  { q: '작성한 문서는 어떻게 받나요?', a: 'PDF 또는 PNG 파일로 내려받거나 브라우저에서 바로 인쇄할 수 있습니다.' },
];

export function categoryPage(cat, thumbs = {}) {
  const inCat = tools.filter((t) => t.category === cat.slug);
  const live = inCat.filter((t) => !t.stub);
  const planned = inCat.filter((t) => t.stub);
  const suffix = cat.slug === 'text' ? '' : ' 작성기';

  const badges = [
    live.length ? `${live[0].navTitle} 사용 가능` : '곧 출시',
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
        <h2 class="home-sec-h">지금 사용 가능한 도구</h2>
        <div class="grid cat-grid">${live.map((t) => `
          <a class="tool-card" href="/tools/${t.slug}.html">
            <div class="thumb"><div class="thumb-doc">${thumbs[t.slug] || ''}</div></div>
            <div class="tool-meta">
              <div class="nm">${t.navTitle}${suffix}</div>
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

  const guide = inCat.map((t) =>
    `<div class="dg-item"><b>${t.navTitle}</b><p>${t.use || ''}</p>${t.example ? `<span class="dg-ex">예: ${t.example}</span>` : ''}</div>`).join('');

  const faqHtml = FAQ.map((f) =>
    `<div class="faq-item"><div class="q">${f.q}</div><div class="a">${f.a}</div></div>`).join('');
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
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
    <h2 class="home-sec-h">어떤 문서를 써야 할까요?</h2>
    <div class="doc-guide">${guide}</div>
  </section>

  <section class="home-sec">
    <h2 class="home-sec-h">자주 묻는 질문</h2>
    <div class="faq-list">${faqHtml}</div>
  </section>
</main>

<script src="/engine/thumb.js"></script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: site.domain + '/' }, { '@type': 'ListItem', position: 2, name: cat.label }] })}</script>
${footer()}
`;
}
