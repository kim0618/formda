// 폼다 빌드 - registry -> 정적 HTML (tools·home·category·pages) + sitemap + robots
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, categories, tools } from '../data/registry.js';
import { toolPage } from '../templates/tool-page.mjs';
import { homePage } from '../templates/home.mjs';
import { categoryPage } from '../templates/category.mjs';
import { trustPages } from '../templates/page.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function out(relPath, content) {
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log('  ✓', relPath);
}

// 생성물 폴더 정리 (소스 폴더는 건드리지 않음)
for (const dir of ['tools', 'category', 'pages']) {
  const p = join(ROOT, dir);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

console.log('[1/5] 도구 페이지');
for (const tool of tools) {
  out(`tools/${tool.slug}.html`, toolPage(tool));
}

console.log('[2/5] 홈');
out('index.html', homePage());

console.log('[3/5] 카테고리 허브');
for (const cat of categories) {
  out(`category/${cat.slug}.html`, categoryPage(cat));
}

console.log('[4/5] 신뢰 페이지');
for (const p of trustPages()) {
  out(`pages/${p.slug}.html`, p.html);
}

console.log('[5/5] sitemap + robots');
const urls = [
  { loc: '/', priority: '1.0' },
  ...categories.map((c) => ({ loc: `/category/${c.slug}.html`, priority: '0.7' })),
  ...tools.map((t) => ({ loc: `/tools/${t.slug}.html`, priority: '0.9' })),
  ...['about', 'terms', 'privacy', 'contact'].map((s) => ({ loc: `/pages/${s}.html`, priority: '0.3' })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.domain}${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
out('sitemap.xml', sitemap);

out('robots.txt', `User-agent: *
Allow: /
Sitemap: ${site.domain}/sitemap.xml
`);

console.log(`\n완료: 도구 ${tools.length} · 카테고리 ${categories.length} · 신뢰 4 · sitemap ${urls.length} URL`);
