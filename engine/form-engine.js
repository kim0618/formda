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
      : '<div class="field"><label>구분</label><input value="-" disabled></div>';

    var sealBlock = cfg.showSeal
      ? '<h2 class="mt">도장 / 직인 (선택)</h2>' +
        '<div class="field seal-upload">' +
          '<label class="seal-btn" for="f-seal">이미지 업로드</label>' +
          '<input id="f-seal" type="file" accept="image/*" onchange="Formda.app.onSeal(this)" hidden>' +
          '<button class="seal-clear" type="button" onclick="Formda.app.clearSeal()">제거</button>' +
        '</div>' +
        '<div class="seal-name" id="sealName"></div>'
      : '';

    return '' +
      '<div class="row2">' +
        '<div class="field"><label>' + cfg.dateLabel + '</label>' +
          '<input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
        '<div class="field"><label>' + cfg.numberLabel + '</label>' +
          '<input id="f-no" oninput="Formda.app.onField(\'no\', this.value)"></div>' +
      '</div>' +

      '<h2 class="mt">' + cfg.supplierLabel + '</h2>' +
      field('from', '상호') +
      '<div class="row2">' + field('fromReg', '사업자등록번호') + field('fromTel', '연락처') + '</div>' +
      field('fromAddr', '주소') +

      '<h2 class="mt">' + cfg.recipientLabel + '</h2>' +
      field('to', '상호') +

      '<h2 class="mt">품목</h2>' +
      '<table class="items">' +
        '<colgroup><col style="width:44%"><col style="width:18%"><col style="width:28%"><col style="width:10%"></colgroup>' +
        '<thead><tr><th>품목</th><th>수량</th><th>단가</th><th></th></tr></thead>' +
        '<tbody id="rows"></tbody>' +
      '</table>' +
      '<button class="addrow" type="button" onclick="Formda.app.addRow()">+ 품목 추가</button>' +

      '<div class="row2" style="margin-top:16px">' +
        vatBlock +
        '<div class="field"><label>통화</label><input value="원" disabled></div>' +
      '</div>' +

      sealBlock +

      '<div class="field"><label>비고</label>' +
        '<textarea id="f-note" rows="2" placeholder="유효기간, 입금계좌 등" ' +
        'oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>';
  }

  // 품목 입력행 (수량/단가 콤마·자릿수 제한은 app 핸들러에서)
  function itemRows(items) {
    var calc = root.Formda.calc;
    return items.map(function (it, i) {
      var priceVal = it.price ? it.price.toLocaleString('ko-KR') : '';
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name) + '" placeholder="품목명" oninput="Formda.app.onName(' + i + ', this.value)"></td>' +
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
