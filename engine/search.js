// 폼다 헤더 검색 - search-index.js(window.Formda.searchIndex)를 부분일치로 필터해 드롭다운 표시.
// 의존성 없음. 모든 페이지의 공통 헤더(#site-search)에 바인딩.
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  ready(function () {
    var input = document.getElementById('site-search');
    var box = document.getElementById('search-results');
    if (!input || !box) return;
    var index = (window.Formda && window.Formda.searchIndex) || [];
    var items = [], active = -1;

    function search(raw) {
      var q = raw.trim().toLowerCase();
      if (!q) return [];
      var toks = q.split(/\s+/);
      var res = [];
      for (var i = 0; i < index.length; i++) {
        var it = index[i];
        var hit = true;
        for (var j = 0; j < toks.length; j++) { if (it.k.indexOf(toks[j]) < 0) { hit = false; break; } }
        if (!hit) continue;
        var title = it.t.toLowerCase();
        var score = title === q ? 0 : title.indexOf(q) === 0 ? 1 : title.indexOf(q) >= 0 ? 2 : 3;
        res.push({ it: it, score: score });
      }
      // 점수 우선, 같으면 도구(g=0)를 가이드(g=1)보다 먼저
      res.sort(function (a, b) { return (a.score - b.score) || ((a.it.g || 0) - (b.it.g || 0)); });
      return res.slice(0, 8).map(function (r) { return r.it; });
    }

    function render(hasQuery) {
      if (items.length) {
        box.innerHTML = items.map(function (it, i) {
          var badge = it.g ? '<span class="sr-bd sr-bd-g">가이드</span>' : '<span class="sr-bd sr-bd-t">도구</span>';
          var meta = it.g ? esc(it.d) : (esc(it.c) + ' · ' + esc(it.d));
          return '<a class="sr-item' + (i === active ? ' on' : '') + '" href="' + (it.u || ('/tools/' + it.slug + '.html')) + '">' +
            '<span class="sr-ic" style="color:' + esc(it.ac) + '">' + it.svg + '</span>' +
            '<span class="sr-tx"><b>' + esc(it.t) + '</b><small>' + meta + '</small></span>' +
            badge + '</a>';
        }).join('');
        box.classList.add('open');
      } else if (hasQuery) {
        box.innerHTML = '<div class="sr-empty">검색 결과가 없습니다</div>';
        box.classList.add('open');
      } else {
        box.innerHTML = '';
        box.classList.remove('open');
      }
    }

    function update() {
      var q = input.value;
      items = search(q);
      active = -1;
      render(q.trim().length > 0);
    }

    function go(it) { if (it) location.href = it.u || ('/tools/' + it.slug + '.html'); }

    input.addEventListener('input', update);
    input.addEventListener('focus', update);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { active = (active + 1) % items.length; render(true); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { active = (active - 1 + items.length) % items.length; render(true); } }
      else if (e.key === 'Enter') { if (items.length) { e.preventDefault(); go(items[active] || items[0]); } }
      else if (e.key === 'Escape') { input.value = ''; items = []; active = -1; render(false); input.blur(); }
    });
    document.addEventListener('click', function (e) {
      if (e.target !== input && !box.contains(e.target)) box.classList.remove('open');
    });
  });
})();
