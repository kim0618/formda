// 폼다 빌드 - registry -> 정적 HTML (tools·home·category·pages) + sitemap + robots
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { site, categories, tools, categoryBySlug } from '../data/registry.js';
import { guides } from '../data/guides.js';
import { svg } from '../templates/icons.mjs';
import { toolPage, stubToolPage } from '../templates/tool-page.mjs';
import { textToolPage, textThumb } from '../templates/text-tool-page.mjs';
import { guidePage, guidesIndexPage } from '../templates/guide-page.mjs';
import { homePage } from '../templates/home.mjs';
import { categoryPage } from '../templates/category.mjs';
import { trustPages } from '../templates/page.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- 카드 썸네일: 엔진(doc-render)을 그대로 로드해 샘플이 채워진 완성 문서를 렌더 ----
const THUMB_DATE = '2026-06-24'; // 썸네일용 고정 날짜 (빌드 결정성)
function loadEngine() {
  const ctx = { window: {}, module: { exports: {} } };
  vm.createContext(ctx);
  for (const f of ['engine/calc.js', 'engine/doc-render.js']) {
    ctx.module = { exports: {} };
    vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx);
  }
  return ctx.window.Formda;
}
const ENGINE = loadEngine();
// 스텁: 빈 양식 스켈레톤 썸네일 (A4 .doc-page 안에 제목 + 회색 플레이스홀더)
function blankThumb(tool) {
  const bars = Array.from({ length: 8 }, () => '<div class="bl-row"></div>').join('');
  return '<div class="doc-page">' +
    `<div class="qt-title">${tool.docTitle || tool.navTitle}</div>` +
    '<div class="bl-meta"><span></span><span></span></div>' +
    '<div class="bl-box"></div>' +
    `<div class="bl-table"><div class="bl-row head"></div>${bars}</div>` +
    '</div>';
}
function renderThumb(tool) {
  if (tool.stub) return blankThumb(tool);
  if (tool.toolType === 'text') return textThumb(tool);
  const s = JSON.parse(JSON.stringify(tool.sample || {}));
  if (s.date === 'today') s.date = THUMB_DATE;
  if (!s.items || !s.items.length) s.items = [{ name: '', qty: 1, price: 0 }];
  s.sealImg = null;
  return ENGINE.docRender[tool.docType](s, tool.doc, { single: true });
}
const THUMBS = Object.fromEntries(tools.map((t) => [t.slug, renderThumb(t)]));

function out(relPath, content) {
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log('  ✓', relPath);
}

// 생성물 폴더 정리 (소스 폴더는 건드리지 않음)
for (const dir of ['tools', 'category', 'pages', 'guides']) {
  const p = join(ROOT, dir);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

console.log('[1/6] 도구 페이지');
for (const tool of tools) {
  const html = tool.stub ? stubToolPage(tool) : (tool.toolType === 'text' ? textToolPage(tool) : toolPage(tool));
  out(`tools/${tool.slug}.html`, html);
}

console.log('[2/6] 홈');
out('index.html', homePage(THUMBS));

console.log('[3/6] 카테고리 허브');
for (const cat of categories) {
  out(`category/${cat.slug}.html`, categoryPage(cat, THUMBS));
}

console.log('[4/6] 신뢰 페이지');
for (const p of trustPages()) {
  out(`pages/${p.slug}.html`, p.html);
}

console.log('[5/6] 가이드');
out('guides/index.html', guidesIndexPage(guides));
for (const g of guides) {
  out(`guides/${g.slug}.html`, guidePage(g));
}

console.log('[검색] 인덱스');
// 헤더 검색용 인덱스 (모든 페이지에서 로드). 도구명·키워드·예시·카테고리를 한 문자열로 합쳐 부분일치 검색.
const guideSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18v16H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 20.5A1.5 1.5 0 0 1 5.5 19H18"/><path d="M8 7.5h6M8 11h5"/></svg>';
const toolEntries = tools.filter((t) => !t.stub).map((t) => ({
  slug: t.slug,
  u: '/tools/' + t.slug + '.html',
  g: 0,
  t: t.navTitle,
  c: (categoryBySlug[t.category] || {}).label || '',
  d: t.use || t.summary || '',
  ac: t.accent || '#4f46e5',
  svg: svg(t.icon),
  k: [t.navTitle, t.title, (t.keywords || []).join(' '), t.example || '', t.summary || '', (categoryBySlug[t.category] || {}).label || '']
    .join(' ').toLowerCase(),
}));
const guideEntries = guides.map((g) => ({
  slug: g.slug,
  u: '/guides/' + g.slug + '.html',
  g: 1,
  t: g.navTitle || g.title,
  c: '가이드',
  d: g.seoDescription || g.lead || '',
  ac: '#0d9488',
  svg: guideSvg,
  k: [g.navTitle || '', g.title || '', (g.keywords || []).join(' '), g.seoDescription || '', '가이드']
    .join(' ').toLowerCase(),
}));
const searchIndex = toolEntries.concat(guideEntries);
out('search-index.js', 'window.Formda=window.Formda||{};window.Formda.searchIndex=' + JSON.stringify(searchIndex) + ';');

console.log('[6/6] sitemap + robots');
// 도구·홈·카테고리처럼 개별 날짜가 없는 URL의 lastmod (사이트 최종 수정일).
// 콘텐츠 리프레시 때 이 값을 올리면 전 URL의 재크롤 신호가 갱신된다.
const SITE_MODIFIED = '2026-07-01';
// 가이드 허브는 최신 가이드 날짜를 lastmod로.
const guidesLatest = guides.map((g) => g.date).sort().slice(-1)[0] || SITE_MODIFIED;
const urls = [
  { loc: '/', priority: '1.0', lastmod: SITE_MODIFIED },
  ...categories.map((c) => ({ loc: `/category/${c.slug}.html`, priority: '0.7', lastmod: SITE_MODIFIED })),
  ...tools.filter((t) => !t.stub).map((t) => ({ loc: `/tools/${t.slug}.html`, priority: '0.9', lastmod: SITE_MODIFIED })),
  { loc: '/guides/', priority: '0.7', lastmod: guidesLatest },
  ...guides.map((g) => ({ loc: `/guides/${g.slug}.html`, priority: '0.6', lastmod: g.updated || g.date })),
  ...['about', 'terms', 'privacy', 'contact'].map((s) => ({ loc: `/pages/${s}.html`, priority: '0.3', lastmod: SITE_MODIFIED })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.domain}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
out('sitemap.xml', sitemap);

// QA·검수 산출물(proof.html)은 색인 제외
out('robots.txt', `User-agent: *
Allow: /
Disallow: /proof.html
Sitemap: ${site.domain}/sitemap.xml
`);

console.log(`\n완료: 도구 ${tools.length} · 카테고리 ${categories.length} · 가이드 ${guides.length} · 신뢰 4 · sitemap ${urls.length} URL`);
