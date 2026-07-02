// 공통 셸 (head / header+nav / footer) - 모든 페이지 공통
import { site, categories } from '../data/registry.js';
import { config, publicConfig } from '../data/config.js';

const TRUST_PAGES = [
  { href: '/pages/about.html', label: '소개' },
  { href: '/pages/terms.html', label: '이용약관' },
  { href: '/pages/privacy.html', label: '개인정보처리방침' },
  { href: '/pages/contact.html', label: '문의' },
];

export function head({ title, description, canonical, keywords, robots, ogType, publishedTime, modifiedTime }) {
  const type = ogType || 'website';
  const articleMeta = type === 'article'
    ? `${publishedTime ? `<meta property="article:published_time" content="${publishedTime}" />\n` : ''}${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}" />\n` : ''}`
    : '';
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script>document.documentElement.classList.add('js');if('scrollRestoration'in history)history.scrollRestoration='manual'</script>
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(description || site.description)}" />
${robots ? `<meta name="robots" content="${robots}" />\n` : ''}${keywords ? `<meta name="keywords" content="${escAttr(keywords)}" />\n` : ''}<link rel="canonical" href="${site.domain}${canonical}" />
<meta property="og:type" content="${type}" />
${articleMeta}<meta property="og:title" content="${escAttr(title)}" />
<meta property="og:description" content="${escAttr(description || site.description)}" />
<meta property="og:url" content="${site.domain}${canonical}" />
<meta property="og:site_name" content="${site.name}" />
<meta property="og:image" content="${site.domain}/assets/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escAttr(title)}" />
<meta name="twitter:description" content="${escAttr(description || site.description)}" />
<meta name="twitter:image" content="${site.domain}/assets/og.png" />
<link rel="icon" href="/assets/favicon.png" type="image/png" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css" />
<link rel="stylesheet" href="/styles/tokens.css" />
${analytics()}<script>window.FORMDA_CFG=${JSON.stringify(publicConfig())};</script>
</head>
<body>`;
}

export function header(activeCat) {
  const nav = categories
    .map((c) => `<a href="/category/${c.slug}.html"${c.slug === activeCat ? ' class="on"' : ''}>${c.name}</a>`)
    .join('') + `<a href="/guides/"${activeCat === 'guides' ? ' class="on"' : ''}>가이드</a>`;
  return `<header class="header">
  <div class="header-in">
    <a class="logo" href="/"><img class="logo-img" src="/assets/logo.png" alt="폼다" width="53" height="28" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-text',textContent:'폼다'}))"></a>
    <nav class="nav">${nav}</nav>
    <div class="hdr-search">
      <svg class="hdr-search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>
      <input id="site-search" type="search" placeholder="문서 검색" autocomplete="off" aria-label="문서 검색">
      <div id="search-results" class="search-results" role="listbox"></div>
    </div>
  </div>
</header>`;
}

export function footer() {
  const links = [{ href: '/', label: '홈' }, { href: '/guides/', label: '가이드' }, ...TRUST_PAGES]
    .map((p) => `<a href="${p.href}">${p.label}</a>`)
    .join('');
  return `<footer class="footer">
  <div class="footer-in">
    <div class="footer-links">${links}</div>
    <div class="footer-note">폼다는 입력 정보를 서버에 저장하지 않는 브라우저 기반 문서 작성 도구입니다. 작성한 문서의 내용 확인과 사용 책임은 사용자에게 있습니다.</div>
    <div class="footer-copy">© ${site.name} · ${site.tagline}</div>
  </div>
</footer>
<script src="/engine/track.js" defer></script>
<script src="/engine/search.js" defer></script>
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

// GA4 gtag 스니펫 - config.GA_ID가 채워졌을 때만 로드(미설정 시 측정 비활성).
export function analytics() {
  if (!config.GA_ID) return '';
  const id = config.GA_ID;
  return `<link rel="preconnect" href="https://www.googletagmanager.com" />
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>
`;
}

export function escAttr(s) {
  return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 사이트 공통 Organization 노드 (@id로 다른 스키마의 author/publisher가 참조).
// 각 페이지에 자기완결적으로 인라인해 크롤러가 페이지 단독으로 발행처를 해석할 수 있게 함.
export function orgNode() {
  return {
    '@type': 'Organization',
    '@id': site.domain + '/#org',
    name: site.name,
    url: site.domain + '/',
    logo: { '@type': 'ImageObject', url: site.domain + '/assets/logo.png', width: 380, height: 200 },
  };
}
