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

  function amountBox(t, cfg) {
    return '<div class="qt-amount">' +
      '<div class="k">' + ((cfg && cfg.amountLabel) || '합계금액') + '</div>' +
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
        amountBox(t, cfg);
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
      amountBox(t, cfg) +
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
    // 청구서 표준: 결제 안내란 (납부기한 / 예금주 / 입금계좌)
    var payInfo = '';
    if (cfg.payInfo) {
      payInfo = '<table class="qt-terms"><tbody>' +
        '<tr><td class="k">납부기한</td><td class="v">' + (esc(state.payDue) || '&nbsp;') + '</td>' +
            '<td class="k">예금주</td><td class="v">' + (esc(state.payHolder) || '&nbsp;') + '</td></tr>' +
        '<tr><td class="k">입금계좌</td><td class="v" colspan="3">' + (esc(state.payAccount) || '&nbsp;') + '</td></tr>' +
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
      payInfo +
      validity +
      (state.note ? '<div class="qt-note">' + esc(state.note) + '</div>' : '') +
      receiver;
  }

  // .doc-fit = 자동 맞춤 대상(내용이 A4 높이 넘으면 app.fitDoc이 축소)
  function pageEl(inner, cls) { return '<div class="doc-page' + (cls ? ' ' + cls : '') + '"><div class="doc-fit">' + inner + '</div><div class="doc-wm" aria-hidden="true"></div><div class="doc-url" aria-hidden="true">formda.kr · 무료 문서 작성</div></div>'; }

  function wrap(inner, opts, cls) {
    return opts.single ? pageEl(inner, cls) : '<div class="doc-pages">' + pageEl(inner, cls) + '</div>';
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

  // ===== 증명·증서 (certificate) 가족 =====
  function korDate(s) {
    if (!s) return '';
    var p = String(s).split('-');
    if (p.length !== 3) return esc(s);
    return p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일';
  }
  function ctRow(label, v) {
    return '<tr><td class="k">' + label + '</td><td class="v">' + (esc(v) || '&nbsp;') + '</td></tr>';
  }
  function renderEmployment(state, cfg) {
    var s = state;
    var info = '<table class="ct-info"><tbody>' +
      ctRow('성　명', s.name) + ctRow('생년월일', s.birth) +
      ctRow('주　소', s.addr) +
      ctRow('소　속', s.dept) + ctRow('직　위', s.position) +
      ctRow('재직기간', s.period) + '</tbody></table>';
    var meta = [];
    if (s.orgReg) meta.push('사업자등록번호 ' + esc(s.orgReg));
    if (s.orgTel) meta.push('전화 ' + esc(s.orgTel));
    if (s.orgAddr) meta.push(esc(s.orgAddr));
    return '<div class="ct-page">' +
      '<div class="ct-top">' +
        (s.docNo ? '<div class="ct-docno">제 ' + esc(s.docNo) + ' 호</div>' : '') +
        '<div class="ct-title">' + esc(cfg.docTitle) + '</div>' + info +
        '<div class="ct-body">' + (esc(s.body) || '위 사람은 당사에 위와 같이 재직하고 있음을 증명합니다.') + '</div>' +
        (s.purpose ? '<div class="ct-purpose">용　도 : ' + esc(s.purpose) + '</div>' : '') +
      '</div>' +
      '<div class="ct-bottom">' +
        '<div class="ct-date">' + korDate(s.date) + '</div>' +
        '<div class="ct-issuer">' +
          '<div class="ct-org">' + (esc(s.orgName) || '&nbsp;') + '</div>' +
          '<div class="ct-ceo">대표이사 ' + (esc(s.orgCeo) || '&nbsp;') + sealHTML(s, cfg) + '</div>' +
          '<div class="ct-meta">' + meta.join('　·　') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  function renderResignation(state, cfg) {
    var s = state;
    var info = '<table class="ct-info"><tbody>' +
      ctRow('소　속', s.dept) + ctRow('직　위', s.position) +
      ctRow('성　명', s.name) + ctRow('생년월일', s.birth) +
      ctRow('입사일자', s.hireDate) + ctRow('퇴직희망일', s.lastDay) + '</tbody></table>';
    return '<div class="ct-page">' +
      '<div class="ct-top">' +
        '<div class="ct-title">' + esc(cfg.docTitle) + '</div>' + info +
        '<div class="ct-body ct-letter">' + (esc(s.body) || '상기 본인은 일신상의 사유로 인하여 위 퇴직희망일자로 사직하고자 하오니 재가하여 주시기 바랍니다. 퇴직 전까지 담당 업무를 후임자에게 성실히 인수인계할 것을 약속드리며, 그동안 베풀어 주신 배려에 깊이 감사드립니다.') + '</div>' +
        '<div class="ct-sec">인수인계 사항</div><div class="ct-handover">' + (esc(s.handover) || '&nbsp;') + '</div>' +
      '</div>' +
      '<div class="ct-bottom">' +
        '<div class="ct-date">' + korDate(s.date) + '</div>' +
        '<div class="ct-signer">작성자 : ' + (esc(s.name) || '&nbsp;') + sealHTML(s, cfg) + '</div>' +
        '<div class="ct-recipient">' + (esc(s.recipient) || '&nbsp;') + ' 귀하</div>' +
      '</div>' +
    '</div>';
  }
  function renderAward(state, cfg) {
    var s = state;
    return '<div class="aw-page">' +
      '<div class="aw-top">' +
        (s.docNo ? '<div class="ct-docno">제 ' + esc(s.docNo) + ' 호</div>' : '') +
        '<div class="aw-title">' + esc(cfg.docTitle) + '</div>' +
        '<div class="aw-flourish"><span>&#9670;</span></div>' +
      '</div>' +
      '<div class="aw-mid">' +
        '<div class="aw-recipient">' +
          (s.recipientSub ? '<div class="aw-sub">' + esc(s.recipientSub) + '</div>' : '') +
          '<div class="aw-name">' + (esc(s.name) || '&nbsp;') + '</div>' +
        '</div>' +
        '<div class="aw-body">' + (esc(s.body) || '위 사람은 평소 맡은 바 직무에 성실하고 그 성과가 우수하여 다른 이의 모범이 되므로, 그 공로를 기리어 이 상장을 수여합니다.') + '</div>' +
      '</div>' +
      '<div class="aw-bottom">' +
        '<div class="aw-date">' + korDate(s.date) + '</div>' +
        '<div class="aw-issuer"><div class="aw-org">' + (esc(s.orgName) || '&nbsp;') + '</div>' +
          '<div class="aw-ceo">' + (esc(s.orgTitle) || '대표이사') + '　' + (esc(s.orgCeo) || '&nbsp;') + sealHTML(s, cfg) + '</div></div>' +
      '</div>' +
    '</div>';
  }
  function certificate(state, cfg, opts) {
    opts = opts || {};
    var inner;
    if (cfg.variant === 'resignation') inner = renderResignation(state, cfg);
    else if (cfg.variant === 'award') inner = renderAward(state, cfg);
    else inner = renderEmployment(state, cfg);
    return wrap(inner, opts);
  }

  // ===== 자기소개서 (cover-letter) - 멀티페이지 flow =====
  function renderCoverLetter(state, cfg, opts) {
    opts = opts || {};
    var s = state;
    var blocks = '<div class="cl-head"><div class="cl-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="cl-meta">' + [esc(s.name), esc(s.applyTo)].filter(Boolean).join('　|　') + '</div></div>';
    (s.items || []).forEach(function (it) {
      if (it.heading) blocks += '<div class="cl-q">' + esc(it.heading) + '</div>';
      String(it.body || '').split(/\n+/).forEach(function (p) {
        if (p.trim()) blocks += '<p class="cl-p">' + esc(p) + '</p>';
      });
    });
    // 브라우저에서 app.paginateFlow가 페이지로 분할. 노드(썸네일)에선 1페이지로 클리핑.
    return wrap('<div class="cl-flow">' + blocks + '</div>', opts);
  }

  // ===== 경력기술서 (career) - 멀티페이지 flow =====
  function renderCareer(state, cfg, opts) {
    opts = opts || {};
    var s = state;
    var blocks = '<div class="cl-head"><div class="cl-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="cl-meta">' + [esc(s.name), esc(s.contact)].filter(Boolean).join('　|　') + '</div></div>';
    if (s.summary && s.summary.trim()) {
      blocks += '<div class="cl-q">경력 요약</div>';
      String(s.summary).split(/\n+/).forEach(function (p) { if (p.trim()) blocks += '<p class="cl-p">' + esc(p) + '</p>'; });
    }
    if (s.skills && s.skills.trim()) {
      blocks += '<div class="cl-q">핵심 역량</div>';
      String(s.skills).split(/\n+/).forEach(function (p) { if (p.trim()) blocks += '<p class="cl-p">' + esc(p) + '</p>'; });
    }
    if ((s.items || []).length) blocks += '<div class="cl-q">경력 사항</div>';
    (s.items || []).forEach(function (it) {
      var head = [esc(it.company), esc(it.period), esc(it.role)].filter(Boolean).join('　|　');
      if (head) blocks += '<div class="cl-exp">' + head + '</div>';
      String(it.body || '').split(/\n+/).forEach(function (p) { if (p.trim()) blocks += '<p class="cl-p">' + esc(p) + '</p>'; });
    });
    return wrap('<div class="cl-flow">' + blocks + '</div>', opts);
  }

  // ===== 명함 (card) =====
  function renderCard(state, cfg, opts) {
    opts = opts || {};
    var s = state;
    var contacts = '';
    if (s.tel) contacts += '<div class="cd-line"><b>T</b>' + esc(s.tel) + '</div>';
    if (s.email) contacts += '<div class="cd-line"><b>E</b>' + esc(s.email) + '</div>';
    if (s.website) contacts += '<div class="cd-line"><b>W</b>' + esc(s.website) + '</div>';
    if (s.addr) contacts += '<div class="cd-line"><b>A</b>' + esc(s.addr) + '</div>';
    var role = [esc(s.position), esc(s.dept)].filter(Boolean).join('　·　');
    var inner =
      '<div class="cd" style="--accent:' + (esc(s.cardColor) || cfg.accent || '#1e3a8a') + '">' +
        '<div class="cd-top">' +
          '<div class="cd-brand">' +
            (s.logo ? '<img class="cd-logo" src="' + s.logo + '" alt="로고">' : '') +
            '<span class="cd-company">' + (esc(s.company) || '&nbsp;') + '</span>' +
          '</div>' +
          (s.slogan ? '<span class="cd-slogan">' + esc(s.slogan) + '</span>' : '') + '</div>' +
        '<div class="cd-id"><span class="cd-name">' + (esc(s.name) || '&nbsp;') + '</span>' +
          (role ? '<span class="cd-role">' + role + '</span>' : '') + '</div>' +
        '<div class="cd-divider"></div>' +
        '<div class="cd-contacts">' + contacts + '</div>' +
      '</div>';
    return wrap(inner, opts, 'card');
  }

  // ===== 가정통신문·안내문 (notice) =====
  function renderNotice(state, cfg, opts) {
    opts = opts || {};
    var s = state;
    var reply = (cfg.reply === false) ? '' :
      '<div class="nt-cut"><span>✂ 절취선</span></div>' +
      '<div class="nt-reply-confirm">' + (esc(s.reply) || '위 가정통신문 내용을 확인하였습니다.') + '</div>' +
      '<table class="nt-reply-tbl"><tbody><tr>' +
        '<td class="k">학년 / 반</td><td class="v">&nbsp;</td>' +
        '<td class="k">학생 이름</td><td class="v">&nbsp;</td>' +
        '<td class="k">학부모</td><td class="v">(서명)</td>' +
      '</tr></tbody></table>';
    var inner =
      '<div class="nt-page">' +
        '<div class="nt-content">' +
          '<div class="nt-head">' + (esc(s.orgName) || '&nbsp;') + '</div>' +
          '<div class="nt-meta"><span>' + esc(cfg.docTitle) + '</span><span>' + (s.docNo ? '제 ' + esc(s.docNo) + ' 호' : '') + '</span></div>' +
          '<div class="nt-title">' + (esc(s.title) || '&nbsp;') + '</div>' +
          '<div class="nt-body">' + (esc(s.body) || '') + '</div>' +
          '<div class="nt-date">' + korDate(s.date) + '</div>' +
          '<div class="nt-sender">' + (esc(s.sender) || '&nbsp;') + sealHTML(s, cfg) + '</div>' +
        '</div>' +
        (reply ? '<div class="nt-reply-block">' + reply + '</div>' : '') +
      '</div>';
    return wrap(inner, opts);
  }

  // ===== 이력서 (resume) 가족 =====
  function rsTable(list, cols, minRows, headers) {
    var n = Math.max((list || []).length, minRows);
    var rows = '';
    for (var i = 0; i < n; i++) {
      var it = (list || [])[i];
      rows += '<tr>' + cols.map(function (c) {
        return '<td class="' + (c.cls || '') + '">' + (it ? (esc(it[c.key]) || '') : '') + '</td>';
      }).join('') + '</tr>';
    }
    var thead = '<tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>';
    return '<table class="rs-table"><thead>' + thead + '</thead><tbody>' + rows + '</tbody></table>';
  }
  function renderResume(state, cfg, opts) {
    opts = opts || {};
    var s = state;
    var photo = s.photo ? '<img src="' + s.photo + '" alt="사진">' : '<span>사진<br>3 × 4</span>';
    var info = '<table class="rs-info"><tbody>' +
      '<tr><td class="k">성　명</td><td class="v">' + (esc(s.name) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">생년월일</td><td class="v">' + (esc(s.birth) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">연락처</td><td class="v">' + (esc(s.tel) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">이메일</td><td class="v">' + (esc(s.email) || '&nbsp;') + '</td></tr>' +
      '<tr><td class="k">주　소</td><td class="v">' + (esc(s.addr) || '&nbsp;') + '</td></tr>' +
      '</tbody></table>';
    var eduCols = [{ key: 'period', cls: 'c' }, { key: 'school', cls: 'l' }, { key: 'major', cls: 'l' }, { key: 'status', cls: 'c' }];
    var carCols = [{ key: 'period', cls: 'c' }, { key: 'company', cls: 'l' }, { key: 'role', cls: 'l' }, { key: 'task', cls: 'l' }];
    var eduMin = opts.single ? 3 : (cfg.maxEdu || 4);
    var carMin = opts.single ? 4 : (cfg.maxCareer || 5);
    var inner =
      '<div class="rs-page">' +
      '<div class="rs-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="rs-top"><div class="rs-info-wrap">' + info + '</div><div class="rs-photo">' + photo + '</div></div>' +
      '<div class="rs-sec">학력사항</div>' + rsTable(s.edu, eduCols, eduMin, ['재학기간', '학교명', '전공·학위', '졸업구분']) +
      '<div class="rs-sec">경력사항</div>' + rsTable(s.career, carCols, carMin, ['근무기간', '회사명', '직위·부서', '담당업무']) +
      '<div class="rs-sec">자격·기타</div><div class="rs-etc">' + (esc(s.etc) || '&nbsp;') + '</div>' +
      '<div class="rs-foot"><span>' + (s.date ? '작성일 : ' + esc(s.date) : '') + '</span>' +
        '<span>작성자 : ' + (esc(s.name) || '&nbsp;') + ' (인)</span></div>' +
      '</div>';
    return wrap(inner, opts);
  }

  // ===== 차용증·위임장 (legal) =====
  function lgRows(pairs) {
    return pairs.map(function (p) {
      return '<tr><td class="k">' + p[0] + '</td><td class="v">' + p[1] + '</td></tr>';
    }).join('');
  }
  function lgParty(title, pairs) {
    return '<div class="lg-party">' +
      '<div class="lg-party-t">' + title + '</div>' +
      '<table class="lg-ptbl"><tbody>' + lgRows(pairs) + '</tbody></table></div>';
  }
  function vOr(v) { return esc(v) || '&nbsp;'; }
  // YYYY-MM-DD면 한글 날짜로, 아니면 그대로 (변제기일은 "만기 시" 등 자유 입력도 허용)
  function lgDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) ? korDate(v) : vOr(v); }
  function renderLoan(state, cfg) {
    var s = state;
    var amount = Number(s.amount) || 0;
    var terms = [
      ['이　자　율', s.rate ? '연 ' + esc(s.rate) + ' %' : '없음 (무이자)'],
      ['변 제 기 일', lgDate(s.dueDate)],
      ['변 제 방 법', vOr(s.repayMethod)],
    ];
    if (s.delayRate) terms.push(['지연손해금', '연 ' + esc(s.delayRate) + ' %']);
    // 표준 순서: 채권자·채무자 정보(상단) → 차용금액 → 본문(영수) → 조건 → 특약 → 날짜 → 서명(양 당사자)
    var creditor = lgParty('채권자 (빌려준 사람)', [
      ['성　명', vOr(s.crName)], ['주민등록번호', vOr(s.crId)],
      ['주　소', vOr(s.crAddr)], ['연　락　처', vOr(s.crTel)],
    ]);
    var debtor = lgParty('채무자 (빌린 사람)', [
      ['성　명', vOr(s.dbName)], ['주민등록번호', vOr(s.dbId)],
      ['주　소', vOr(s.dbAddr)], ['연　락　처', vOr(s.dbTel)],
    ]);
    return '<div class="lg-page">' +
      '<div class="lg-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="lg-parties">' + creditor + debtor + '</div>' +
      '<div class="lg-amount"><div class="lg-amount-kr">일금 ' + (amount > 0 ? calc.korAmount(amount) + '원정' : '&nbsp;') + '</div>' +
        '<div class="lg-amount-num">₩ ' + comma(amount) + '</div></div>' +
      '<div class="lg-body">' + (esc(s.body) || '위 채무자는 위 금액을 채권자로부터 틀림없이 차용하고 영수하였으며, 아래에 정한 바에 따라 원리금을 변제할 것을 확약합니다.') + '</div>' +
      '<table class="lg-terms"><tbody>' + lgRows(terms) + '</tbody></table>' +
      (s.special ? '<div class="lg-sec">특약사항</div><div class="lg-special">' + esc(s.special) + '</div>' : '') +
      '<div class="lg-date">' + korDate(s.date) + '</div>' +
      '<div class="lg-signrow">' +
        '<span class="lg-signcell">채권자　<span class="lg-sign">' + vOr(s.crName) + '<span class="qt-seal">(인)</span></span></span>' +
        '<span class="lg-signcell">채무자　<span class="lg-sign">' + vOr(s.dbName) + sealHTML(s, cfg) + '</span></span>' +
      '</div>' +
    '</div>';
  }
  function renderMandate(state, cfg) {
    var s = state;
    // 표준 순서: 위임인(본인) → 수임인(대리인) → 위임내용 → 선언문 → 날짜 → 위임인 서명
    var principal = lgParty('위임인 (본인)', [
      ['성　명', vOr(s.prName)], ['주민등록번호', vOr(s.prId)],
      ['주　소', vOr(s.prAddr)], ['연　락　처', vOr(s.prTel)],
    ]);
    var agent = lgParty('수임인 (대리인)', [
      ['성　명', vOr(s.agName)], ['주민등록번호', vOr(s.agId)],
      ['주　소', vOr(s.agAddr)], ['연　락　처', vOr(s.agTel)],
      ['위임인과의 관계', vOr(s.relation)],
    ]);
    var extra = [];
    if (s.period) extra.push(['위 임 기 간', esc(s.period)]);
    if (s.attach) extra.push(['첨 부 서 류', esc(s.attach)]);
    return '<div class="lg-page">' +
      '<div class="lg-title">' + esc(cfg.docTitle) + '</div>' +
      '<div class="lg-parties lg-parties-col">' + principal + agent + '</div>' +
      '<div class="lg-sec">위임 내용</div>' +
      '<div class="lg-content">' + (esc(s.content) || '&nbsp;') + '</div>' +
      (extra.length ? '<table class="lg-terms"><tbody>' + lgRows(extra) + '</tbody></table>' : '') +
      '<div class="lg-decl">' + (esc(s.lead) || '위 본인은 위 사람을 대리인으로 정하여, 위 위임 내용에 관한 일체의 권한을 위임합니다.') + '</div>' +
      '<div class="lg-date">' + korDate(s.date) + '</div>' +
      '<div class="lg-signline">위임인　<span class="lg-sign">' + vOr(s.prName) + sealHTML(s, cfg) + '</span></div>' +
    '</div>';
  }
  function legal(state, cfg, opts) {
    opts = opts || {};
    var inner = cfg.variant === 'mandate' ? renderMandate(state, cfg) : renderLoan(state, cfg);
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
    'resume': renderResume,
    'certificate': certificate,
    'notice': renderNotice,
    'card': renderCard,
    'cover-letter': renderCoverLetter,
    'career': renderCareer,
    'legal': legal,
  };
})(typeof window !== 'undefined' ? window : this);
