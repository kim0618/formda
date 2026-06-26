// 홈 - 결과물(A4)이 주인공인 도구형 랜딩.
// 히어로 좌우 2단 → 대표 도구(견적서 크게) → 3단계 → 왜 폼다 → 카테고리(텍스트형)
import { head, header, footer } from './shell.mjs';
import { svg } from './icons.mjs';
import { site, categories, tools, categoryBySlug, toolsBySlug } from '../data/registry.js';
import { guides } from '../data/guides.js';

export function homePage(thumbs = {}) {
  const live = tools.filter((t) => !t.stub); // 실제 사용 가능한 도구
  const lead = live[0];                       // 히어로 대표(견적서)
  const leadDoc = thumbs[lead.slug] || '';

  return `${head({
    title: `견적서 PDF 무료 만들기 - 입력하면 바로 완성 | ${site.name}`,
    description: site.description,
    canonical: '/',
  })}
${header('')}

<!-- 히어로: 좌 카피/CTA · 우 A4 결과물 -->
<section class="hero">
  <div class="hero-in">
    <div class="hero-copy">
      <h1>가입 없이,<br>견적서 PDF를 바로 만드세요</h1>
      <p>회사 정보와 품목만 입력하면 공급가액·부가세·합계를 자동 계산해 견적서를 완성합니다.</p>
      <div class="hero-cta">
        <a class="btn-cta primary" href="/tools/${lead.slug}.html">견적서 바로 만들기</a>
        <a class="btn-cta ghost" href="#tools">문서 전체 보기</a>
      </div>
      <div class="badges">
        <span class="badge"><b>🔒</b> 서버 저장 없음</span>
        <span class="badge"><b>⚡</b> 1분 작성</span>
        <span class="badge"><b>📄</b> PDF·PNG 저장</span>
      </div>
    </div>
    <div class="hero-art">
      <span class="hero-pill">실시간 미리보기</span>
      <div class="hero-doc"><div class="thumb-doc">${leadDoc}</div></div>
      <span class="hero-chip">✍️ 입력하면 자동 완성</span>
    </div>
  </div>
</section>

<main class="wrap">
  <!-- 자주 쓰는 문서: 사용 가능한 도구 균일 그리드 (히어로가 대표 견적서를 이미 강조) -->
  <div class="section-h reveal" id="tools">자주 쓰는 문서</div>
  <div class="grid reveal">${live.map((t) => liveCard(t, thumbs)).join('')}</div>

  <!-- 3단계 -->
  <section class="home-sec reveal">
    <h2 class="home-sec-h">이렇게 3단계면 끝나요</h2>
    <div class="steps3">
      <div class="step3"><div class="step3-top"><span class="step3-n">1</span>${stepIco('pen')}</div><b>필요한 정보 입력</b><p>회사 정보와 품목, 금액을 입력합니다.</p></div>
      <div class="step3-arrow">→</div>
      <div class="step3"><div class="step3-top"><span class="step3-n">2</span>${stepIco('eye')}</div><b>A4 미리보기 확인</b><p>입력하는 즉시 문서에 그대로 반영됩니다.</p></div>
      <div class="step3-arrow">→</div>
      <div class="step3"><div class="step3-top"><span class="step3-n">3</span>${stepIco('save')}</div><b>PDF·PNG 저장</b><p>PDF·PNG로 저장하거나 바로 인쇄할 수 있습니다.</p></div>
    </div>
  </section>

  <!-- 왜 폼다인가 -->
  <section class="home-sec reveal">
    <h2 class="home-sec-h">양식 찾을 시간에, 그냥 만드세요</h2>
    <div class="why">
      <div class="why-item"><b>설치 없이 바로 작성</b><p>한글·엑셀 프로그램 없이 브라우저에서 바로 작성합니다.</p></div>
      <div class="why-item"><b>금액 자동 계산</b><p>공급가액·부가세·합계를 자동으로 계산합니다.</p></div>
      <div class="why-item"><b>입력 정보 서버 저장 없음</b><p>작성 내용은 서버로 전송되지 않고 브라우저에서만 처리됩니다.</p></div>
      <div class="why-item"><b>모바일에서도 사용</b><p>PC뿐 아니라 모바일에서도 문서를 만들고 저장할 수 있습니다.</p></div>
    </div>
  </section>

  <!-- 카테고리 (텍스트형, 준비중은 작게) -->
  <section class="home-sec reveal">
    <div class="home-sec-head">
      <h2 class="home-sec-h">어떤 문서가 필요하세요?</h2>
      <div class="cat-legend"><span class="lg lg-live">바로 사용 가능</span><span class="lg lg-soon">곧 준비 중</span></div>
    </div>
    <div class="cat-list">${categories.map(catRow).join('')}</div>
  </section>

  <!-- 가이드 -->
  <section class="home-sec reveal">
    <div class="home-sec-head">
      <h2 class="home-sec-h">문서 작성 가이드</h2>
      <a class="sec-more" href="/guides/">전체 보기 →</a>
    </div>
    <div class="guide-grid">${guides.slice(0, 6).map(guideCardHome).join('')}</div>
  </section>
</main>

<script src="/engine/thumb.js"></script>
<script src="/engine/reveal.js"></script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.domain + '/', inLanguage: 'ko', description: site.description })}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: site.domain + '/', logo: site.domain + '/assets/logo.png' })}</script>
${footer()}
`;
}

function guideCardHome(g) {
  const cat = categoryBySlug[g.category];
  const tool = toolsBySlug[g.tool];
  return `<a class="guide-card" href="/guides/${g.slug}.html" style="--accent:${(tool && tool.accent) || '#4f46e5'}">
    <span class="guide-card-tag">${cat.label}</span>
    <h3>${g.title}</h3>
    <p>${g.seoDescription}</p>
    <span class="guide-card-go">읽어보기 →</span>
  </a>`;
}

// 대표 도구 가로형 카드: 좌 A4 썸네일 · 우 정보/기능/대상/CTA (카테고리 페이지서도 재사용)
export function featureCard(t, doc) {
  const feats = (t.features || []).map((f) => `<li>${f}</li>`).join('');
  return `<a class="feature" href="/tools/${t.slug}.html">
    <div class="feature-thumb"><div class="feat-doc">${doc}</div></div>
    <div class="feature-body">
      <div class="feature-tags"><span class="tag pop">대표 문서</span><span class="tag free">무료</span><span class="tag alt">PDF · PNG · 인쇄</span></div>
      <h3>${t.navTitle} 작성기</h3>
      <p>${t.summary || ''}</p>
      ${feats ? `<ul class="feature-list">${feats}</ul>` : ''}
      <div class="feature-meta">
        ${t.audience ? `<span class="fm-target">추천 <b>${t.audience}</b></span>` : ''}
        <span class="fm-trust">🔒 입력 정보는 서버에 저장되지 않습니다</span>
      </div>
      <span class="btn-cta primary">바로 만들기 →</span>
    </div>
  </a>`;
}

// 추가 라이브 도구 카드 (대표 카드 아래 그리드; 견적서 외 도구가 생기면 자동 노출)
function liveCard(t, thumbs) {
  const suffix = t.category === 'text' ? '' : ' 작성기';
  return `<a class="tool-card" href="/tools/${t.slug}.html" style="--accent:${t.accent || '#4f46e5'}">
    <div class="thumb"><div class="thumb-doc">${thumbs[t.slug] || ''}</div></div>
    <div class="tool-meta">
      <div class="nm"><span class="tool-ic">${svg(t.icon)}</span>${t.navTitle}${suffix}</div>
      <p class="de">${t.use || t.summary || ''}</p>
      <div class="meta-row"><span class="tag free">무료</span><span class="tag alt">PDF·PNG</span><span class="go">만들기 →</span></div>
    </div>
  </a>`;
}

// 3단계 아이콘 (라인 SVG)
function stepIco(key) {
  const p = {
    pen: '<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
    save: '<path d="M12 4v10"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M5 19h14"/>',
  }[key];
  return `<span class="step3-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg></span>`;
}

// 카테고리 행 (사용 가능 = 인디고 칩, 준비중은 조용한 한 줄로 축소)
function catRow(cat) {
  const inCat = tools.filter((t) => t.category === cat.slug);
  const live = inCat.filter((t) => !t.stub)
    .map((t) => `<a class="t-live" href="/tools/${t.slug}.html">${t.navTitle}</a>`);
  const soonNames = inCat.filter((t) => t.stub).map((t) => t.navTitle);
  return `<div class="cat-row">
    <div class="cat-row-head">
      <a class="cat-row-name" href="/category/${cat.slug}.html">${cat.label}</a>
      <a class="cat-more" href="/category/${cat.slug}.html">전체 보기 ›</a>
    </div>
    ${live.length ? `<div class="cat-row-tools">${live.join('')}</div>` : ''}
    ${soonNames.length ? `<div class="cat-soon-line">곧 추가: ${soonNames.join(' · ')}</div>` : ''}
  </div>`;
}
