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
        '<div class="profile-bar">' +
          '<button type="button" class="mini-btn" onclick="Formda.app.saveProfile()">＋ 내 회사 정보 저장</button>' +
          '<button type="button" class="mini-btn" id="profileLoadBtn" style="display:none" onclick="Formda.app.loadProfile()">불러오기</button>' +
          '<button type="button" class="profile-clear" id="profileClearBtn" style="display:none" onclick="Formda.app.clearProfile()">지우기</button>' +
          '<span class="profile-status" id="profileStatus"></span>' +
        '</div>' +
        '<p class="field-help">공급자 정보와 도장을 이 브라우저에 저장해 다음 방문 때 자동으로 채웁니다. 서버에는 저장되지 않습니다.</p>' +
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

      // 3-2. 결제 정보 (청구서)
      (cfg.payInfo
        ? '<div class="form-sec"><h2>결제 정보</h2>' +
            '<div class="row2">' +
              '<div class="field"><label>납부기한</label>' +
                '<input id="f-payDue" type="date" oninput="Formda.app.onField(\'payDue\', this.value)"></div>' +
              '<div class="field"><label>예금주</label>' +
                '<input id="f-payHolder" placeholder="예: 폼다상사" oninput="Formda.app.onField(\'payHolder\', this.value)"></div>' +
            '</div>' +
            '<div class="field"><label>입금계좌</label>' +
              '<input id="f-payAccount" placeholder="예: 폼다은행 123-456-7890" oninput="Formda.app.onField(\'payAccount\', this.value)"></div>' +
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

  // ===== 증명·증서 (certificate) 가족 =====
  function lf(id, label, ph, type) {
    return '<div class="field"><label>' + label + '</label><input id="f-' + id + '"' +
      (type ? ' type="' + type + '"' : '') + (ph ? ' placeholder="' + ph + '"' : '') +
      ' oninput="Formda.app.onField(\'' + id + '\', this.value)"></div>';
  }
  function certificateForm(cfg) {
    var sealBlock = cfg.showSeal
      ? '<div class="field"><label>도장·서명 이미지 (선택)</label><div class="seal-upload">' +
          '<label class="seal-btn" for="f-seal">이미지 업로드</label>' +
          '<input id="f-seal" type="file" accept="image/*" onchange="Formda.app.onSeal(this)" hidden>' +
          '<button class="seal-clear" type="button" onclick="Formda.app.clearSeal()">제거</button></div>' +
          '<div class="seal-name" id="sealName"></div></div>'
      : '';
    if (cfg.variant === 'award') {
      return '' +
        '<div class="form-sec"><h2>수상자</h2>' +
          lf('recipientSub', '소속·직위', '경영지원팀 과장') +
          lf('name', '성명', '홍길동') +
        '</div>' +
        '<div class="form-sec"><h2>수여 내용</h2>' +
          '<div class="field"><label>제목</label>' +
            '<input id="f-docTitle" placeholder="상장" oninput="Formda.app.onField(\'docTitle\', this.value)">' +
            '<p class="field-help">표창장·감사장·공로상 등으로 바꾸려면 이 칸에 직접 입력하세요. 비우면 "상장"으로 표시됩니다.</p></div>' +
          '<div class="field"><label>수여 문구·공적</label>' +
            '<textarea id="f-body" rows="6" placeholder="위 사람은 ~하여 그 공이 크므로 이 상장을 수여합니다." oninput="Formda.app.onField(\'body\', this.value)"></textarea></div>' +
          '<div class="row2">' + lf('docNo', '상장 번호 (선택)', '2026-001') + lf('date', '수여일자', '', 'date') + '</div>' +
        '</div>' +
        '<div class="form-sec"><h2>수여기관</h2>' +
          lf('orgName', '기관·회사명', '폼다 주식회사') +
          '<div class="row2">' + lf('orgTitle', '직위', '대표이사') + lf('orgCeo', '성명', '김폼다') + '</div>' +
          sealBlock +
        '</div>';
    }
    if (cfg.variant === 'resignation') {
      return '' +
        '<div class="form-sec"><h2>작성자 정보</h2>' +
          '<div class="row2">' + lf('dept', '소속·부서') + lf('position', '직위') + '</div>' +
          '<div class="row2">' + lf('name', '성명') + lf('birth', '생년월일', '1990-05-20') + '</div>' +
          '<div class="row2">' + lf('hireDate', '입사일자', '2018년 3월 1일') + lf('lastDay', '퇴직 희망일', '2026년 7월 31일') + '</div>' +
        '</div>' +
        '<div class="form-sec"><h2>사직 내용</h2>' +
          '<div class="field"><label>사직 사유·문구</label>' +
            '<textarea id="f-body" rows="4" oninput="Formda.app.onField(\'body\', this.value)"></textarea></div>' +
          '<div class="field"><label>인수인계 사항</label>' +
            '<textarea id="f-handover" rows="3" placeholder="담당 업무, 후임자, 인수인계 기간 등" oninput="Formda.app.onField(\'handover\', this.value)"></textarea></div>' +
          '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
        '</div>' +
        '<div class="form-sec"><h2>수신·서명</h2>' +
          lf('recipient', '수신', '예: 폼다 주식회사 대표이사') +
          sealBlock +
        '</div>';
    }
    return '' +
      '<div class="form-sec"><h2>대상자 정보</h2>' +
        '<div class="row2">' + lf('name', '성명') + lf('birth', '생년월일', '1990-05-20') + '</div>' +
        lf('addr', '주소') +
        '<div class="row2">' + lf('dept', '소속·부서') + lf('position', '직위') + '</div>' +
        lf('period', '재직기간', '2018년 3월 1일 ~ 현재') +
      '</div>' +
      '<div class="form-sec"><h2>증명 내용</h2>' +
        '<div class="field"><label>증명 문구</label>' +
          '<textarea id="f-body" rows="2" oninput="Formda.app.onField(\'body\', this.value)"></textarea></div>' +
        '<div class="row2">' + lf('purpose', '용도', '관공서 제출용') + lf('date', '발급일자', '', 'date') + '</div>' +
        lf('docNo', '발급번호 (선택)', '예: 2026-001') +
      '</div>' +
      '<div class="form-sec"><h2>발급기관</h2>' +
        lf('orgName', '회사명') +
        '<div class="row2">' + lf('orgCeo', '대표자') + lf('orgReg', '사업자등록번호') + '</div>' +
        '<div class="row2">' + lf('orgTel', '연락처') + lf('orgAddr', '주소') + '</div>' +
        sealBlock +
      '</div>';
  }

  // ===== 자기소개서 (cover-letter) =====
  function coverLetterForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>기본 정보</h2>' +
        '<div class="row2">' + lf('name', '이름', '홍길동') + lf('applyTo', '지원 회사·분야 (선택)', '○○회사 마케팅') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>문항</h2>' +
        '<div id="qRows"></div>' +
        '<button class="addrow" id="addQBtn" type="button" onclick="Formda.app.addQ()">+ 문항 추가</button>' +
        '<p class="field-help">문항(예: 성장과정, 지원 동기)과 답변을 입력하면 길이에 따라 자동으로 여러 장에 나눠 담깁니다.</p>' +
      '</div>';
  }
  function qcLabel(b) {
    b = b || '';
    // 코드포인트 기준(글자수 세기 도구와 동일). UTF-16 length는 이모지·일부 한자를 2로 세므로 사용하지 않음.
    var withSpace = Array.from(b).length;
    var noSpace = Array.from(b.replace(/\s/g, '')).length;
    return '공백 포함 ' + withSpace.toLocaleString('ko-KR') + '자 · 제외 ' + noSpace.toLocaleString('ko-KR') + '자';
  }
  function qRows(items) {
    var calc = root.Formda.calc;
    return items.map(function (it, i) {
      return '<div class="q-block">' +
        '<div class="q-row"><input class="q-head" value="' + calc.esc(it.heading || '') + '" placeholder="문항 (예: 지원 동기)" oninput="Formda.app.onQHead(' + i + ', this.value)">' +
        '<button class="del" type="button" onclick="Formda.app.delQ(' + i + ')">×</button></div>' +
        '<textarea class="q-body" rows="5" placeholder="답변을 입력하세요." oninput="Formda.app.onQBody(' + i + ', this.value)">' + calc.esc(it.body || '') + '</textarea>' +
        '<div class="q-count" id="qc-' + i + '">' + qcLabel(it.body) + '</div>' +
        '</div>';
    }).join('');
  }

  // ===== 경력기술서 (career) =====
  function careerForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>기본 정보</h2>' +
        '<div class="row2">' + lf('name', '성명', '홍길동') + lf('contact', '연락처·이메일 (선택)', '010-0000-0000') + '</div>' +
        '<div class="field"><label>경력 요약 (선택)</label>' +
          '<textarea id="f-summary" rows="3" placeholder="경력과 강점을 2~3줄로 요약" oninput="Formda.app.onField(\'summary\', this.value)"></textarea></div>' +
        '<div class="field"><label>핵심 역량 (선택)</label>' +
          '<textarea id="f-skills" rows="4" placeholder="줄마다 하나씩. 예)\n퍼포먼스 마케팅 (검색·디스플레이·SNS 광고)\n데이터 분석 (GA4, SQL, Excel)\n브랜드 캠페인 기획·실행" oninput="Formda.app.onField(\'skills\', this.value)"></textarea>' +
          '<p class="field-help">이직 시 채용 담당자가 가장 먼저 보는 항목입니다. 보유 기술·강점을 줄 단위로 적으세요.</p></div>' +
      '</div>' +
      '<div class="form-sec"><h2>경력 사항</h2>' +
        '<div id="expRows"></div>' +
        '<button class="addrow" id="addExpBtn" type="button" onclick="Formda.app.addExp()">+ 경력 추가</button>' +
        '<p class="field-help">회사·기간·직위와 담당 업무·성과를 적으면 길이에 따라 자동으로 여러 장에 나눠 담깁니다.</p>' +
      '</div>';
  }
  function careerExpRows(items) {
    var calc = root.Formda.calc;
    return items.map(function (it, i) {
      return '<div class="q-block">' +
        '<div class="q-row"><input class="q-head" value="' + calc.esc(it.company || '') + '" placeholder="회사명" oninput="Formda.app.onExp(' + i + ', \'company\', this.value)">' +
          '<input class="q-head" value="' + calc.esc(it.period || '') + '" placeholder="근무기간 (예: 2020.03 ~ 2023.02)" oninput="Formda.app.onExp(' + i + ', \'period\', this.value)"></div>' +
        '<div class="q-row"><input class="q-head" value="' + calc.esc(it.role || '') + '" placeholder="직위·담당 (예: 마케팅팀 과장)" oninput="Formda.app.onExp(' + i + ', \'role\', this.value)">' +
          '<button class="del" type="button" onclick="Formda.app.delExp(' + i + ')">×</button></div>' +
        '<textarea class="q-body" rows="5" placeholder="담당 업무와 성과를 구체적으로 적습니다." oninput="Formda.app.onExp(' + i + ', \'body\', this.value)">' + calc.esc(it.body || '') + '</textarea>' +
        '<div class="q-count" id="qc-' + i + '">' + qcLabel(it.body) + '</div>' +
        '</div>';
    }).join('');
  }

  // ===== 명함 (card) =====
  function cardForm(cfg) {
    var colors = ['#1e3a8a', '#4f46e5', '#0d9488', '#b45309', '#e11d48', '#16a34a', '#334155'];
    var swatches = colors.map(function (c) {
      return '<button type="button" class="cd-sw" data-color="' + c + '" style="background:' + c + '" onclick="Formda.app.setCardColor(\'' + c + '\')" aria-label="' + c + '"></button>';
    }).join('');
    return '' +
      '<div class="form-sec"><h2>회사 정보</h2>' +
        lf('company', '회사명', '폼다 주식회사') +
        lf('slogan', '슬로건 (선택)', '입력하면 바로 완성되는 문서') +
        '<div class="field"><label>로고 이미지 (선택)</label><div class="seal-upload">' +
          '<label class="seal-btn" for="f-logo">이미지 업로드</label>' +
          '<input id="f-logo" type="file" accept="image/*" onchange="Formda.app.onLogo(this)" hidden>' +
          '<button class="seal-clear" type="button" onclick="Formda.app.clearLogo()">제거</button></div>' +
          '<div class="seal-name" id="logoName"></div></div>' +
        '<div class="field"><label>카드 색상</label><div class="cd-colors">' + swatches + '</div></div>' +
      '</div>' +
      '<div class="form-sec"><h2>이름·직함</h2>' +
        lf('name', '이름', '홍길동') +
        '<div class="row2">' + lf('position', '직함', '팀장') + lf('dept', '부서 (선택)', '마케팅팀') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>연락처</h2>' +
        '<div class="row2">' + lf('tel', '휴대폰·연락처', '010-1234-5678') + lf('email', '이메일', 'hong@example.com') + '</div>' +
        lf('website', '웹사이트 (선택)', 'www.formda.kr') +
        lf('addr', '주소 (선택)', '서울특별시 강남구 테헤란로 1') +
      '</div>';
  }

  // ===== 가정통신문·안내문 (notice) =====
  function noticeForm(cfg) {
    var sealBlock = cfg.showSeal
      ? '<div class="field"><label>직인 이미지 (선택)</label><div class="seal-upload">' +
          '<label class="seal-btn" for="f-seal">이미지 업로드</label>' +
          '<input id="f-seal" type="file" accept="image/*" onchange="Formda.app.onSeal(this)" hidden>' +
          '<button class="seal-clear" type="button" onclick="Formda.app.clearSeal()">제거</button></div>' +
          '<div class="seal-name" id="sealName"></div></div>'
      : '';
    return '' +
      '<div class="form-sec"><h2>기관 정보</h2>' +
        lf('orgName', '학교·기관명', '○○초등학교') +
        '<div class="row2">' + lf('docNo', '통신문 번호 (선택)', '2026-15') + lf('date', '발행일자', '', 'date') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>안내 내용</h2>' +
        lf('title', '제목', '현장체험학습 안내') +
        '<div class="field"><label>본문</label>' +
          '<textarea id="f-body" rows="9" placeholder="안녕하십니까. ...\n\n1. 일시 :\n2. 장소 :\n3. 대상 :" oninput="Formda.app.onField(\'body\', this.value)"></textarea></div>' +
      '</div>' +
      '<div class="form-sec"><h2>발신·회신</h2>' +
        lf('sender', '발신 (예: ○○초등학교장)', '○○초등학교장') +
        '<div class="field"><label>회신 확인 문구</label>' +
          '<input id="f-reply" placeholder="위 가정통신문 내용을 확인하였습니다." oninput="Formda.app.onField(\'reply\', this.value)"></div>' +
        sealBlock +
      '</div>';
  }

  // ===== 이력서 (resume) 가족 =====
  function resumeForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>인적사항</h2>' +
        '<div class="row2">' +
          '<div class="field"><label>성명</label><input id="f-name" oninput="Formda.app.onField(\'name\', this.value)"></div>' +
          '<div class="field"><label>생년월일</label><input id="f-birth" placeholder="1995-03-12" oninput="Formda.app.onField(\'birth\', this.value)"></div>' +
        '</div>' +
        '<div class="row2">' +
          '<div class="field"><label>연락처</label><input id="f-tel" placeholder="010-0000-0000" oninput="Formda.app.onField(\'tel\', this.value)"></div>' +
          '<div class="field"><label>이메일</label><input id="f-email" oninput="Formda.app.onField(\'email\', this.value)"></div>' +
        '</div>' +
        '<div class="field"><label>주소</label><input id="f-addr" oninput="Formda.app.onField(\'addr\', this.value)"></div>' +
        '<div class="field"><label>증명사진 (선택)</label>' +
          '<div class="seal-upload"><label class="seal-btn" for="f-photo">이미지 업로드</label>' +
            '<input id="f-photo" type="file" accept="image/*" onchange="Formda.app.onPhoto(this)" hidden>' +
            '<button class="seal-clear" type="button" onclick="Formda.app.clearPhoto()">제거</button></div>' +
          '<div class="seal-name" id="photoName"></div></div>' +
      '</div>' +
      '<div class="form-sec"><h2>학력사항</h2>' +
        '<table class="items"><colgroup><col style="width:30%"><col style="width:28%"><col style="width:24%"><col style="width:13%"><col style="width:5%"></colgroup>' +
          '<thead><tr><th>재학기간</th><th>학교명</th><th>전공·학위</th><th>졸업</th><th></th></tr></thead><tbody id="eduRows"></tbody></table>' +
        '<button class="addrow" id="addEduBtn" type="button" onclick="Formda.app.addEdu()">+ 학력 추가</button></div>' +
      '<div class="form-sec"><h2>경력사항</h2>' +
        '<table class="items"><colgroup><col style="width:26%"><col style="width:24%"><col style="width:22%"><col style="width:23%"><col style="width:5%"></colgroup>' +
          '<thead><tr><th>근무기간</th><th>회사명</th><th>직위·부서</th><th>담당업무</th><th></th></tr></thead><tbody id="careerRows"></tbody></table>' +
        '<button class="addrow" id="addCareerBtn" type="button" onclick="Formda.app.addCareer()">+ 경력 추가</button></div>' +
      '<div class="form-sec"><h2>자격·기타</h2>' +
        '<div class="field"><textarea id="f-etc" rows="3" placeholder="자격증, 어학, 수상 경력 등" oninput="Formda.app.onField(\'etc\', this.value)"></textarea></div>' +
        '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
      '</div>';
  }

  function rowsBuilder(list, fields, handler) {
    var calc = root.Formda.calc;
    return list.map(function (it, i) {
      var tds = fields.map(function (f) {
        return '<td><input value="' + calc.esc(it[f] || '') + '" oninput="Formda.app.' + handler + '(' + i + ', \'' + f + '\', this.value)"></td>';
      }).join('');
      return '<tr>' + tds + '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.' +
        (handler === 'onEdu' ? 'delEdu' : 'delCareer') + '(' + i + ')">×</button></td></tr>';
    }).join('');
  }
  function eduRows(list) { return rowsBuilder(list, ['period', 'school', 'major', 'status'], 'onEdu'); }
  function careerRows(list) { return rowsBuilder(list, ['period', 'company', 'role', 'task'], 'onCareer'); }

  function sealField(cfg, label) {
    if (!cfg.showSeal) return '';
    return '<div class="field"><label>' + (label || '도장·서명 이미지 (선택)') + '</label><div class="seal-upload">' +
      '<label class="seal-btn" for="f-seal">이미지 업로드</label>' +
      '<input id="f-seal" type="file" accept="image/*" onchange="Formda.app.onSeal(this)" hidden>' +
      '<button class="seal-clear" type="button" onclick="Formda.app.clearSeal()">제거</button></div>' +
      '<div class="seal-name" id="sealName"></div></div>';
  }
  // 차용증 / 위임장 (legal) - cfg.variant로 분기
  function legalForm(cfg) {
    if (cfg.variant === 'pledge') {
      return '' +
        '<div class="form-sec"><h2>채권자 (받는 사람)</h2>' +
          '<div class="row2">' + lf('crName', '성명', '홍길동') + lf('crId', '주민등록번호 (선택)', '600101-1******') + '</div>' +
          lf('crAddr', '주소', '서울시 ...') +
          lf('crTel', '연락처', '010-0000-0000') +
        '</div>' +
        '<div class="form-sec"><h2>채무자 (지불인)</h2>' +
          '<div class="row2">' + lf('dbName', '성명', '김철수') + lf('dbId', '주민등록번호 (선택)', '900101-1******') + '</div>' +
          lf('dbAddr', '주소', '서울시 ...') +
          lf('dbTel', '연락처', '010-0000-0000') +
          sealField(cfg, '채무자 인감·도장 (선택)') +
        '</div>' +
        '<div class="form-sec"><h2>지불 금액·조건</h2>' +
          '<div class="field"><label>지불 금액 (원, 필수)</label>' +
            '<input id="f-amount" inputmode="numeric" placeholder="3,000,000" oninput="Formda.app.onMoney(\'amount\', this)">' +
            '<p class="field-help">금액은 미리보기에서 한글 정자(일금 ○○○원정)로 자동 변환됩니다.</p></div>' +
          lf('debtReason', '채무 발생 원인 (권장)', '예: 2026년 5월 물품대금 / 2026년 3월 대여금') +
          '<div class="row2">' + lf('dueDate', '지불 기일', '2026-08-31') + lf('repayMethod', '지불 방법', '채권자 명의 계좌로 이체') + '</div>' +
          lf('delayRate', '지연손해금 (연 %, 선택)', '12') +
          '<div class="field"><label>확약 문구 (선택)</label>' +
            '<textarea id="f-body" rows="3" placeholder="비우면 표준 확약 문구가 들어갑니다. 직접 문구를 쓰려면 입력하세요." oninput="Formda.app.onField(\'body\', this.value)"></textarea></div>' +
          '<div class="field"><label>특약사항 (선택)</label>' +
            '<textarea id="f-special" rows="2" placeholder="예) 기일 내 미지불 시 지연손해금을 가산하여 지불한다." oninput="Formda.app.onField(\'special\', this.value)"></textarea></div>' +
          '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
          '<p class="field-help"><b>채무 발생 원인</b>(무슨 돈인지)을 적어 두면 나중에 다툼을 줄일 수 있습니다. 지연손해금은 지나치게 높으면 법원이 감액할 수 있어 통상 연 20% 이내로 정합니다. 강제집행력이 필요하면 지불각서만으로는 부족하고 <b>강제집행 인낙문구가 있는 공정증서(공증)</b>가 필요합니다.</p>' +
        '</div>';
    }
    if (cfg.variant === 'agreement') {
      return '' +
        '<div class="form-sec"><h2>갑 (당사자 1)</h2>' +
          '<div class="row2">' + lf('prName', '성명', '홍길동') + lf('prId', '주민등록번호 (선택)', '600101-1******') + '</div>' +
          lf('prAddr', '주소', '서울시 ...') +
          lf('prTel', '연락처', '010-0000-0000') +
        '</div>' +
        '<div class="form-sec"><h2>을 (당사자 2)</h2>' +
          '<div class="row2">' + lf('agName', '성명', '김철수') + lf('agId', '주민등록번호 (선택)', '900101-1******') + '</div>' +
          lf('agAddr', '주소', '서울시 ...') +
          lf('agTel', '연락처', '010-0000-0000') +
          sealField(cfg, '을 인감·도장 (선택)') +
        '</div>' +
        '<div class="form-sec"><h2>합의 내용</h2>' +
          '<div class="field"><label>합의·각서 내용</label>' +
            '<textarea id="f-content" rows="6" placeholder="1항에 사건을 먼저 특정하세요(일시·장소·내용). 예)\n1. 을은 2026년 5월 1일 발생한 ○○ 건에 대하여 갑에게 금 300만원을 2026년 8월 31일까지 지급한다.\n2. 갑은 위 금액을 지급받고 본 건 손해배상(민사)에 관하여 이의를 제기하지 아니한다." oninput="Formda.app.onField(\'content\', this.value)"></textarea>' +
            '<p class="field-help"><b>사건(일시·장소·내용)을 먼저 특정</b>하고, 금액·기한·위반 시 조치를 조항별로 적으세요. <b>형사 사건 합의</b>라면 형사처벌 감경을 원할 때 "<b>처벌을 원하지 않는다(처벌불원)</b>"를 별도 조항으로 명확히 적어야 합니다(민사 이의 포기만으로는 형사 효과가 없습니다).</p></div>' +
          '<div class="field"><label>맺음 문구 (선택)</label>' +
            '<input id="f-lead" placeholder="비우면 표준 문구가 들어갑니다." oninput="Formda.app.onField(\'lead\', this.value)"></div>' +
          '<div class="field"><label>특약사항 (선택)</label>' +
            '<textarea id="f-special" rows="2" placeholder="예) 본 합의를 위반할 경우 위약금 ○○만원을 지급한다." oninput="Formda.app.onField(\'special\', this.value)"></textarea></div>' +
          '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
          '<p class="field-help">한쪽만 작성하는 각서라면 상대(을)만 채우고 갑은 비워 두어도 됩니다. 중요한 합의는 <b>공증</b>을 권장합니다.</p>' +
        '</div>';
    }
    if (cfg.variant === 'mandate') {
      return '' +
        '<div class="form-sec"><h2>위임인 (본인)</h2>' +
          '<div class="row2">' + lf('prName', '성명', '홍길동') + lf('prId', '주민등록번호', '600101-1******') + '</div>' +
          lf('prAddr', '주소', '서울시 ...') +
          lf('prTel', '연락처', '010-0000-0000') +
        '</div>' +
        '<div class="form-sec"><h2>수임인 (대리인)</h2>' +
          '<div class="row2">' + lf('agName', '성명', '김대리') + lf('agId', '주민등록번호', '900101-1******') + '</div>' +
          lf('agAddr', '주소', '서울시 강남구 ...') +
          '<div class="row2">' + lf('agTel', '연락처', '010-0000-0000') + lf('relation', '위임인과의 관계', '본인의 자녀') + '</div>' +
        '</div>' +
        '<div class="form-sec"><h2>위임 내용</h2>' +
          '<div class="field"><label>위임할 사항</label>' +
            '<textarea id="f-content" rows="5" placeholder="예) ○○구청에서 본인의 주민등록등본·초본 발급 및 수령에 관한 일체의 권한" oninput="Formda.app.onField(\'content\', this.value)"></textarea>' +
            '<p class="field-help">위임 사항을 구체적으로 적을수록 처리 기관에서 인정받기 쉽습니다.</p></div>' +
          '<div class="row2">' + lf('period', '위임 기간 (선택)', '2026-07-01 ~ 2026-07-31') + lf('attach', '첨부서류 (선택)', '인감증명서 1부') + '</div>' +
          lf('date', '작성일자', '', 'date') +
          sealField(cfg, '위임인 인감·도장 (선택)') +
          '<p class="field-help">관공서·금융·부동산 제출 시 인감도장 날인 + <b>인감증명서(3개월 이내) 별도 첨부</b>가 필요합니다.</p>' +
        '</div>';
    }
    if (cfg.variant === 'contentproof') {
      return '' +
        '<div class="form-sec"><h2>발신인 (통고인)</h2>' +
          '<div class="row2">' + lf('srName', '성명', '홍길동') + lf('srId', '주민등록번호 (선택)', '600101-1******') + '</div>' +
          lf('srAddr', '주소', '서울시 ...') +
          lf('srTel', '연락처', '010-0000-0000') +
          sealField(cfg, '발신인 도장·서명 이미지 (선택)') +
        '</div>' +
        '<div class="form-sec"><h2>수신인 (피통고인)</h2>' +
          '<div class="row2">' + lf('rcName', '성명 (필수)', '김철수') + lf('rcId', '주민등록번호 (선택)', '900101-1******') + '</div>' +
          lf('rcAddr', '주소', '서울시 ...') +
          lf('rcTel', '연락처 (선택)', '010-0000-0000') +
          '<p class="field-help">우체국은 <b>수신인 성명 없이 주소만</b> 적으면 내용증명 접수를 받아 주지 않습니다. 성명을 반드시 적으세요.</p>' +
        '</div>' +
        '<div class="form-sec"><h2>통고 내용</h2>' +
          lf('subject', '제목', '물품대금 지급 최고') +
          '<div class="field"><label>청구 금액 (원, 선택)</label>' +
            '<input id="f-amount" inputmode="numeric" placeholder="3,000,000" oninput="Formda.app.onMoney(\'amount\', this)">' +
            '<p class="field-help">금전 청구가 아니면 비워 두세요. 입력하면 한글 정자로 자동 변환됩니다.</p></div>' +
          '<div class="field"><label>본문 (사실관계·요구사항)</label>' +
            '<textarea id="f-content" rows="6" placeholder="예)\n발신인은 2026년 5월 1일 수신인과 물품공급계약을 체결하고 물품을 공급하였으나, 수신인은 대금 300만원을 현재까지 지급하지 않고 있습니다.\n\n이에 발신인은 수신인에게 위 대금을 아래 기한까지 지급하여 주실 것을 통고합니다." oninput="Formda.app.onField(\'content\', this.value)"></textarea>' +
            '<p class="field-help">언제·무슨 일이 있었는지(사실관계)를 먼저 적고, 무엇을 요구하는지를 명확히 적으세요.</p></div>' +
          lf('deadline', '이행기한 (선택)', '', 'date') +
          '<div class="field"><label>유의사항 (선택)</label>' +
            '<textarea id="f-special" rows="2" placeholder="비우면 표준 문구(법적 조치 예고)가 들어갑니다." oninput="Formda.app.onField(\'special\', this.value)"></textarea></div>' +
          '<div class="field"><label>맺음 문구 (선택)</label>' +
            '<input id="f-lead" placeholder="비우면 표준 문구가 들어갑니다." oninput="Formda.app.onField(\'lead\', this.value)"></div>' +
          '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
          '<p class="field-help">내용증명은 <b>동일한 내용 3부</b>(발신인 보관용·수신인 발송용·우체국 보관용)를 만들어 우체국 창구에서 등기로 발송합니다. 상대방에게 도달한 날짜까지 증명하려면 <b>배달증명</b>을 함께 신청하세요.</p>' +
        '</div>';
    }
    if (cfg.variant === 'travelconsent') {
      return '' +
        '<div class="form-sec"><h2>친권자 (동의인)</h2>' +
          '<div class="row2">' + lf('parentName', '성명', '홍길동') + lf('relation', '자녀와의 관계', '부') + '</div>' +
          lf('parentAddr', '주소', '서울시 ...') +
          '<div class="row2">' + lf('parentTel', '연락처', '010-0000-0000') + lf('parentPassport', '여권번호 (선택)', 'M12345678') + '</div>' +
          sealField(cfg, '친권자 도장·서명 이미지 (선택)') +
        '</div>' +
        '<div class="form-sec"><h2>미성년자 (여행자)</h2>' +
          '<div class="row2">' + lf('childName', '성명', '홍서연') + lf('childBirth', '생년월일', '', 'date') + '</div>' +
          lf('childPassport', '여권번호 (선택)', 'M23456789') +
        '</div>' +
        '<div class="form-sec"><h2>동행인</h2>' +
          '<div class="row2">' + lf('compName', '성명', '김이모') + lf('compRelation', '자녀와의 관계·소속', '이모 / 인솔교사 등') + '</div>' +
          '<div class="row2">' + lf('compTel', '연락처', '010-0000-0000') + lf('compPassport', '여권번호 (선택)', '') + '</div>' +
          '<p class="field-help">부모 <b>모두</b>가 함께 여행하면 이 동의서 없이 가족관계증명서만으로 충분합니다. 이 동의서는 부모 중 <b>한 명만</b> 동행하거나, 조부모·친척·인솔교사 등 <b>제3자와</b> 여행할 때 필요합니다.</p>' +
        '</div>' +
        '<div class="form-sec"><h2>여행 정보</h2>' +
          lf('destination', '여행 국가·도시', '태국 방콕') +
          '<div class="row2">' + lf('startDate', '출발일', '', 'date') + lf('endDate', '귀국일', '', 'date') + '</div>' +
          '<div class="row2">' + lf('purpose', '여행 목적 (선택)', '가족 여행 / 어학연수 / 캠프 등') + lf('lodging', '숙소 (선택)', '현지 호텔명') + '</div>' +
        '</div>' +
        '<div class="form-sec"><h2>동의 내용·작성</h2>' +
          '<div class="field"><label>동의 문구 (선택)</label>' +
            '<textarea id="f-content" rows="2" placeholder="비우면 표준 동의 문구가 들어갑니다." oninput="Formda.app.onField(\'content\', this.value)"></textarea></div>' +
          '<div class="field"><label>특이사항 (선택)</label>' +
            '<textarea id="f-special" rows="2" placeholder="예: 비상연락처, 의료행위 동의 여부 등" oninput="Formda.app.onField(\'special\', this.value)"></textarea></div>' +
          lf('date', '작성일자', '', 'date') +
          '<p class="field-help">미국·캐나다·필리핀·베트남·남아공 등 일부 국가는 <b>영문 공증 동의서</b>와 번역·공증된 가족관계증명서를 별도로 요구합니다. 이 도구는 한국어 참고용 양식이므로, 방문국 요구사항은 해당 국가 주한대사관이나 항공사에 여행 최소 2~3주 전 확인하세요.</p>' +
        '</div>';
    }
    return '' +
      '<div class="form-sec"><h2>채권자 (빌려준 사람)</h2>' +
        '<div class="row2">' + lf('crName', '성명', '홍길동') + lf('crId', '주민등록번호', '600101-1******') + '</div>' +
        lf('crAddr', '주소', '서울시 ...') +
        lf('crTel', '연락처', '010-0000-0000') +
      '</div>' +
      '<div class="form-sec"><h2>채무자 (빌린 사람)</h2>' +
        '<div class="row2">' + lf('dbName', '성명', '김철수') + lf('dbId', '주민등록번호', '900101-1******') + '</div>' +
        lf('dbAddr', '주소', '서울시 ...') +
        lf('dbTel', '연락처', '010-0000-0000') +
        sealField(cfg, '채무자 인감·도장 (선택)') +
      '</div>' +
      '<div class="form-sec"><h2>차용 금액·조건</h2>' +
        '<div class="field"><label>차용 금액 (원)</label>' +
          '<input id="f-amount" inputmode="numeric" placeholder="3,000,000" oninput="Formda.app.onMoney(\'amount\', this)">' +
          '<p class="field-help">금액은 미리보기에서 한글 정자(일금 ○○○원정)로 자동 변환됩니다.</p></div>' +
        '<div class="row2">' + lf('rate', '이자율 (연 %)', '5') + lf('dueDate', '변제기일', '2027-06-30') + '</div>' +
        '<div class="row2">' + lf('repayMethod', '변제 방법', '만기 일시 상환') + lf('delayRate', '지연손해금 (연 %, 선택)', '12') + '</div>' +
        '<div class="field"><label>특약사항 (선택)</label>' +
          '<textarea id="f-special" rows="3" placeholder="예) 이자는 매월 말일에 지급한다. 변제기일 도래 전이라도 채무자가 ..." oninput="Formda.app.onField(\'special\', this.value)"></textarea></div>' +
        '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
        '<p class="field-help">이자율은 <b>이자제한법상 연 20%</b>를 넘을 수 없습니다. 강제집행력이 필요하면 공증을 권장합니다.</p>' +
      '</div>';
  }

  // ===== 급여명세서 (payslip) =====
  function payslipForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>회사 정보</h2>' +
        lf('company', '회사명', '폼다 주식회사') +
        '<div class="row2">' + lf('bizNo', '사업자등록번호 (선택)', '123-45-67890') + lf('ceo', '대표자 (선택)', '김폼다') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>근로자 정보</h2>' +
        '<div class="row2">' + lf('empName', '성명', '홍길동') + lf('empDept', '부서 (선택)', '영업팀') + '</div>' +
        '<div class="row2">' + lf('empRank', '직급 (선택)', '대리') + lf('empHireDate', '입사일 (선택)', '2022-03-02') + '</div>' +
        '<div class="row2">' + lf('empNo', '사원번호 (선택)', '2022-017') + lf('empBirth', '생년월일 (선택)', '1993-06-10') + '</div>' +
        '<p class="field-help">급여명세서에는 성명과 함께 <b>생년월일 또는 사원번호</b> 중 하나로 근로자를 특정해야 합니다(근로기준법 시행령 제27조의2).</p>' +
      '</div>' +
      '<div class="form-sec"><h2>귀속·지급</h2>' +
        '<div class="row2">' + lf('payMonth', '귀속 연월', '2026년 6월') +
          '<div class="field"><label>지급일</label><input id="f-payDate" type="date" oninput="Formda.app.onField(\'payDate\', this.value)"></div></div>' +
      '</div>' +
      '<div class="form-sec"><h2>근로시간</h2>' +
        '<div class="row2">' + lf('workDaysN', '근로일수 (일)', '22') + lf('workHoursTotal', '총 근로시간 (시간)', '209') + '</div>' +
        '<div class="row3">' + lf('hoursOT', '연장 (시간)', '0') + lf('hoursNight', '야간 (시간)', '0') + lf('hoursHoliday', '휴일 (시간)', '0') + '</div>' +
        '<p class="field-help">근로일수·총 근로시간수는 급여명세서 <b>법정 필수 기재사항</b>입니다(근로기준법 시행령 제27조의2). 연장·야간·휴일 근로가 있으면 그 시간수도 적어야 하며, 수당 계산식은 아래 비고(계산 방법)에 남기세요.</p>' +
      '</div>' +
      '<div class="form-sec"><h2>지급 항목</h2>' +
        '<table class="items"><colgroup><col style="width:46%"><col style="width:28%"><col style="width:16%"><col style="width:10%"></colgroup>' +
          '<thead><tr><th>항목</th><th>금액</th><th>비과세</th><th></th></tr></thead><tbody id="earnRows"></tbody></table>' +
        '<button class="addrow" id="addEarnBtn" type="button" onclick="Formda.app.addEarn()">+ 지급 항목 추가</button>' +
        '<p class="field-help">식대(월 20만원 한도)·자가운전보조금 등 비과세 항목은 <b>비과세</b>에 체크하세요. 4대보험 자동 계산의 과세 기준에서 제외됩니다.</p>' +
      '</div>' +
      '<div class="form-sec"><h2>공제 항목</h2>' +
        '<div class="ps-auto-bar">' +
          '<button type="button" class="mini-btn" onclick="Formda.app.autoInsurance()">4대보험 자동 계산</button>' +
          '<span class="ps-auto-help">과세 지급액 기준 2026년 근로자 요율로 4대보험을 채웁니다. 값은 수정할 수 있어요.</span>' +
        '</div>' +
        '<table class="items"><colgroup><col style="width:58%"><col style="width:32%"><col style="width:10%"></colgroup>' +
          '<thead><tr><th>항목</th><th>금액</th><th></th></tr></thead><tbody id="deductRows"></tbody></table>' +
        '<button class="addrow" id="addDeductBtn" type="button" onclick="Formda.app.addDeduct()">+ 공제 항목 추가</button>' +
        '<p class="field-help">소득세는 근로소득 간이세액표(부양가족 수에 따라 다름)를 따르며, 지방소득세는 소득세의 10%입니다. 국민연금은 기준소득월액 상·하한이 적용될 수 있어 자동값과 다를 수 있습니다.</p>' +
      '</div>' +
      '<details class="form-opt"><summary>선택 항목 (직인·비고)</summary>' +
        sealField(cfg, '회사 직인 이미지 (선택)') +
        '<div class="field"><label>계산 방법·비고</label>' +
          '<textarea id="f-note" rows="3" placeholder="예: 연장근로수당 = 통상시급 × 1.5 × 연장근로시간. 식대 20만원은 비과세." oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
      '</details>';
  }
  function payslipEarnRows(list) {
    var calc = root.Formda.calc;
    return (list || []).map(function (it, i) {
      var amt = it.amount ? it.amount.toLocaleString('ko-KR') : '';
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name || '') + '" placeholder="예: 기본급" oninput="Formda.app.onEarn(' + i + ', this.value)"></td>' +
        '<td><input inputmode="numeric" value="' + amt + '" placeholder="0" oninput="Formda.app.onEarnAmt(' + i + ', this)"></td>' +
        '<td class="ps-tf"><label><input type="checkbox" ' + (it.taxfree ? 'checked' : '') + ' onchange="Formda.app.onEarnTax(' + i + ', this.checked)">비과세</label></td>' +
        '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.delEarn(' + i + ')">×</button></td>' +
        '</tr>';
    }).join('');
  }
  function payslipDeductRows(list) {
    var calc = root.Formda.calc;
    return (list || []).map(function (it, i) {
      var amt = it.amount ? it.amount.toLocaleString('ko-KR') : '';
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name || '') + '" placeholder="예: 국민연금" oninput="Formda.app.onDeduct(' + i + ', this.value)"></td>' +
        '<td><input inputmode="numeric" value="' + amt + '" placeholder="0" oninput="Formda.app.onDeductAmt(' + i + ', this)"></td>' +
        '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.delDeduct(' + i + ')">×</button></td>' +
        '</tr>';
    }).join('');
  }

  // ===== 근로계약서 (contract) - 고용노동부 표준근로계약서 =====
  function insChk(id, label) {
    return '<label class="ec-chk"><input type="checkbox" id="f-' + id + '" onchange="Formda.app.onCheck(\'' + id + '\', this.checked)">' + label + '</label>';
  }
  function serviceContractForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>갑 (발주자)</h2>' +
        '<div class="row2">' + lf('coName', '상호(성명)', '폼다 주식회사') + lf('coRegNo', '사업자등록번호 (선택)', '123-45-67890') + '</div>' +
        '<div class="row2">' + lf('coCeo', '대표자', '김폼다') + lf('coTel', '연락처', '02-1234-5678') + '</div>' +
        lf('coAddr', '주소', '서울시 강남구 테헤란로 1') +
      '</div>' +
      '<div class="form-sec"><h2>을 (프리랜서)</h2>' +
        '<div class="row2">' + lf('frName', '성명(상호)', '홍길동') + lf('frRegNo', '사업자등록번호 (선택)', '123-45-67890') + '</div>' +
        lf('frAddr', '주소', '서울시 ...') +
        lf('frTel', '연락처', '010-0000-0000') +
      '</div>' +
      '<div class="form-sec"><h2>용역 내용·기간</h2>' +
        '<div class="field"><label>용역의 내용</label>' +
          '<textarea id="f-scope" rows="3" placeholder="예: 회사 홈페이지 리뉴얼 디자인 및 퍼블리싱 (메인 1종, 서브 4종)" oninput="Formda.app.onField(\'scope\', this.value)"></textarea></div>' +
        '<div class="row2">' + lf('startDate', '용역개시일', '', 'date') + lf('endDate', '용역종료일 (선택)', '', 'date') + '</div>' +
        '<p class="field-help">용역종료일을 비우면 "용역 완료 시까지"로 표기됩니다.</p>' +
        lf('workplace', '수행 장소 (선택)', '재택 (필요 시 발주자 사무실)') +
      '</div>' +
      '<div class="form-sec"><h2>용역대금</h2>' +
        '<div class="field"><label>용역대금 (원)</label>' +
          '<input id="f-amount" inputmode="numeric" placeholder="3,000,000" oninput="Formda.app.onMoney(\'amount\', this)">' +
          '<p class="field-help">금액은 미리보기에서 한글 정자로 자동 변환됩니다.</p></div>' +
        lf('paySchedule', '지급 일정', '계약체결 시 50%, 결과물 납품·검수 완료 후 50%') +
        insChk('withhold', '사업소득세 3.3% 원천징수 후 지급') +
        '<p class="field-help">프리랜서(개인사업자)에게 용역대금을 지급할 때는 원천징수의무자인 발주자가 지급액에서 사업소득세 3.3%(소득세 3% + 지방소득세 0.3%)를 떼고 지급하는 것이 일반적입니다.</p>' +
      '</div>' +
      '<div class="form-sec"><h2>결과물·특약·작성</h2>' +
        '<div class="field"><label>결과물 귀속 추가사항 (선택)</label>' +
          '<input id="f-ipNote" placeholder="예: 을은 포트폴리오 목적으로 결과물 일부를 공개할 수 있다." oninput="Formda.app.onField(\'ipNote\', this.value)"></div>' +
        '<div class="field"><label>특약사항 (선택)</label>' +
          '<textarea id="f-note" rows="2" placeholder="추가로 정할 사항이 있으면 적으세요." oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
        lf('date', '계약일자', '', 'date') +
        sealField(cfg, '갑 도장·서명 이미지 (선택)') +
        '<p class="field-help">이 계약은 여러 업종에 두루 쓸 수 있는 <b>참고용 일반 양식</b>입니다. 소프트웨어 분야처럼 관계 부처가 만든 업종별 공식 표준계약서(예: 과학기술정보통신부 SW종사자 표준계약서)가 있다면 그 표준계약서를 우선 확인하세요. 또한 계약 명칭과 무관하게 근무시간·장소를 구속하고 상당한 지휘·감독을 하는 등 실질적으로 근로자처럼 일하게 하면 근로기준법상 근로자로 인정될 수 있으니 유의하세요.</p>' +
      '</div>';
  }
  function contractForm(cfg) {
    if (cfg.variant === 'service') return serviceContractForm(cfg);
    return '' +
      '<div class="form-sec"><h2>사업주</h2>' +
        '<div class="row2">' + lf('bizName', '사업체명', '폼다 주식회사') + lf('bizRegNo', '사업자등록번호 (선택)', '123-45-67890') + '</div>' +
        '<div class="row2">' + lf('bizCeo', '대표자', '김폼다') + lf('bizTel', '연락처', '02-1234-5678') + '</div>' +
        lf('bizAddr', '주소', '서울시 강남구 테헤란로 1') +
      '</div>' +
      '<div class="form-sec"><h2>근로자</h2>' +
        '<div class="row2">' + lf('wName', '성명', '홍길동') + lf('wBirth', '생년월일', '1995-03-12') + '</div>' +
        lf('wAddr', '주소', '서울시 ...') +
        lf('wTel', '연락처', '010-0000-0000') +
      '</div>' +
      '<div class="form-sec"><h2>근로 조건</h2>' +
        '<div class="row2">' + lf('startDate', '근로개시일', '', 'date') + lf('endDate', '계약종료일 (선택)', '', 'date') + '</div>' +
        '<p class="field-help">계약종료일을 비우면 <b>기간의 정함이 없는(정규직)</b> 계약으로 표기됩니다.</p>' +
        lf('workplace', '근무장소', '본사 사무실') +
        lf('jobDesc', '업무의 내용', '마케팅 기획 및 운영') +
        '<div class="row2">' + lf('workTime', '소정근로시간', '09:00 ~ 18:00') + lf('breakTime', '휴게시간', '12:00 ~ 13:00') + '</div>' +
        '<div class="row2">' + lf('workDays', '근무일', '주 5일 (월~금)') + lf('holiday', '주휴일', '매주 일요일') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>임금</h2>' +
        '<div class="row2">' +
          '<div class="field"><label>임금 형태</label><select id="f-payType" onchange="Formda.app.onField(\'payType\', this.value)">' +
            '<option>월급</option><option>일급</option><option>시급</option></select></div>' +
          '<div class="field"><label>금액 (원)</label><input id="f-payAmount" inputmode="numeric" placeholder="3,000,000" oninput="Formda.app.onMoney(\'payAmount\', this)"></div>' +
        '</div>' +
        '<div class="row2">' + lf('bonus', '상여금 (선택)', '명절 상여 연 200%') + lf('allowance', '기타 제수당 (선택)', '식대 월 20만원') + '</div>' +
        '<div class="row2">' + lf('wageDate', '임금지급일', '매월 25일') +
          '<div class="field"><label>지급방법</label><select id="f-payMethod" onchange="Formda.app.onField(\'payMethod\', this.value)">' +
            '<option>근로자 명의 예금통장에 입금</option><option>근로자에게 직접 지급</option></select></div>' +
        '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>사회보험 · 작성</h2>' +
        '<div class="field"><label>사회보험 적용</label><div class="ec-ins-row">' +
          insChk('insEmploy', '고용보험') + insChk('insInjury', '산재보험') + insChk('insPension', '국민연금') + insChk('insHealth', '건강보험') +
        '</div></div>' +
        lf('date', '작성일자', '', 'date') +
        '<div class="field"><label>특약사항 (선택)</label>' +
          '<textarea id="f-note" rows="2" placeholder="수습기간, 비밀유지 등 추가 약정" oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
        sealField(cfg, '사업주 도장·서명 이미지 (선택)') +
        '<p class="field-help">고용노동부 표준근로계약서를 기초로 한 <b>참고용</b> 양식입니다. 단시간·기간제·연소근로자 등 근로형태에 따라 필수 기재사항이 다를 수 있으니, 체결 전 관련 법령을 확인하세요.</p>' +
      '</div>';
  }

  // ===== 지출결의서 (expense) - 품목행(itemRows)·합계는 business-invoice와 공유 =====
  function expenseForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>기본 정보</h2>' +
        '<div class="row2">' +
          '<div class="field"><label>작성일자</label><input id="f-date" type="date" oninput="Formda.app.onField(\'date\', this.value)"></div>' +
          lf('no', '문서번호', '2026-001') +
        '</div>' +
        '<div class="row2">' + lf('dept', '부서', '경영지원팀') + lf('writer', '작성자', '홍길동') + '</div>' +
        lf('approvers', '결재선 (쉼표로 구분)', '담당,팀장,대표') +
        '<p class="field-help">결재선에 적은 순서대로 상단 결재란이 만들어집니다(예: 담당,팀장,대표). 도장은 인쇄 후 날인하세요.</p>' +
      '</div>' +
      '<div class="form-sec"><h2>지출 내역</h2>' +
        '<table class="items">' +
          '<colgroup><col style="width:34%"><col style="width:40%"><col style="width:21%"><col style="width:5%"></colgroup>' +
          '<thead><tr><th>계정과목</th><th>적요</th><th>금액</th><th></th></tr></thead>' +
          '<tbody id="rows"></tbody>' +
        '</table>' +
        '<button class="addrow" id="addRowBtn" type="button" onclick="Formda.app.addRow()">+ 항목 추가</button>' +
        '<p class="field-help" id="rowLimit" style="display:none">무료는 한 페이지 분량까지 작성할 수 있어요.</p>' +
        '<p class="field-help">지급처(거래처)·지급방법(계좌이체·법인카드 등)이 있으면 적요나 아래 비고에 적으면 결재·정산에 도움이 됩니다.</p>' +
      '</div>' +
      '<details class="form-opt"><summary>선택 항목 (도장·비고)</summary>' +
        sealField(cfg, '작성자 도장·서명 이미지 (선택)') +
        '<div class="field"><label>비고</label>' +
          '<textarea id="f-note" rows="2" placeholder="지출 목적, 첨부(영수증 등) 안내" oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
      '</details>';
  }

  // 지출결의서 항목행: 계정과목·적요·금액만 (수량·단가 개념 없이 금액 직접 입력). qty는 1로 고정.
  function expenseRows(items) {
    var calc = root.Formda.calc;
    return items.map(function (it, i) {
      var priceVal = it.price ? it.price.toLocaleString('ko-KR') : '';
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name) + '" placeholder="계정과목" oninput="Formda.app.onName(' + i + ', this.value)"></td>' +
        '<td><input value="' + calc.esc(it.spec || '') + '" placeholder="적요(내용)" oninput="Formda.app.onSpec(' + i + ', this.value)"></td>' +
        '<td><input inputmode="numeric" value="' + priceVal + '" placeholder="0" oninput="Formda.app.onPrice(' + i + ', this)"></td>' +
        '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.delRow(' + i + ')">×</button></td>' +
        '</tr>';
    }).join('');
  }

  // ===== 업무 인수인계서 (handover) - 항목행은 name(업무)·spec(내용) 재사용 =====
  function handoverForm(cfg) {
    return '' +
      '<div class="form-sec"><h2>인계자 (넘기는 사람)</h2>' +
        lf('hoFrom', '성명', '홍길동') +
        '<div class="row2">' + lf('hoFromDept', '부서', '경영지원팀') + lf('hoFromPos', '직위', '과장') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>인수자 (받는 사람)</h2>' +
        lf('hoTo', '성명', '김철수') +
        '<div class="row2">' + lf('hoToDept', '부서', '경영지원팀') + lf('hoToPos', '직위', '대리') + '</div>' +
      '</div>' +
      '<div class="form-sec"><h2>인수인계 항목</h2>' +
        '<table class="items"><colgroup><col style="width:36%"><col style="width:59%"><col style="width:5%"></colgroup>' +
          '<thead><tr><th>업무 / 구분</th><th>인계 내용 · 진행 현황</th><th></th></tr></thead>' +
          '<tbody id="rows"></tbody></table>' +
        '<button class="addrow" id="addRowBtn" type="button" onclick="Formda.app.addRow()">+ 항목 추가</button>' +
        '<p class="field-help" id="rowLimit" style="display:none">무료는 한 페이지 분량까지 작성할 수 있어요.</p>' +
        '<p class="field-help"><b>진행 중인 건은 [현재 상태 + 다음 조치]</b>를 반드시 적으세요. 함께 넘기는 파일·물품도 한 줄씩 항목으로 추가하면 좋습니다. 비밀번호는 문서에 직접 쓰지 말고 위치만 적으세요.</p>' +
      '</div>' +
      '<div class="form-sec"><h2>일자·확인</h2>' +
        '<div class="row2">' +
          '<div class="field"><label>인수인계일</label><input id="f-hoDate" type="date" oninput="Formda.app.onField(\'hoDate\', this.value)"></div>' +
          lf('hoPeriod', '인수인계 기간 (선택)', '2026-07-01 ~ 2026-07-15') +
        '</div>' +
        '<div class="row2">' + lf('no', '문서번호 (선택)', '2026-001') + lf('hoConfirm', '확인자 (부서장·입회자 등, 선택)', '이부장') + '</div>' +
        '<div class="field"><label>특이사항·비고 (선택)</label>' +
          '<textarea id="f-note" rows="2" placeholder="미결 사항, 주의점 등" oninput="Formda.app.onField(\'note\', this.value)"></textarea></div>' +
        sealField(cfg, '인계자 도장·서명 이미지 (선택)') +
      '</div>';
  }
  function handoverRows(items) {
    var calc = root.Formda.calc;
    return (items || []).map(function (it, i) {
      return '<tr>' +
        '<td><input value="' + calc.esc(it.name) + '" placeholder="업무명" oninput="Formda.app.onName(' + i + ', this.value)"></td>' +
        '<td><input value="' + calc.esc(it.spec || '') + '" placeholder="인계 내용·진행 현황" oninput="Formda.app.onSpec(' + i + ', this.value)"></td>' +
        '<td style="text-align:center"><button class="del" type="button" onclick="Formda.app.delRow(' + i + ')">×</button></td>' +
        '</tr>';
    }).join('');
  }

  root.Formda.formEngine = {
    'business-invoice': businessInvoiceForm,
    'legal': legalForm,
    'payslip': payslipForm,
    'contract': contractForm,
    'expense': expenseForm,
    'handover': handoverForm,
    expenseRows: expenseRows,
    handoverRows: handoverRows,
    payslipEarnRows: payslipEarnRows,
    payslipDeductRows: payslipDeductRows,
    'resume': resumeForm,
    'certificate': certificateForm,
    'notice': noticeForm,
    'card': cardForm,
    'cover-letter': coverLetterForm,
    'career': careerForm,
    qRows: qRows,
    careerExpRows: careerExpRows,
    qcLabel: qcLabel,
    itemRows: itemRows,
    eduRows: eduRows,
    careerRows: careerRows,
  };
})(typeof window !== 'undefined' ? window : this);
