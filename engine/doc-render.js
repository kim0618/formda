// 폼다 엔진 - 문서 미리보기 렌더 (docType별, A4 페이지 단위 + 표준 양식 + 자동 페이지네이션)
// 기본: 여러 .doc-page (품목 많으면 2페이지+). opts.single=true: 썸네일용 1페이지.
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};
  var calc = root.Formda.calc;

  var PAGE_ROWS = 14;  // 무료: 한 페이지(=14행)로 고정. 멀티페이지는 추후 프리미엄
  var THUMB_MIN = 9;   // 썸네일 최소 채움 행

  function esc(s) { return calc.esc(s); }
  function comma(n) { return calc.comma(n); }

  function sealHTML(state, cfg) {
    if (!cfg.showSeal) return '';
    if (state.sealImg) return '<img class="qt-seal-img" src="' + state.sealImg + '" alt="도장">';
    return '<span class="qt-seal">(인)</span>';
  }

  // 품목 1행. 거래명세서(cfg.taxColumns): 월일 + 공급가액·세액 분리(표준)
  function row(items, gi, cfg, vat, mmdd) {
    var tax = !!cfg.taxColumns;
    var cols = tax ? 7 : 6;
    var it = items[gi];
    if (!it) {
      var e = ''; for (var j = 0; j < cols; j++) e += '<td></td>';
      return '<tr class="qt-er">' + e + '</tr>';
    }
    var qty = it.qty || 0, price = it.price || 0, line = qty * price;
    // 첫 열: 거래명세서=월일, 그 외=No
    var common =
      '<td class="c">' + ((tax || cfg.dateColumn) ? mmdd : (gi + 1)) + '</td>' +
      '<td class="l">' + (esc(it.name) || '') + '</td>' +
      '<td class="c">' + (esc(it.spec) || '') + '</td>' +
      '<td class="c">' + (qty || '') + '</td>' +
      '<td class="r">' + (price ? comma(price) : '') + '</td>';
    if (tax) {
      var supply, svat;
      if (vat === '0.1') { supply = line; svat = Math.round(line * 0.1); }
      else if (vat === 'incl') { supply = Math.round(line / 1.1); svat = line - supply; }
      else { supply = line; svat = 0; }
      return '<tr>' + common +
        '<td class="r">' + (line ? comma(supply) : '') + '</td>' +
        '<td class="r">' + (line ? comma(svat) : '') + '</td></tr>';
    }
    return '<tr>' + common + '<td class="r">' + (line ? comma(line) : '') + '</td></tr>';
  }

  function rowsFor(items, start, count, cfg, vat, mmdd) {
    var h = '';
    for (var k = 0; k < count; k++) h += row(items, start + k, cfg, vat, mmdd);
    return h;
  }

  // 정보 박스 (공급자 / 공급받는자 공통). rows: 5행(등록번호·상호·대표자·주소·전화)
  function partyBox(label, f, seal) {
    return '<table class="qt-supplier"><tbody>' +
      '<tr><th class="qt-side" rowspan="5">' + label + '</th><td class="k">등록번호</td><td class="v">' + (esc(f.reg) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">상　호</td><td class="v">' + (esc(f.name) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">대표자</td><td class="v"><span>' + (esc(f.ceo) || '&nbsp;') + '</span>' + (seal || '') + '</td></tr>' +
      '<tr><td class="k">주　소</td><td class="v">' + (esc(f.addr) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">전　화</td><td class="v">' + (esc(f.tel) || '&nbsp;') + '</td></tr>' +
      '</tbody></table>';
  }

  function amountBox(t) {
    return '<div class="qt-amount">' +
      '<div class="k">합계금액</div>' +
      '<div class="v"><b>' + (t.total > 0 ? '一金 ' + calc.korAmount(t.total) + '원整' : '') + '</b>' +
      '<span>' + (t.total > 0 ? '(₩' + comma(t.total) + ')' : '') + '</span></div>' +
    '</div>';
  }

  function titleMeta(state, cfg) {
    return '<div class="qt-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="qt-meta"><span>' + (state.date ? cfg.dateLabel + ' : ' + esc(state.date) : '') + '</span>' +
      '<span>' + (state.no ? cfg.numberLabel + ' : ' + esc(state.no) : '') + '</span></div>';
  }

  function firstHeader(state, cfg, t) {
    // 거래명세서: 공급받는자 + 공급자 두 박스 나란히 (세금계산서식 표준 구조)
    if (cfg.twoParty) {
      return titleMeta(state, cfg) +
        '<div class="qt-lead">' + esc(cfg.leadPhrase) + '</div>' +
        '<div class="qt-parties">' +
          partyBox(cfg.partyToLabel || '공급받는자', { reg: state.toReg, name: state.to, ceo: state.toCeo, addr: state.toAddr, tel: state.toTel }, '') +
          partyBox(cfg.partyFromLabel || '공급자', { reg: state.fromReg, name: state.from, ceo: state.fromCeo, addr: state.fromAddr, tel: state.fromTel }, sealHTML(state, cfg)) +
        '</div>' +
        amountBox(t);
    }
    // 견적서 등: 수신("○○ 귀하") + 공급자 박스 1개(업태/종목 포함 6행)
    return titleMeta(state, cfg) +
      '<div class="qt-head">' +
        '<div class="qt-recv"><div class="qt-recv-name">' + (esc(state.to) || '&nbsp;') + ' <b>' + esc(cfg.recipientSuffix) + '</b></div>' +
          '<div class="qt-recv-sub">' + esc(cfg.leadPhrase) + '</div></div>' +
        '<table class="qt-supplier"><tbody>' +
          '<tr><th class="qt-side" rowspan="6">공급자</th><td class="k">등록번호</td><td class="v">' + (esc(state.fromReg) || '&nbsp;') + '</td></tr>' +
          '<tr><td class="k">상　호</td><td class="v">' + (esc(state.from) || '&nbsp;') + '</td></tr>' +
          '<tr><td class="k">대표자</td><td class="v"><span>' + (esc(state.fromCeo) || '&nbsp;') + '</span>' + sealHTML(state, cfg) + '</td></tr>' +
          '<tr><td class="k">주　소</td><td class="v">' + (esc(state.fromAddr) || '&nbsp;') + '</td></tr>' +
          '<tr><td class="k">업태/종목</td><td class="v">' + (esc(state.fromBiz) || '&nbsp;') + '</td></tr>' +
          '<tr><td class="k">전　화</td><td class="v">' + (esc(state.fromTel) || '&nbsp;') + '</td></tr>' +
        '</tbody></table>' +
      '</div>' +
      amountBox(t) +
      (cfg.receiptConfirm ? '<div class="qt-confirm">위 금액을 정히 영수합니다.</div>' : '');
  }

  function itemsTable(cfg, rowsHtml) {
    if (cfg.taxColumns) {
      return '<table class="qt-items tax">' +
        '<colgroup><col class="c-date"><col class="c-item"><col class="c-spec"><col class="c-qty"><col class="c-price"><col class="c-supply"><col class="c-tax"></colgroup>' +
        '<thead><tr><th>월일</th><th>품　목</th><th>규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>';
    }
    // 영수증: 첫 열을 월일로 (taxColumns 없이 단일 금액)
    var firstCol = cfg.dateColumn ? 'c-date' : 'c-no';
    var firstTh = cfg.dateColumn ? '월일' : 'No';
    return '<table class="qt-items">' +
      '<colgroup><col class="' + firstCol + '"><col class="c-item"><col class="c-spec"><col class="c-qty"><col class="c-price"><col class="c-amt"></colgroup>' +
      '<thead><tr><th>' + firstTh + '</th><th>품　목</th><th>규격</th><th>수량</th><th>단가</th><th>금액</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table>';
  }

  function totalsBlock(state, cfg, t) {
    // 영수증: 부가세 분리 없이 합계만 (간이영수증 표준)
    if (cfg.singleTotal) {
      return '<table class="qt-tot"><tbody>' +
          '<tr class="sum"><td class="k">합　계</td><td class="v">' + comma(t.total) + ' 원</td></tr>' +
        '</tbody></table>' +
        (state.note ? '<div class="qt-note">' + esc(state.note) + '</div>' : '');
    }
    var tax = !!cfg.taxColumns;
    var vatLabel = tax ? '세　액' : '부 가 세';
    var sumLabel = tax ? '합계금액' : '합　계';
    var supplyLabel = tax ? '공급가액 합계' : '공급가액';
    var vatRow = cfg.showVat
      ? '<tr><td class="k">' + vatLabel + '</td><td class="v">' + comma(t.vat) + ' 원</td></tr>' : '';
    // 거래명세서 표준: 인수자 확인란
    var receiver = tax
      ? '<div class="qt-receiver">인수자 <span class="qt-sign"></span> (인)</div>' : '';
    var validity = (cfg.validity && state.validity)
      ? '<div class="qt-validity">견적 유효기간 : ' + esc(state.validity) + '</div>' : '';
    // 발주서 표준: 납품 조건란 (납기일자 / 납품장소 / 결제조건)
    var terms = '';
    if (cfg.deliveryTerms) {
      terms = '<table class="qt-terms"><tbody>' +
        '<tr><td class="k">납기일자</td><td class="v">' + (esc(state.deliveryDate) || '&nbsp;') + '</td>' +
            '<td class="k">납품장소</td><td class="v">' + (esc(state.deliveryPlace) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">결제조건</td><td class="v" colspan="3">' + (esc(state.paymentTerms) || '&nbsp;') + '</td></tr>' +
        '</tbody></table>';
    }
    // 거래명세서 표준: 미수금 정산란 (전잔액 + 당월 거래액 - 입금액 = 미수 잔액)
    var balance = '';
    if (cfg.balance) {
      var prev = state.prevBalance || 0, paid = state.paidAmount || 0;
      var outstanding = prev + t.total - paid;
      balance = '<table class="qt-balance"><tbody><tr>' +
        '<td class="k">전잔액</td><td class="v">' + comma(prev) + '</td>' +
        '<td class="k">당월 거래액</td><td class="v">' + comma(t.total) + '</td>' +
        '<td class="k">입금액</td><td class="v">' + comma(paid) + '</td>' +
        '<td class="k hl">미수 잔액</td><td class="v hl">' + comma(outstanding) + '</td>' +
        '</tr></tbody></table>';
    }
    return '<table class="qt-tot"><tbody>' +
        '<tr><td class="k">' + supplyLabel + '</td><td class="v">' + comma(t.supply) + ' 원</td></tr>' +
        vatRow +
        '<tr class="sum"><td class="k">' + sumLabel + '</td><td class="v">' + comma(t.total) + ' 원</td></tr>' +
      '</tbody></table>' +
      balance +
      terms +
      validity +
      (state.note ? '<div class="qt-note">' + esc(state.note) + '</div>' : '') +
      receiver;
  }

  // .doc-fit = 자동 맞춤 대상(내용이 A4 높이 넘으면 app.fitDoc이 축소)
  function pageEl(inner) { return '<div class="doc-page"><div class="doc-fit">' + inner + '</div></div>'; }

  function wrap(inner, opts) {
    return opts.single ? pageEl(inner) : '<div class="doc-pages">' + pageEl(inner) + '</div>';
  }

  // 기본 레이아웃 (견적서 / 거래명세서)
  function renderDefault(state, cfg, opts) {
    var t = calc.totals(state.items, state.vat);
    var minRows = opts.single ? THUMB_MIN : (cfg.maxItems || PAGE_ROWS);
    var n = Math.max(state.items.length, minRows);
    var mmdd = '';
    if (state.date) { var dp = String(state.date).split('-'); if (dp.length === 3) mmdd = dp[1] + '/' + dp[2]; }
    return wrap(firstHeader(state, cfg, t) + itemsTable(cfg, rowsFor(state.items, 0, n, cfg, state.vat, mmdd)) + totalsBlock(state, cfg, t), opts);
  }

  // 영수증 레이아웃: 금액이 주인공인 슬립형 (제목 → 받는분 → 큰 금액 → 영수확인 → 내역 → 공급자)
  function renderReceipt(state, cfg, opts) {
    var t = calc.totals(state.items, state.vat);
    var minRows = opts.single ? 5 : (cfg.maxItems || 8);
    var n = Math.max(state.items.length, minRows);
    var rows = '';
    for (var k = 0; k < n; k++) {
      var it = state.items[k];
      if (!it) { rows += '<tr class="qt-er"><td></td><td></td><td></td><td></td></tr>'; continue; }
      var line = (it.qty || 0) * (it.price || 0);
      rows += '<tr><td class="l">' + (esc(it.name) || '') + '</td>' +
        '<td class="c">' + (it.qty || '') + '</td>' +
        '<td class="r">' + (it.price ? comma(it.price) : '') + '</td>' +
        '<td class="r">' + (line ? comma(line) : '') + '</td></tr>';
    }
    var inner =
      '<div class="rc-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="qt-meta"><span>No. ' + (esc(state.no) || '') + '</span>' +
        '<span>' + (state.date ? cfg.dateLabel + ' : ' + esc(state.date) : '') + '</span></div>' +
      '<div class="rc-recv">' + (esc(state.to) || '&nbsp;') + ' <b>' + esc(cfg.recipientSuffix) + '</b></div>' +
      '<div class="rc-amount">' +
        '<div class="rc-amount-kr">일금 ' + (t.total > 0 ? calc.korAmount(t.total) + '원정' : '') + '</div>' +
        '<div class="rc-amount-num">₩ ' + comma(t.total) + '</div></div>' +
      '<div class="rc-confirm">위 금액을 정히 영수합니다.</div>' +
      '<table class="rc-items"><colgroup><col style="width:50%"><col style="width:14%"><col style="width:18%"><col style="width:18%"></colgroup>' +
        '<thead><tr><th>품　목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<table class="qt-supplier rc-supplier"><tbody>' +
        '<tr><th class="qt-side" rowspan="6">공급자</th><td class="k">등록번호</td><td class="v">' + (esc(state.fromReg) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">상　호</td><td class="v">' + (esc(state.from) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">대표자</td><td class="v"><span>' + (esc(state.fromCeo) || '&nbsp;') + '</span>' + sealHTML(state, cfg) + '</td></tr>' +
        '<tr><td class="k">주　소</td><td class="v">' + (esc(state.fromAddr) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">업태/종목</td><td class="v">' + (esc(state.fromBiz) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">전　화</td><td class="v">' + (esc(state.fromTel) || '&nbsp;') + '</td></tr>' +
      '</tbody></table>';
    return wrap(inner, opts);
  }

  // 무료: 항상 1페이지 (품목은 app에서 14개로 캡). cfg.layout으로 문서별 레이아웃 분기
  function businessInvoice(state, cfg, opts) {
    opts = opts || {};
    if (cfg.layout === 'receipt') return renderReceipt(state, cfg, opts);
    return renderDefault(state, cfg, opts);
  }

  root.Formda.docRender = {
    'business-invoice': businessInvoice,
  };
})(typeof window !== 'undefined' ? window : this);
