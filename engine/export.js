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

  // 캡처 동안 미리보기 축소(transform)를 잠시 해제 -> 원본 794px 해상도로 캡처
  async function withFullScale(fn) {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    var pages = document.querySelector('#doc .doc-pages');
    var prev = pages ? pages.style.transform : '';
    if (pages) pages.style.transform = 'none';
    try { return await fn(); }
    finally { if (pages) pages.style.transform = prev; }
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

  async function downloadPDF(fileName, btn) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'PDF 생성 중...'; btn.disabled = true; }
    try {
      await withFullScale(async function () {
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF('p', 'mm', 'a4');
        var pw = pdf.internal.pageSize.getWidth();
        var ph = pdf.internal.pageSize.getHeight();
        var els = pageEls();
        for (var i = 0; i < els.length; i++) {
          var canvas = await shoot(els[i]);
          var imgH = (canvas.height * pw) / canvas.width;
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pw, Math.min(imgH, ph), undefined, 'FAST');
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

  function printDoc() { window.print(); }

  root.Formda.exporter = {
    downloadPDF: downloadPDF,
    downloadPNG: downloadPNG,
    printDoc: printDoc,
  };
})(typeof window !== 'undefined' ? window : this);
