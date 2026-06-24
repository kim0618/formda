// 폼다 엔진 - 컨트롤러 (상태·이벤트·부팅)
// 페이지의 window.FORMDA_TOOL = { docType, doc, sample } 을 읽어 입력폼 + 미리보기를 구동.
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};
  var F = root.Formda;

  var app = {
    cfg: null,       // doc 설정 (라벨/문서명)
    docType: null,
    state: null,     // 입력 상태

    init: function (tool) {
      this.docType = tool.docType;
      this.cfg = tool.doc;
      // sample 깊은 복사 + date='today' 해석
      var s = JSON.parse(JSON.stringify(tool.sample || {}));
      if (s.date === 'today') s.date = new Date().toISOString().slice(0, 10);
      if (!s.items || !s.items.length) s.items = [{ name: '', qty: 1, price: 0 }];
      s.sealImg = null;
      this.state = s;

      // 입력폼 주입
      var formHost = document.getElementById('formPanel');
      formHost.innerHTML = F.formEngine[this.docType](this.cfg);

      // sample 값을 DOM에 반영 (템플릿 이스케이프 회피 위해 직접 대입)
      this.setVal('date', s.date);
      this.setVal('no', s.no);
      this.setVal('from', s.from);
      this.setVal('fromReg', s.fromReg);
      this.setVal('fromTel', s.fromTel);
      this.setVal('fromAddr', s.fromAddr);
      this.setVal('to', s.to);
      this.setVal('note', s.note);
      this.setVal('vat', s.vat);

      this.drawRows();
      this.renderDoc();
      this.bindResize();
    },

    setVal: function (id, v) {
      var el = document.getElementById('f-' + id);
      if (el != null && v != null) el.value = v;
    },

    onField: function (id, v) {
      this.state[id] = v;
      this.renderDoc();
    },

    drawRows: function () {
      var host = document.getElementById('rows');
      if (host) host.innerHTML = F.formEngine.itemRows(this.state.items);
    },

    addRow: function () {
      this.state.items.push({ name: '', qty: 1, price: 0 });
      this.drawRows();
      this.renderDoc();
    },

    delRow: function (i) {
      this.state.items.splice(i, 1);
      if (!this.state.items.length) this.state.items.push({ name: '', qty: 1, price: 0 });
      this.drawRows();
      this.renderDoc();
    },

    onName: function (i, v) {
      this.state.items[i].name = v;
      this.renderDoc();
    },

    onQty: function (i, el) {
      var c = F.calc.cleanInt(el.value, 5);
      var n = Math.min(c.value, F.calc.MAX_QTY);
      this.state.items[i].qty = n;
      el.value = c.digits ? String(n) : '';
      this.renderDoc();
    },

    onPrice: function (i, el) {
      var c = F.calc.cleanInt(el.value, F.calc.MAX_PRICE_DIGITS);
      this.state.items[i].price = c.value;
      el.value = c.digits ? c.value.toLocaleString('ko-KR') : '';
      this.renderDoc();
    },

    onSeal: function (input) {
      var file = input.files && input.files[0];
      if (!file) return;
      var self = this;
      var reader = new FileReader();
      reader.onload = function (e) {
        self.state.sealImg = e.target.result;
        var nm = document.getElementById('sealName');
        if (nm) nm.textContent = '도장 적용됨: ' + file.name;
        self.renderDoc();
      };
      reader.readAsDataURL(file);
    },

    clearSeal: function () {
      this.state.sealImg = null;
      var nm = document.getElementById('sealName');
      if (nm) nm.textContent = '';
      var input = document.getElementById('f-seal');
      if (input) input.value = '';
      this.renderDoc();
    },

    renderDoc: function () {
      var html = F.docRender[this.docType](this.state, this.cfg);
      document.getElementById('doc').innerHTML = html;
    },

    // ----- 내보내기 -----
    downloadPDF: function (btn) { F.exporter.downloadPDF(this.cfg.fileName + (this.state.no ? '_' + this.state.no : ''), btn); },
    downloadPNG: function (btn) { F.exporter.downloadPNG(this.cfg.fileName + (this.state.no ? '_' + this.state.no : ''), btn); },
    print: function () { F.exporter.printDoc(); },

    // ----- 모바일 탭 -----
    showPane: function (p) {
      document.querySelector('.pane-input').classList.toggle('hide', p !== 'input');
      document.querySelector('.pane-preview').classList.toggle('hide', p !== 'preview');
      document.getElementById('tabInput').classList.toggle('on', p === 'input');
      document.getElementById('tabPreview').classList.toggle('on', p === 'preview');
    },

    bindResize: function () {
      function sync() {
        if (window.innerWidth > 980) {
          document.querySelector('.pane-input').classList.remove('hide');
          document.querySelector('.pane-preview').classList.remove('hide');
        }
      }
      window.addEventListener('resize', sync);
      sync();
    },
  };

  F.app = app;

  function boot() {
    if (root.FORMDA_TOOL) app.init(root.FORMDA_TOOL);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
