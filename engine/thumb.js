// 카드 썸네일 스케일러 - A4 페이지(794px)를 카드 프레임 폭에 맞춰 꽉 채움.
// 본문 텍스트는 정적 HTML(SEO 영향 없음), JS는 시각 스케일만 조정.
(function () {
  'use strict';
  var DESIGN_W = 794; // A4 @96dpi 폭
  function fit() {
    var docs = document.querySelectorAll('.thumb-doc');
    for (var i = 0; i < docs.length; i++) {
      var el = docs[i];
      var w = el.parentElement.clientWidth;
      if (w) el.style.transform = 'scale(' + (w / DESIGN_W) + ')';
    }
  }
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
