// 홈 (히어로 + 3단계 + 카테고리별 아이콘 카드 그리드)
import { head, header, footer, steps } from './shell.mjs';
import { site, categories, tools } from '../data/registry.js';

export function homePage() {
  const sections = categories.map((cat) => {
    const catTools = tools.filter((t) => t.category === cat.slug);
    return `<div class="section-h">${cat.icon} ${cat.label}
      <a class="more" href="/category/${cat.slug}.html">전체 보기 ›</a></div>
    <div class="grid">${catTools.length ? catTools.map(toolCard).join('') : soonCards(cat)}</div>`;
  }).join('\n');

  return `${head({
    title: `${site.name} - ${site.tagline}`,
    description: site.description,
    canonical: '/',
  })}
${header('')}

<section class="hero">
  <h1>입력하면 바로 완성, ${site.name}</h1>
  <p>가입 없이 견적서·거래명세서 같은 실무 문서를 입력만으로 만들고 PDF·PNG로 내려받으세요.</p>
  ${steps()}
</section>

<main class="wrap">
  ${sections}
</main>

${footer()}
`;
}

function toolCard(t) {
  return `<a class="tool-card" href="/tools/${t.slug}.html">
    <span class="ico">${t.icon}</span>
    <span class="nm">${t.navTitle}</span>
    <span class="de">${t.summary || ''}</span>
  </a>`;
}

// 아직 도구가 없는 카테고리 - 준비중 자리표시
function soonCards(cat) {
  return `<div class="tool-card soon"><span class="ico">${cat.icon}</span><span class="nm">${cat.name} 도구</span><span class="de">곧 추가됩니다.</span></div>`;
}
