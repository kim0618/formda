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
    return '공백 포함 ' + b.length.toLocaleString('ko-KR') + '자 · 제외 ' + b.replace(/\s/g, '').length.toLocaleString('ko-KR') + '자';
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

  root.Formda.formEngine = {
    'business-invoice': businessInvoiceForm,
    'legal': legalForm,
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
