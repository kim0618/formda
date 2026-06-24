// 카테고리 허브 (SEO 설명 + 도구 카드 그리드)
import { head, header, footer } from './shell.mjs';
import { site, tools } from '../data/registry.js';

export function categoryPage(cat) {
  const catTools = tools.filter((t) => t.category === cat.slug);
  const cards = catTools.length
    ? catTools.map((t) => `<a class="tool-card" href="/tools/${t.slug}.html">
        <span class="ico">${t.icon}</span>
        <span class="nm">${t.navTitle}</span>
        <span class="de">${t.summary || ''}</span>
      </a>`).join('')
    : `<div class="tool-card soon"><span class="ico">${cat.icon}</span><span class="nm">${cat.name} 도구</span><span class="de">곧 추가됩니다.</span></div>`;

  return `${head({
    title: `${cat.label} 자동작성 도구 모음 | ${site.name}`,
    description: cat.desc,
    canonical: `/category/${cat.slug}.html`,
  })}
${header(cat.slug)}

<main class="wrap">
  <div class="crumb"><a href="/">홈</a> › ${cat.label}</div>
  <div class="cat-hero">
    <h1>${cat.icon} ${cat.label}</h1>
    <p>${cat.desc}</p>
  </div>
  <div class="section-h">도구 ${catTools.length}종</div>
  <div class="grid">${cards}</div>
</main>

${footer()}
`;
}
