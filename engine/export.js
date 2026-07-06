// 폼다 엔진 - 내보내기 (PDF / PNG / 인쇄)
// A4 .doc-page 단위로 캡처 -> 페이지별 깨끗한 PDF (행 중간 잘림 없음). 한글 OK.
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};

  function pageEls() {
    var host = document.getElementById('doc');
    var list = host.querySelectorAll('.doc-page');
    return list.length ? list : [host];
  }

  // PDF/PNG 라이브러리는 무겁다(~200KB+). 페이지 로드 시가 아니라
  // 첫 내보내기 클릭 때 한 번만 지연 로드한다.
  var LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  ];
  var libsPromise = null;
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('스크립트 로드 실패: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function ensureLibs() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    if (!libsPromise) {
      libsPromise = Promise.all(LIBS.map(loadScript)).catch(function (e) {
        libsPromise = null; // 실패 시 다음 클릭에서 재시도 가능
        throw e;
      });
    }
    return libsPromise;
  }

  // 캡처 동안 미리보기 축소(transform)를 잠시 해제 -> 원본 794px 해상도로 캡처
  async function withFullScale(fn) {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    var pages = document.querySelector('#doc .doc-pages');
    var prev = pages ? pages.style.transform : '';
    if (pages) pages.style.transform = 'none';
    var doc = document.getElementById('doc');
    if (doc) doc.classList.add('exporting'); // 도장 미등록 시 '(인)' 플레이스홀더를 캡처에서 제외
    try { return await fn(); }
    finally { if (pages) pages.style.transform = prev; if (doc) doc.classList.remove('exporting'); }
  }

  // 캡처 배율 = 선명도. A4 794px 기준 3배 ≈ 약 216DPI (화면 DPR이 더 높으면 그만큼).
  var CAPTURE_SCALE = Math.min(4, Math.max(3, window.devicePixelRatio || 1));

  function shoot(el) {
    return window.html2canvas(el, {
      scale: CAPTURE_SCALE,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      useCORS: true,
      imageTimeout: 0,
      logging: false,
    });
  }

  async function downloadPDF(fileName, btn, pageSize) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'PDF 생성 중...'; btn.disabled = true; }
    try {
      await ensureLibs();
      await withFullScale(async function () {
        var jsPDF = window.jspdf.jsPDF;
        // pageSize [w,h](mm) 지정 시 그 크기로(명함 등), 없으면 A4
        var pdf = pageSize
          ? new jsPDF({ orientation: pageSize[0] >= pageSize[1] ? 'l' : 'p', unit: 'mm', format: pageSize })
          : new jsPDF('p', 'mm', 'a4');
        var pw = pdf.internal.pageSize.getWidth();
        var ph = pdf.internal.pageSize.getHeight();
        var els = pageEls();
        for (var i = 0; i < els.length; i++) {
          var canvas = await shoot(els[i]);
          // 비율 유지: 폭은 페이지에 맞추되, 세로가 A4를 넘으면 세로 기준으로 축소해
          // 가로 중앙 배치(세로 눌림 왜곡 방지).
          var imgW = pw, imgH = (canvas.height * pw) / canvas.width;
          if (imgH > ph) { imgW = pw * (ph / imgH); imgH = ph; }
          var x = (pw - imgW) / 2;
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 0, imgW, imgH, undefined, 'FAST');
        }
        pdf.save(fileName + '.pdf');
      });
    } catch (e) {
      alert('PDF 생성 중 오류가 발생했습니다: ' + e.message);
    } finally {
      if (btn) { btn.textContent = label; btn.disabled = false; }
    }
  }

  async function downloadPNG(fileName, btn) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'PNG 생성 중...'; btn.disabled = true; }
    try {
      await ensureLibs();
      await withFullScale(async function () {
        var els = pageEls();
        if (els.length === 1) {
          var c = await shoot(els[0]);
          saveCanvas(c, fileName + '.png');
          return;
        }
        // 여러 페이지 -> 세로로 이어붙여 한 장
        var canvases = [];
        var w = 0, h = 0;
        for (var i = 0; i < els.length; i++) {
          var cv = await shoot(els[i]);
          canvases.push(cv); w = Math.max(w, cv.width); h += cv.height + 20;
        }
        var out = document.createElement('canvas');
        out.width = w; out.height = h;
        var ctx = out.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        var y = 0;
        for (var j = 0; j < canvases.length; j++) { ctx.drawImage(canvases[j], 0, y); y += canvases[j].height + 20; }
        saveCanvas(out, fileName + '.png');
      });
    } catch (e) {
      alert('PNG 생성 중 오류가 발생했습니다: ' + e.message);
    } finally {
      if (btn) { btn.textContent = label; btn.disabled = false; }
    }
  }

  function saveCanvas(canvas, name) {
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  root.Formda.exporter = {
    downloadPDF: downloadPDF,
    downloadPNG: downloadPNG,
  };
})(typeof window !== 'undefined' ? window : this);
