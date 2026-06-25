// 폼다 엔진 - 입력폼 렌더 (docConfig -> 입력 HTML)
// business-invoice 레이아웃: 메타행 / 공급자 / 공급받는자 / 품목 / 부가세 / 도장 / 비고
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};

  function field(id, ph) {
    return '<div class="field"><input id="f-' + id + '" placeholder="' + ph + '" ' +
      'oninput="Formda.app.onField(\'' + id + '\', this.value)"></div>';
  }

  function businessInvoiceForm(cfg) {
    var vatBlock = cfg.showVat
      ? '<div class="field"><label>부가세</label>' +
          '<select id="f-vat" onchange="Formda.app.onField(\'vat\', this.value)">' +
            '<option value="0.1">10% 별도</option>' +
            '<option value="incl">10% 포함</option>' +
            '<option value="0">없음</option>' +
          '</select></div>'
      : '';

    var sealBlock = cfg.showSeal
      ? '<div class="field"><label>도장/서명 이미지</label>' +
          '<div class="seal-upload">' +
            '<label class="seal-btn" for="f-seal">이미지 업로드</label>' +
            '<input id="f-seal" type="file" accept="image/*" onchange="Formda.app.onSeal(this)" hidden>' +
            '<button class="seal-clear" type="button" onclick="Formda.app.clearSeal()">제거</button>' +
          '</div>' +
          '<div class="seal-name" id="sealName"></div>' +
          '<p class="field-help">업로드한 이미지는 서버에 저장되지 않고 미리보기에만 사용됩니다. 권장: PNG, 투명 배경</p>' +
        '</div>'
      : '';

    return '' +
      // 1. 기본 정보 (샘플/비우기는 패널 헤더로 이동)
      '<div class="form-sec"><h2>기본 정보</h2>' +
        '<div class="row2">' +
          '<div class="field"><label>' + cfg.dateLabel + '</label>' +
            '<input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
          '<div class="field"><label>' + cfg.numberLabel + '</label>' +
            '<input id="f-no" oninput="Formda.app.onField(\'no\', this.value)"></div>' +
        '</div>' +
        (cfg.validity
          ? '<div class="field"><label>유효기간</label>' +
            '<input id="f-validity" placeholder="예: 발행일로부터 30일" oninput="Formda.app.onField(\'validity\', this.value)"></div>'
          : '') +
      '</div>' +

      // 2. 거래 정보
      '<div class="form-sec"><h2>거래 정보</h2>' +
        '<div class="sub">' + cfg.supplierLabel + '</div>' +
        field('from', '상호') +
        '<div class="row2">' + field('fromReg', '사업자등록번호') + field('fromCeo', '대표자') + '</div>' +
        '<div class="row2">' + field('fromBiz', '업태 / 종목') + field('fromTel', '연락처') + '</div>' +
        field('fromAddr', '주소') +
        '<div class="sub mt">' + cfg.recipientLabel + '</div>' +
        field('to', '상호') +
        (cfg.twoParty
          ? '<div class="row2">' + field('toReg', '사업자등록번호') + field('toCeo', '대표자') + '</div>' +
            '<div class="row2">' + field('toTel', '연락처') + '<div class="field"></div></div>' +
            field('toAddr', '주소')
          : '') +
      '</div>' +

      // 3. 품목과 금액
      '<div class="form-sec"><h2>품목과 금액</h2>' +
        '<table class="items">' +
          '<colgroup><col style="width:32%"><col style="width:18%"><col style="width:13%"><col style="width:27%"><col style="width:10%"></colgroup>' +
          '<thead><tr><th>품목</th><th>규격</th><th>수량</th><th>단가</th><th></th></tr></thead>' +
          '<tbody id="rows"></tbody>' +
        '</table>' +
        '<button class="addrow" id="addRowBtn" type="button" onclick="Formda.app.addRow()">+ 품목 추가</button>' +
        '<p class="field-help" id="rowLimit" style="display:none">무료는 한 페이지 분량까지 작성할 수 있어요. 더 많은 품목·여러 페이지는 추후 지원할 예정입니다.</p>' +
        (vatBlock ? '<div style="margin-top:14px">' + vatBlock + '</div>' : '') +
        (cfg.balance
          ? '<div class="sub mt">미수금 정산 (선택)</div>' +
            '<div class="row2">' +
              '<div class="field"><label>전잔액</label><input id="f-prevBalance" inputmode="numeric" placeholder="0" oninput="Formda.app.onMoney(\'prevBalance\', this)"></div>' +
              '<div class="field"><label>입금액</label><input id="f-paidAmount" inputmode="numeric" placeholder="0" oninput="Formda.app.onMoney(\'paidAmount\', this)"></div>' +
            '</div>'
          : '') +
      '</div>' +

      // 3-1. 납품 조건 (발주서)
      (cfg.deliveryTerms
        ? '<div class="form-sec"><h2>납품 조건</h2>' +
            '<div class="row2">' +
              '<div class="field"><label>납기일자</label>' +
                '<input id="f-deliveryDate" type="date" oninput="Formda.app.onField(\'deliveryDate\', this.value)"></div>' +
              '<div class="field"><label>납품장소</label>' +
                '<input id="f-deliveryPlace" placeholder="예: 발주처 본사 창고" oninput="Formda.app.onField(\'deliveryPlace\', this.value)"></div>' +
            '</div>' +
            '<div class="field"><label>결제조건</label>' +
              '<input id="f-paymentTerms" placeholder="예: 납품 검수 후 30일 이내 계좌이체" oninput="Formda.app.onField(\'paymentTerms\', this.value)"></div>' +
          '</div>'
        : '') +

      // 선택 항목 (접기)
      '<details class="form-opt"><summary>선택 항목 (도장·통화·비고)</summary>' +
        sealBlock +
        '<div class="field"><label>통화</label><input value="원" disabled></div>' +
        '<div class="field"><label>비고</label>' +
          '<textarea id="f-note" rows="2" placeholder="유효기간, 입금계좌 등" ' +
          'oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
      '</details>';
  }

  // 품목 입력행 (수량/단가 콤마·자릿수 제한은 app 핸들러에서)
  function itemRows(items) {
    var calc = root.Formda.calc;
    return items.map(function (it, i) {
      var priceVal = it.price ? it.price.toLocaleString('ko-KR') : '';
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name) + '" placeholder="품목명" oninput="Formda.app.onName(' + i + ', this.value)"></td>' +
        '<td><input value="' + calc.esc(it.spec || '') + '" placeholder="규격" oninput="Formda.app.onSpec(' + i + ', this.value)"></td>' +
        '<td><input inputmode="numeric" value="' + (it.qty || '') + '" oninput="Formda.app.onQty(' + i + ', this)"></td>' +
        '<td><input inputmode="numeric" value="' + priceVal + '" placeholder="0" oninput="Formda.app.onPrice(' + i + ', this)"></td>' +
        '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.delRow(' + i + ')">×</button></td>' +
        '</tr>';
    }).join('');
  }

  root.Formda.formEngine = {
    'business-invoice': businessInvoiceForm,
    itemRows: itemRows,
  };
})(typeof window !== 'undefined' ? window : this);
