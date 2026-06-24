// 공통 셸 (head / header+nav / footer) - 모든 페이지 공통
import { site, categories } from '../data/registry.js';

const TRUST_PAGES = [
  { href: '/pages/about.html', label: '소개' },
  { href: '/pages/terms.html', label: '이용약관' },
  { href: '/pages/privacy.html', label: '개인정보처리방침' },
  { href: '/pages/contact.html', label: '문의' },
];

export function head({ title, description, canonical, keywords, robots }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script>document.documentElement.classList.add('js')</script>
<title>${title}</title>
<meta name="description" content="${escAttr(description || site.description)}" />
${robots ? `<meta name="robots" content="${robots}" />\n` : ''}${keywords ? `<meta name="keywords" content="${escAttr(keywords)}" />\n` : ''}<link rel="canonical" href="${site.domain}${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escAttr(title)}" />
<meta property="og:description" content="${escAttr(description || site.description)}" />
<meta property="og:url" content="${site.domain}${canonical}" />
<meta property="og:site_name" content="${site.name}" />
<link rel="icon" href="/assets/favicon.png" type="image/png" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
<link rel="stylesheet" href="/styles/tokens.css" />
</head>
<body>`;
}

export function header(activeCat) {
  const nav = categories
    .map((c) => `<a href="/category/${c.slug}.html"${c.slug === activeCat ? ' class="on"' : ''}>${c.name}</a>`)
    .join('');
  return `<header class="header">
  <div class="header-in">
    <a class="logo" href="/"><img class="logo-img" src="/assets/logo.png" alt="폼다" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-text',textContent:'폼다'}))"></a>
    <nav class="nav">${nav}</nav>
  </div>
</header>`;
}

export function footer() {
  const links = [{ href: '/', label: '홈' }, ...TRUST_PAGES]
    .map((p) => `<a href="${p.href}">${p.label}</a>`)
    .join('');
  return `<footer class="footer">
  <div class="footer-in">
    <div class="footer-links">${links}</div>
    <div class="footer-note">폼다는 입력 정보를 서버에 저장하지 않는 브라우저 기반 문서 작성 도구입니다. 작성한 문서의 내용 확인과 사용 책임은 사용자에게 있습니다.</div>
    <div class="footer-copy">© ${site.name} · ${site.tagline}</div>
  </div>
</footer>
</body>
</html>`;
}

export function trustBadge() {
  return `<div class="trust">🔒 입력 정보는 <b>서버에 저장되지 않고</b> 브라우저에서만 처리됩니다.</div>`;
}

export function steps() {
  return `<div class="steps">
    <span class="step"><span class="num">1</span>입력</span><span class="arrow">→</span>
    <span class="step"><span class="num">2</span>실시간 미리보기</span><span class="arrow">→</span>
    <span class="step"><span class="num">3</span>PDF·PNG 다운로드</span>
  </div>`;
}

export function escAttr(s) {
  return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
