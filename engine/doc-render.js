// 폼다 엔진 - 문서 미리보기 렌더 (docType별)
// 새 문서 타입 = 이 객체에 함수 하나 추가. business-invoice가 견적서/거래명세서/영수증/발주서/청구서 공통.
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};
  var calc = root.Formda.calc;

  function sealHTML(state, cfg) {
    if (!cfg.showSeal) return '';
    if (state.sealImg) return '<img class="seal-img" src="' + state.sealImg + '" alt="도장">';
    return '<span class="seal">(인)</span>';
  }

  // 거래 문서 공통 렌더 (견적서/거래명세서/영수증/발주서/청구서)
  function businessInvoice(state, cfg) {
    var esc = calc.esc, won = calc.won, comma = calc.comma, korAmount = calc.korAmount;
    var t = calc.totals(state.items, state.vat);

    var rows = state.items.map(function (it, i) {
      return '<tr>' +
        '<td class="c">' + (i + 1) + '</td>' +
        '<td class="l">' + (esc(it.name) || '-') + '</td>' +
        '<td class="c">' + (it.qty || 0) + '</td>' +
        '<td>' + won(it.price || 0) + '</td>' +
        '<td>' + won((it.qty || 0) * (it.price || 0)) + '</td>' +
        '</tr>';
    }).join('');

    var subHTML =
      '<span>' + (state.no ? cfg.numberLabel + ': ' + esc(state.no) : '') + '</span>' +
      '<span>' + (state.date ? cfg.dateLabel + ': ' + esc(state.date) : '') + '</span>';

    var vatRow = cfg.showVat
      ? '<div class="tot"><span>부가세</span><span class="v">' + won(t.vat) + '</span></div>'
      : '';

    return '' +
      '<div class="doc-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="doc-sub">' + subHTML + '</div>' +
      '<div class="doc-head">' +
        '<div class="recv"><small>' + esc(cfg.leadPhrase) + '</small>' +
          '<span>' + (esc(state.to) || '-') + '</span> ' + esc(cfg.recipientSuffix) + '</div>' +
        '<div class="supplier">' +
          '<div class="sr"><div class="sk">등록번호</div><div class="sv">' + (esc(state.fromReg) || '-') + '</div></div>' +
          '<div class="sr"><div class="sk">상호</div><div class="sv"><span>' + (esc(state.from) || '-') + '</span>' + sealHTML(state, cfg) + '</div></div>' +
          '<div class="sr"><div class="sk">주소</div><div class="sv">' + (esc(state.fromAddr) || '-') + '</div></div>' +
          '<div class="sr"><div class="sk">연락처</div><div class="sv">' + (esc(state.fromTel) || '-') + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="amount-box"><span class="kr">일금 ' + korAmount(t.total) + '원정</span>' +
        '<span class="num">(₩' + comma(t.total) + ')</span></div>' +
      '<table class="doc-table">' +
        '<colgroup><col class="c-no"><col class="c-item"><col class="c-qty"><col class="c-price"><col class="c-amt"></colgroup>' +
        '<thead><tr><th>No</th><th>품목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '<div class="tot"><span>공급가액</span><span class="v">' + won(t.supply) + '</span></div>' +
      vatRow +
      '<div class="tot sum"><span>합계</span><span class="v">' + won(t.total) + '</span></div>' +
      '<div class="doc-note">' + esc(state.note) + '</div>';
  }

  root.Formda.docRender = {
    'business-invoice': businessInvoice,
  };
})(typeof window !== 'undefined' ? window : this);
