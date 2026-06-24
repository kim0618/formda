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
      this.userZoom = 1.3;   // 사용자 확대/축소 배율 (기본 130%, 맞춤=1)
      this.MAX_ITEMS = 14;   // 무료: 한 페이지(=doc-render PAGE_ROWS) 분량
      this.sampleState = this.resolveSample(tool.sample); // 원본 샘플 보관 (샘플 불러오기용)

      // 입력폼 주입 (한 번만)
      var formHost = document.getElementById('formPanel');
      formHost.innerHTML = F.formEngine[this.docType](this.cfg);

      this.applyState(JSON.parse(JSON.stringify(this.sampleState)));
      this.bindResize();

      // CSS/폰트 로딩 후 다시 맞춤 (초기 크기 어긋남 방지)
      var self = this;
      if (window.requestAnimationFrame) requestAnimationFrame(function () { self.fitPreview(); });
      window.addEventListener('load', function () { self.fitPreview(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { self.fitPreview(); });
      }
    },

    resolveSample: function (sample) {
      var s = JSON.parse(JSON.stringify(sample || {}));
      if (s.date === 'today') s.date = new Date().toISOString().slice(0, 10);
      if (!s.items || !s.items.length) s.items = [{ name: '', spec: '', qty: 1, price: 0 }];
      s.sealImg = null;
      return s;
    },

    today: function () {
      return new Date().toISOString().slice(0, 10);
    },

    // 상태를 폼 + 미리보기에 일괄 반영
    applyState: function (s) {
      this.state = s;
      this.setVal('date', s.date);
      this.setVal('no', s.no);
      this.setVal('from', s.from);
      this.setVal('fromReg', s.fromReg);
      this.setVal('fromCeo', s.fromCeo);
      this.setVal('fromBiz', s.fromBiz);
      this.setVal('fromTel', s.fromTel);
      this.setVal('fromAddr', s.fromAddr);
      this.setVal('to', s.to);
      this.setVal('toReg', s.toReg);
      this.setVal('toCeo', s.toCeo);
      this.setVal('toTel', s.toTel);
      this.setVal('toAddr', s.toAddr);
      this.setVal('validity', s.validity);
      this.setVal('note', s.note);
      this.setVal('vat', s.vat);
      var nm = document.getElementById('sealName');
      if (nm) nm.textContent = s.sealImg ? '도장 적용됨' : '';
      var fi = document.getElementById('f-seal');
      if (fi) fi.value = '';
      this.drawRows();
      this.renderDoc();
    },

    loadSample: function () {
      this.applyState(JSON.parse(JSON.stringify(this.sampleState)));
    },

    clearAll: function () {
      this.applyState({
        date: this.today(), no: '', from: '', fromReg: '', fromCeo: '', fromBiz: '', fromTel: '', fromAddr: '',
        to: '', toReg: '', toCeo: '', toTel: '', toAddr: '', validity: '',
        items: [{ name: '', spec: '', qty: 1, price: 0 }], vat: '0.1', note: '', sealImg: null,
      });
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
      this.updateAddBtn();
    },

    updateAddBtn: function () {
      var btn = document.getElementById('addRowBtn');
      if (btn) btn.disabled = this.state.items.length >= this.MAX_ITEMS;
      var note = document.getElementById('rowLimit');
      if (note) note.style.display = this.state.items.length >= this.MAX_ITEMS ? 'block' : 'none';
    },

    addRow: function () {
      if (this.state.items.length >= this.MAX_ITEMS) return;
      this.state.items.push({ name: '', spec: '', qty: 1, price: 0 });
      this.drawRows();
      this.renderDoc();
    },

    delRow: function (i) {
      this.state.items.splice(i, 1);
      if (!this.state.items.length) this.state.items.push({ name: '', spec: '', qty: 1, price: 0 });
      this.drawRows();
      this.renderDoc();
    },

    onName: function (i, v) {
      this.state.items[i].name = v;
      this.renderDoc();
    },

    onSpec: function (i, v) {
      this.state.items[i].spec = v;
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
      document.getElementById('doc').innerHTML = '<div class="doc-sizer">' + html + '</div>';
      this.fitPreview();
    },

    // A4 페이지(794x1123)를 미리보기 박스에 맞춰 스케일 (× 사용자 줌)
    // 데스크톱: 높이에 맞춰 한 장이 통째로 보이게. 모바일: 폭에 맞춰.
    fitPreview: function () {
      var host = document.getElementById('doc');
      if (!host) return;
      var sizer = host.querySelector('.doc-sizer');
      var pages = host.querySelector('.doc-pages');
      if (!sizer || !pages) return;
      var mobile = window.innerWidth <= 980;
      var availW = host.clientWidth - (mobile ? 0 : 36);
      if (availW <= 0) return;
      var base = mobile ? (availW / 794) : Math.min(availW / 794, (host.clientHeight - 36) / 1123);
      if (!(base > 0)) base = availW / 794;
      var scale = base * (this.userZoom || 1);
      pages.style.transformOrigin = 'top left';
      pages.style.transform = 'scale(' + scale + ')';
      sizer.style.width = (794 * scale) + 'px';
      sizer.style.height = (pages.offsetHeight * scale) + 'px';
      var lbl = document.getElementById('zoomLabel');
      if (lbl) lbl.textContent = Math.round((this.userZoom || 1) * 100) + '%';
    },

    zoomIn: function () { this.userZoom = Math.min((this.userZoom || 1) + 0.1, 2.5); this.fitPreview(); },
    zoomOut: function () { this.userZoom = Math.max((this.userZoom || 1) - 0.1, 0.5); this.fitPreview(); },
    zoomReset: function () { this.userZoom = 1; this.fitPreview(); },

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
      if (p === 'preview') this.fitPreview();
    },

    bindResize: function () {
      var self = this;
      function sync() {
        if (window.innerWidth > 980) {
          document.querySelector('.pane-input').classList.remove('hide');
          document.querySelector('.pane-preview').classList.remove('hide');
        }
        self.fitPreview();
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
