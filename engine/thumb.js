// 카드 썸네일 스케일러 - A4 페이지(794px)를 카드 프레임 폭에 맞춰 꽉 채움.
// 본문 텍스트는 정적 HTML(SEO 영향 없음), JS는 시각 스케일만 조정.
(function () {
  'use strict';
  var DESIGN_W = 794; // A4 @96dpi 폭
  var CARD_W = 620, CARD_H = 344; // 명함 등 가로형 카드 크기
  function fit() {
    var docs = document.querySelectorAll('.thumb-doc');
    for (var i = 0; i < docs.length; i++) {
      var el = docs[i];
      var frame = el.parentElement;
      var w = frame.clientWidth;
      if (!w) continue;
      if (el.querySelector('.doc-page.card')) {
        // 가로형 카드: 폭을 채우고 프레임 안에서 세로 중앙 정렬
        var s = w / CARD_W;
        el.style.transform = 'scale(' + s + ')';
        var top = (frame.clientHeight - CARD_H * s) / 2;
        el.style.top = (top > 0 ? top : 0) + 'px';
      } else {
        el.style.transform = 'scale(' + (w / DESIGN_W) + ')';
        el.style.top = '0px';
      }
    }
  }
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
