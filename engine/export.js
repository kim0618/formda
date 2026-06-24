// 폼다 엔진 - 내보내기 (PDF / PNG / 인쇄)
// PDF·PNG는 #doc 엘리먼트를 html2canvas로 캡처 -> 한글 OK (폰트 렌더 그대로 이미지화)
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};

  function targetEl() {
    return document.getElementById('doc');
  }

  async function captureCanvas() {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    return window.html2canvas(targetEl(), { scale: 2, backgroundColor: '#ffffff' });
  }

  async function downloadPDF(fileName, btn) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'PDF 생성 중...'; btn.disabled = true; }
    try {
      var canvas = await captureCanvas();
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var pw = pdf.internal.pageSize.getWidth();
      var ph = pdf.internal.pageSize.getHeight();
      var imgW = pw;
      var imgH = (canvas.height * imgW) / canvas.width;
      var img = canvas.toDataURL('image/png');
      if (imgH <= ph) {
        pdf.addImage(img, 'PNG', 0, 0, imgW, imgH);
      } else {
        var pos = 0, rem = imgH;
        while (rem > 0) {
          pdf.addImage(img, 'PNG', 0, pos, imgW, imgH);
          rem -= ph;
          if (rem > 0) { pdf.addPage(); pos -= ph; }
        }
      }
      pdf.save(fileName + '.pdf');
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
      var canvas = await captureCanvas();
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = fileName + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('PNG 생성 중 오류가 발생했습니다: ' + e.message);
    } finally {
      if (btn) { btn.textContent = label; btn.disabled = false; }
    }
  }

  function printDoc() {
    window.print();
  }

  root.Formda.exporter = {
    downloadPDF: downloadPDF,
    downloadPNG: downloadPNG,
    printDoc: printDoc,
  };
})(typeof window !== 'undefined' ? window : this);
