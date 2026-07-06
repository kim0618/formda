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
      this.slug = tool.slug || tool.docType;
      this.cfg = tool.doc;
      // 데스크톱 A4 기본 130%. 모바일·가로형(명함)은 폭에 맞게 100%(아니면 폭을 넘어 잘림)
      // 기본 배율 100% = 미리보기 폭을 꽉 채움(회색 여백 최소화). 세로가 길면 스크롤.
      this.userZoom = 1;
      this.MAX_ITEMS = (tool.doc && tool.doc.maxItems) || 14;   // 무료: 문서별 한 페이지 분량
      this.sampleState = this.resolveSample(tool.sample); // 원본 샘플 보관 (샘플 불러오기용)

      // 입력폼 주입 (한 번만)
      var formHost = document.getElementById('formPanel');
      formHost.innerHTML = F.formEngine[this.docType](this.cfg);

      this.applyState(JSON.parse(JSON.stringify(this.sampleState)));
      // 반복 사용: 저장된 내 회사 정보 자동 적용 + 문서번호 자동증가
      var prof = this.loadProfileRaw();
      if (prof && this.docType === 'business-invoice') this.applyProfile(prof);
      this.applyNextDocNo();
      this.updateProfileBar();
      this.bindResize();

      // CSS/폰트 로딩 후 다시 맞춤 (초기 크기 어긋남 방지)
      var self = this;
      if (window.requestAnimationFrame) requestAnimationFrame(function () { self.fitPreview(true); });
      window.addEventListener('load', function () { self.fitPreview(true); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { self.fitPreview(true); });
      }
    },

    resolveSample: function (sample) {
      var s = JSON.parse(JSON.stringify(sample || {}));
      if (s.date === 'today') s.date = new Date().toISOString().slice(0, 10);
      if (this.docType === 'cover-letter') {
        if (!s.items || !s.items.length) s.items = [{ heading: '', body: '' }];
      } else if (this.docType === 'career') {
        if (!s.items || !s.items.length) s.items = [{ company: '', period: '', role: '', body: '' }];
      } else if (this.docType === 'payslip') {
        if (!s.earnings || !s.earnings.length) s.earnings = this.psEarnDefault();
        if (!s.deductions || !s.deductions.length) s.deductions = this.psDeductDefault();
      } else if (this.docType === 'contract') {
        // 반복 행 없음 - 기본값은 sample / clearAll에서 처리
      } else if (!s.items || !s.items.length) {
        s.items = [{ name: '', spec: '', qty: 1, price: 0 }];
      }
      if (this.docType === 'resume') {
        if (!s.edu || !s.edu.length) s.edu = [{ period: '', school: '', major: '', status: '' }];
        if (!s.career || !s.career.length) s.career = [{ period: '', company: '', role: '', task: '' }];
      }
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
      this.setVal('deliveryDate', s.deliveryDate);
      this.setVal('deliveryPlace', s.deliveryPlace);
      this.setVal('paymentTerms', s.paymentTerms);
      this.setVal('payDue', s.payDue);
      this.setVal('payHolder', s.payHolder);
      this.setVal('payAccount', s.payAccount);
      this.setMoney('prevBalance', s.prevBalance);
      this.setMoney('paidAmount', s.paidAmount);
      this.setVal('note', s.note);
      this.setVal('vat', s.vat);
      var nm = document.getElementById('sealName');
      if (nm) nm.textContent = s.sealImg ? '도장 적용됨' : '';
      var fi = document.getElementById('f-seal');
      if (fi) fi.value = '';
      // 이력서 가족 필드 (다른 docType에선 해당 입력칸이 없어 setVal이 자동 무시됨)
      this.setVal('name', s.name);
      this.setVal('birth', s.birth);
      this.setVal('tel', s.tel);
      this.setVal('email', s.email);
      this.setVal('addr', s.addr);
      this.setVal('etc', s.etc);
      // 증명·증서 가족 필드 (해당 입력칸 없으면 setVal 자동 무시)
      this.setVal('dept', s.dept);
      this.setVal('position', s.position);
      this.setVal('period', s.period);
      this.setVal('body', s.body);
      this.setVal('purpose', s.purpose);
      this.setVal('orgName', s.orgName);
      this.setVal('orgCeo', s.orgCeo);
      this.setVal('orgReg', s.orgReg);
      this.setVal('orgTel', s.orgTel);
      this.setVal('orgAddr', s.orgAddr);
      this.setVal('docNo', s.docNo);
      this.setVal('docTitle', s.docTitle);
      this.setVal('hireDate', s.hireDate);
      this.setVal('lastDay', s.lastDay);
      this.setVal('recipient', s.recipient);
      this.setVal('handover', s.handover);
      this.setVal('recipientSub', s.recipientSub);
      this.setVal('orgTitle', s.orgTitle);
      this.setVal('title', s.title);
      this.setVal('sender', s.sender);
      this.setVal('reply', s.reply);
      this.setVal('company', s.company);
      this.setVal('slogan', s.slogan);
      this.setVal('website', s.website);
      var ln = document.getElementById('logoName'); if (ln) ln.textContent = s.logo ? '로고 적용됨' : '';
      this.updateColorSwatch();
      this.setVal('applyTo', s.applyTo);
      this.setVal('contact', s.contact);
      this.setVal('summary', s.summary);
      this.setVal('skills', s.skills);
      // 차용증·위임장 (legal) 가족 필드 (해당 입력칸 없으면 setVal 자동 무시)
      this.setMoney('amount', s.amount);
      this.setVal('rate', s.rate);
      this.setVal('dueDate', s.dueDate);
      this.setVal('repayMethod', s.repayMethod);
      this.setVal('delayRate', s.delayRate);
      this.setVal('debtReason', s.debtReason);
      this.setVal('special', s.special);
      this.setVal('crName', s.crName); this.setVal('crId', s.crId); this.setVal('crAddr', s.crAddr); this.setVal('crTel', s.crTel);
      this.setVal('dbName', s.dbName); this.setVal('dbId', s.dbId); this.setVal('dbAddr', s.dbAddr); this.setVal('dbTel', s.dbTel);
      this.setVal('agName', s.agName); this.setVal('agId', s.agId); this.setVal('agAddr', s.agAddr); this.setVal('agTel', s.agTel);
      this.setVal('relation', s.relation); this.setVal('content', s.content); this.setVal('attach', s.attach); this.setVal('lead', s.lead);
      this.setVal('prName', s.prName); this.setVal('prId', s.prId); this.setVal('prAddr', s.prAddr); this.setVal('prTel', s.prTel);
      // 급여명세서 (payslip) 가족 필드 (해당 입력칸 없으면 setVal 자동 무시)
      this.setVal('bizNo', s.bizNo); this.setVal('ceo', s.ceo);
      this.setVal('empName', s.empName); this.setVal('empDept', s.empDept); this.setVal('empRank', s.empRank);
      this.setVal('empHireDate', s.empHireDate); this.setVal('empNo', s.empNo); this.setVal('empBirth', s.empBirth);
      this.setVal('payMonth', s.payMonth); this.setVal('payDate', s.payDate);
      this.setVal('workDaysN', s.workDaysN); this.setVal('workHoursTotal', s.workHoursTotal);
      this.setVal('hoursOT', s.hoursOT); this.setVal('hoursNight', s.hoursNight); this.setVal('hoursHoliday', s.hoursHoliday);
      // 근로계약서 (contract) 가족 필드
      this.setVal('bizName', s.bizName); this.setVal('bizCeo', s.bizCeo); this.setVal('bizAddr', s.bizAddr); this.setVal('bizTel', s.bizTel);
      this.setVal('bizRegNo', s.bizRegNo);
      this.setVal('wName', s.wName); this.setVal('wBirth', s.wBirth); this.setVal('wAddr', s.wAddr); this.setVal('wTel', s.wTel);
      this.setVal('startDate', s.startDate); this.setVal('endDate', s.endDate);
      this.setVal('workplace', s.workplace); this.setVal('jobDesc', s.jobDesc);
      this.setVal('workTime', s.workTime); this.setVal('breakTime', s.breakTime);
      this.setVal('workDays', s.workDays); this.setVal('holiday', s.holiday);
      this.setVal('payType', s.payType); this.setMoney('payAmount', s.payAmount);
      this.setVal('bonus', s.bonus); this.setVal('allowance', s.allowance);
      this.setVal('wageDate', s.wageDate); this.setVal('payMethod', s.payMethod);
      this.setCheck('insEmploy', s.insEmploy); this.setCheck('insInjury', s.insInjury);
      this.setCheck('insPension', s.insPension); this.setCheck('insHealth', s.insHealth);
      // 지출결의서 (expense) 가족 필드 (dept·no·date·note는 위에서 처리)
      this.setVal('writer', s.writer); this.setVal('approvers', s.approvers);
      // 인수인계서 (handover) 가족 필드
      this.setVal('hoFrom', s.hoFrom); this.setVal('hoFromDept', s.hoFromDept); this.setVal('hoFromPos', s.hoFromPos);
      this.setVal('hoTo', s.hoTo); this.setVal('hoToDept', s.hoToDept); this.setVal('hoToPos', s.hoToPos);
      this.setVal('hoDate', s.hoDate); this.setVal('hoPeriod', s.hoPeriod); this.setVal('hoConfirm', s.hoConfirm);
      this.drawEarn();
      this.drawDeduct();
      this.drawQ();
      this.drawExp();
      var pn = document.getElementById('photoName');
      if (pn) pn.textContent = s.photo ? '사진 적용됨' : '';
      this.drawRows();
      this.drawEdu();
      this.drawCareer();
      this.renderDoc();
    },

    loadSample: function () {
      this.applyState(JSON.parse(JSON.stringify(this.sampleState)));
    },

    clearAll: function () {
      if (this.docType === 'cover-letter') {
        this.applyState({ name: '', applyTo: '', items: [{ heading: '', body: '' }] });
        return;
      }
      if (this.docType === 'career') {
        this.applyState({ name: '', contact: '', summary: '', skills: '', items: [{ company: '', period: '', role: '', body: '' }] });
        return;
      }
      if (this.docType === 'card') {
        this.applyState({
          company: '', slogan: '', name: '', position: '', dept: '',
          tel: '', email: '', website: '', addr: '', logo: null, cardColor: this.cfg.accent,
        });
        return;
      }
      if (this.docType === 'notice') {
        this.applyState({
          orgName: '', docNo: '', date: this.today(), title: '', body: '', sender: '', reply: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'certificate') {
        this.applyState({
          name: '', birth: '', addr: '', dept: '', position: '', period: '', body: '', purpose: '',
          docNo: '', date: this.today(), orgName: '', orgCeo: '', orgReg: '', orgTel: '', orgAddr: '',
          hireDate: '', lastDay: '', recipient: '', handover: '',
          recipientSub: '', orgTitle: '', docTitle: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'payslip') {
        this.applyState({
          company: '', bizNo: '', ceo: '', empName: '', empDept: '', empRank: '',
          empHireDate: '', empNo: '', empBirth: '', payMonth: '', payDate: this.today(),
          workDaysN: '', workHoursTotal: '', hoursOT: '', hoursNight: '', hoursHoliday: '',
          earnings: this.psEarnDefault(), deductions: this.psDeductDefault(), note: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'expense') {
        this.applyState({
          date: this.today(), no: '', dept: '', writer: '', approvers: '담당,팀장,대표',
          items: [{ name: '', spec: '', qty: 1, price: 0 }], note: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'handover') {
        this.applyState({
          hoFrom: '', hoFromDept: '', hoFromPos: '', hoTo: '', hoToDept: '', hoToPos: '',
          hoDate: this.today(), hoPeriod: '', no: '', hoConfirm: '',
          items: [{ name: '', spec: '', qty: 1, price: 0 }], note: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'contract') {
        if (this.cfg.variant === 'service') {
          this.applyState({
            coName: '', coRegNo: '', coCeo: '', coAddr: '', coTel: '', frName: '', frRegNo: '', frAddr: '', frTel: '',
            scope: '', startDate: '', endDate: '', workplace: '', amount: 0, paySchedule: '', withhold: true, ipNote: '',
            date: this.today(), note: '', sealImg: null,
          });
          return;
        }
        this.applyState({
          bizName: '', bizRegNo: '', bizCeo: '', bizAddr: '', bizTel: '', wName: '', wBirth: '', wAddr: '', wTel: '',
          startDate: '', endDate: '', workplace: '', jobDesc: '', workTime: '', breakTime: '', workDays: '', holiday: '',
          payType: '월급', payAmount: 0, bonus: '', allowance: '', wageDate: '', payMethod: '근로자 명의 예금통장에 입금',
          insEmploy: true, insInjury: true, insPension: true, insHealth: true,
          date: this.today(), note: '', sealImg: null,
        });
        return;
      }
      if (this.docType === 'resume') {
        this.applyState({
          name: '', birth: '', tel: '', email: '', addr: '', photo: null,
          edu: [{ period: '', school: '', major: '', status: '' }],
          career: [{ period: '', company: '', role: '', task: '' }],
          etc: '', date: this.today(),
        });
        return;
      }
      if (this.docType === 'legal') {
        if (this.cfg.variant === 'mandate') {
          this.applyState({
            agName: '', agId: '', agAddr: '', agTel: '', relation: '', content: '',
            period: '', attach: '', date: this.today(), prName: '', prId: '', prAddr: '', prTel: '', sealImg: null,
          });
        } else if (this.cfg.variant === 'pledge') {
          this.applyState({
            amount: 0, debtReason: '', dueDate: '', repayMethod: '', delayRate: '', body: '', special: '', date: this.today(),
            crName: '', crId: '', crAddr: '', crTel: '', dbName: '', dbId: '', dbAddr: '', dbTel: '', sealImg: null,
          });
        } else if (this.cfg.variant === 'agreement') {
          this.applyState({
            content: '', lead: '', special: '', date: this.today(),
            prName: '', prId: '', prAddr: '', prTel: '', agName: '', agId: '', agAddr: '', agTel: '', sealImg: null,
          });
        } else if (this.cfg.variant === 'contentproof') {
          this.applyState({
            subject: '', amount: 0, content: '', deadline: '', special: '', lead: '', date: this.today(),
            srName: '', srId: '', srAddr: '', srTel: '', rcName: '', rcId: '', rcAddr: '', rcTel: '', sealImg: null,
          });
        } else if (this.cfg.variant === 'travelconsent') {
          this.applyState({
            parentName: '', relation: '', parentAddr: '', parentTel: '', parentPassport: '',
            childName: '', childBirth: '', childPassport: '',
            compName: '', compRelation: '', compTel: '', compPassport: '',
            destination: '', startDate: '', endDate: '', purpose: '', lodging: '',
            content: '', special: '', date: this.today(), sealImg: null,
          });
        } else {
          this.applyState({
            amount: 0, rate: '', dueDate: '', repayMethod: '', delayRate: '', special: '', body: '', date: this.today(),
            crName: '', crId: '', crAddr: '', crTel: '', dbName: '', dbId: '', dbAddr: '', dbTel: '', sealImg: null,
          });
        }
        return;
      }
      this.applyState({
        date: this.today(), no: '', from: '', fromReg: '', fromCeo: '', fromBiz: '', fromTel: '', fromAddr: '',
        to: '', toReg: '', toCeo: '', toTel: '', toAddr: '', validity: '',
        deliveryDate: '', deliveryPlace: '', paymentTerms: '',
        payDue: '', payHolder: '', payAccount: '', prevBalance: 0, paidAmount: 0,
        items: [{ name: '', spec: '', qty: 1, price: 0 }], vat: '0.1', note: '', sealImg: null,
      });
    },

    // ----- 반복 사용: 내 회사 정보 + 문서번호 (localStorage, 이 브라우저에만 저장) -----
    PROFILE_KEY: 'formda_profile_v1',
    SEAL_KEY: 'formda_seal_v1',
    PROFILE_FIELDS: ['from', 'fromReg', 'fromCeo', 'fromBiz', 'fromTel', 'fromAddr'],
    store: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
    fetch: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    loadProfileRaw: function () { try { return JSON.parse(this.fetch(this.PROFILE_KEY) || 'null'); } catch (e) { return null; } },

    saveProfile: function () {
      var s = this.state, p = {};
      this.PROFILE_FIELDS.forEach(function (k) { p[k] = s[k] || ''; });
      var textOk = this.store(this.PROFILE_KEY, JSON.stringify(p));
      // 도장 이미지는 용량이 커 쿼터를 초과할 수 있으므로 별도 키에 저장한다.
      // 이미지 저장이 실패해도 텍스트 회사정보 저장은 유지되도록 분리.
      var sealOk = true;
      if (s.sealImg) sealOk = this.store(this.SEAL_KEY, s.sealImg);
      else this.remove(this.SEAL_KEY);
      if (textOk && sealOk) this.flashProfile('내 회사 정보를 저장했어요');
      else if (textOk) this.flashProfile('회사 정보는 저장했어요 (도장 이미지는 용량이 커 저장하지 못했어요)');
      else this.flashProfile('저장에 실패했어요');
      this.updateProfileBar();
    },
    applyProfile: function (p) {
      var self = this;
      this.PROFILE_FIELDS.forEach(function (k) { if (p[k] != null) { self.state[k] = p[k]; self.setVal(k, p[k]); } });
      // 도장은 별도 키에서(구버전 프로필의 p.sealImg도 하위호환으로 수용)
      var seal = this.fetch(this.SEAL_KEY) || p.sealImg;
      if (seal) {
        this.state.sealImg = seal;
        var nm = document.getElementById('sealName'); if (nm) nm.textContent = '저장된 도장 적용됨';
      }
      this.renderDoc();
    },
    loadProfile: function () { var p = this.loadProfileRaw(); if (p) { this.applyProfile(p); this.flashProfile('저장된 정보를 불러왔어요'); } },
    clearProfile: function () { this.remove(this.PROFILE_KEY); this.remove(this.SEAL_KEY); this.flashProfile('저장된 정보를 지웠어요'); this.updateProfileBar(); },
    flashProfile: function (msg) {
      var el = document.getElementById('profileStatus'); if (!el) return;
      el.textContent = msg; clearTimeout(this._pf);
      this._pf = setTimeout(function () { el.textContent = ''; }, 2600);
    },
    updateProfileBar: function () {
      var has = !!this.loadProfileRaw();
      var load = document.getElementById('profileLoadBtn'), clr = document.getElementById('profileClearBtn');
      if (load) load.style.display = has ? '' : 'none';
      if (clr) clr.style.display = has ? '' : 'none';
    },
    docnoKey: function () { return 'formda_docno_' + this.slug; },
    nextDocNo: function (s) { return String(s).replace(/(\d+)(\D*)$/, function (_, d, tail) { return String(Number(d) + 1).padStart(d.length, '0') + tail; }); },
    applyNextDocNo: function () {
      var last = this.fetch(this.docnoKey());
      if (last) { var nx = this.nextDocNo(last); this.state.no = nx; this.setVal('no', nx); this.renderDoc(); }
    },
    recordDocNo: function () { if (this.state.no) this.store(this.docnoKey(), this.state.no); },

    setVal: function (id, v) {
      var el = document.getElementById('f-' + id);
      if (el != null && v != null) el.value = v;
    },

    setMoney: function (id, v) {
      var el = document.getElementById('f-' + id);
      if (el) el.value = v ? Number(v).toLocaleString('ko-KR') : '';
    },

    setCheck: function (id, v) {
      var el = document.getElementById('f-' + id);
      if (el) el.checked = !!v;
    },
    onCheck: function (key, checked) { this.state[key] = !!checked; this.renderDoc(); },

    onField: function (id, v) {
      var prev = this.state[id];
      this.state[id] = v;
      this.renderDoc();
      // 캡(max-height) 걸린 본문이 넘치면 입력 거부 → 문서가 밀려 내려가지 않음
      if (this.overflowing()) {
        this.state[id] = prev;
        this.setVal(id, prev == null ? '' : prev);
        this.renderDoc();
      }
    },
    // 캡 걸린 자유 텍스트 영역이 max-height를 넘쳤는지
    overflowing: function () {
      var els = document.querySelectorAll('#doc .nt-body, #doc .aw-body, #doc .ct-letter, #doc .ct-handover, #doc .ct-body, #doc .rs-etc, #doc .qt-note, #doc .lg-content, #doc .lg-special, #doc .ps-note, #doc .ec-note, #doc .ho-note');
      for (var i = 0; i < els.length; i++) {
        if (els[i].scrollHeight > els[i].clientHeight + 2) return true;
      }
      return false;
    },

    onMoney: function (id, el) {
      var c = F.calc.cleanInt(el.value, F.calc.MAX_PRICE_DIGITS);
      this.state[id] = c.value;
      el.value = c.digits ? c.value.toLocaleString('ko-KR') : '';
      this.renderDoc();
    },

    drawRows: function () {
      var host = document.getElementById('rows');
      if (host) {
        host.innerHTML = (this.docType === 'expense')
          ? F.formEngine.expenseRows(this.state.items)   // 지출결의서: 계정과목·적요·금액
          : (this.docType === 'handover')
            ? F.formEngine.handoverRows(this.state.items) // 인수인계서: 업무·인계내용
            : F.formEngine.itemRows(this.state.items);
      }
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

    // ----- 이력서 학력·경력 행 -----
    drawEdu: function () {
      var h = document.getElementById('eduRows');
      if (!h) return;
      h.innerHTML = F.formEngine.eduRows(this.state.edu || []);
      var b = document.getElementById('addEduBtn');
      if (b) b.disabled = (this.state.edu || []).length >= (this.cfg.maxEdu || 4);
    },
    drawCareer: function () {
      var h = document.getElementById('careerRows');
      if (!h) return;
      h.innerHTML = F.formEngine.careerRows(this.state.career || []);
      var b = document.getElementById('addCareerBtn');
      if (b) b.disabled = (this.state.career || []).length >= (this.cfg.maxCareer || 5);
    },
    addEdu: function () {
      if ((this.state.edu || []).length >= (this.cfg.maxEdu || 4)) return;
      this.state.edu.push({ period: '', school: '', major: '', status: '' });
      this.drawEdu(); this.renderDoc();
    },
    delEdu: function (i) {
      this.state.edu.splice(i, 1);
      if (!this.state.edu.length) this.state.edu.push({ period: '', school: '', major: '', status: '' });
      this.drawEdu(); this.renderDoc();
    },
    onEdu: function (i, f, v) { this.state.edu[i][f] = v; this.renderDoc(); },
    addCareer: function () {
      if ((this.state.career || []).length >= (this.cfg.maxCareer || 5)) return;
      this.state.career.push({ period: '', company: '', role: '', task: '' });
      this.drawCareer(); this.renderDoc();
    },
    delCareer: function (i) {
      this.state.career.splice(i, 1);
      if (!this.state.career.length) this.state.career.push({ period: '', company: '', role: '', task: '' });
      this.drawCareer(); this.renderDoc();
    },
    onCareer: function (i, f, v) { this.state.career[i][f] = v; this.renderDoc(); },
    onPhoto: function (input) {
      var file = input.files && input.files[0];
      if (!file) return;
      var self = this, reader = new FileReader();
      reader.onload = function (e) {
        self.state.photo = e.target.result;
        var n = document.getElementById('photoName'); if (n) n.textContent = '사진 적용됨: ' + file.name;
        self.renderDoc();
      };
      reader.readAsDataURL(file);
    },
    clearPhoto: function () {
      this.state.photo = null;
      var n = document.getElementById('photoName'); if (n) n.textContent = '';
      var i = document.getElementById('f-photo'); if (i) i.value = '';
      this.renderDoc();
    },
    // ----- 명함 로고·색상 -----
    onLogo: function (input) {
      var file = input.files && input.files[0];
      if (!file) return;
      var self = this, reader = new FileReader();
      reader.onload = function (e) {
        self.state.logo = e.target.result;
        var n = document.getElementById('logoName'); if (n) n.textContent = '로고 적용됨: ' + file.name;
        self.renderDoc();
      };
      reader.readAsDataURL(file);
    },
    clearLogo: function () {
      this.state.logo = null;
      var n = document.getElementById('logoName'); if (n) n.textContent = '';
      var i = document.getElementById('f-logo'); if (i) i.value = '';
      this.renderDoc();
    },
    setCardColor: function (c) {
      this.state.cardColor = c;
      this.renderDoc();
      this.updateColorSwatch();
    },
    updateColorSwatch: function () {
      var sws = document.querySelectorAll('.cd-sw');
      for (var i = 0; i < sws.length; i++) {
        sws[i].classList.toggle('on', sws[i].getAttribute('data-color') === this.state.cardColor);
      }
    },
    // ----- 자기소개서 문항 + 멀티페이지 -----
    drawQ: function () {
      var h = document.getElementById('qRows');
      if (!h) return;
      h.innerHTML = F.formEngine.qRows(this.state.items || []);
    },
    addQ: function () {
      this.state.items.push({ heading: '', body: '' });
      this.drawQ(); this.renderDoc();
    },
    delQ: function (i) {
      this.state.items.splice(i, 1);
      if (!this.state.items.length) this.state.items.push({ heading: '', body: '' });
      this.drawQ(); this.renderDoc();
    },
    onQHead: function (i, v) { this.state.items[i].heading = v; this.renderDoc(); },
    onQBody: function (i, v) {
      this.state.items[i].body = v;
      var c = document.getElementById('qc-' + i); if (c) c.textContent = F.formEngine.qcLabel(v);
      this.renderDoc();
    },
    // 경력기술서 경력 항목
    drawExp: function () {
      var h = document.getElementById('expRows');
      if (h) h.innerHTML = F.formEngine.careerExpRows(this.state.items || []);
    },
    addExp: function () { this.state.items.push({ company: '', period: '', role: '', body: '' }); this.drawExp(); this.renderDoc(); },
    delExp: function (i) {
      this.state.items.splice(i, 1);
      if (!this.state.items.length) this.state.items.push({ company: '', period: '', role: '', body: '' });
      this.drawExp(); this.renderDoc();
    },
    onExp: function (i, field, v) {
      this.state.items[i][field] = v;
      if (field === 'body') { var c = document.getElementById('qc-' + i); if (c) c.textContent = F.formEngine.qcLabel(v); }
      this.renderDoc();
    },
    // ----- 급여명세서 지급·공제 항목 -----
    psEarnDefault: function () { return [{ name: '기본급', amount: 0, taxfree: false }]; },
    psDeductDefault: function () {
      return ['국민연금', '건강보험', '장기요양보험', '고용보험', '소득세', '지방소득세']
        .map(function (n) { return { name: n, amount: 0 }; });
    },
    drawEarn: function () {
      var h = document.getElementById('earnRows');
      if (!h) return;
      h.innerHTML = F.formEngine.payslipEarnRows(this.state.earnings || []);
      var b = document.getElementById('addEarnBtn');
      if (b) b.disabled = (this.state.earnings || []).length >= (this.cfg.maxRows || 8);
    },
    drawDeduct: function () {
      var h = document.getElementById('deductRows');
      if (!h) return;
      h.innerHTML = F.formEngine.payslipDeductRows(this.state.deductions || []);
      var b = document.getElementById('addDeductBtn');
      if (b) b.disabled = (this.state.deductions || []).length >= (this.cfg.maxRows || 8);
    },
    addEarn: function () {
      if ((this.state.earnings || []).length >= (this.cfg.maxRows || 8)) return;
      this.state.earnings.push({ name: '', amount: 0, taxfree: false });
      this.drawEarn(); this.renderDoc();
    },
    delEarn: function (i) {
      this.state.earnings.splice(i, 1);
      if (!this.state.earnings.length) this.state.earnings.push({ name: '', amount: 0, taxfree: false });
      this.drawEarn(); this.renderDoc();
    },
    onEarn: function (i, v) { this.state.earnings[i].name = v; this.renderDoc(); },
    onEarnAmt: function (i, el) {
      var c = F.calc.cleanInt(el.value, F.calc.MAX_PRICE_DIGITS);
      this.state.earnings[i].amount = c.value;
      el.value = c.digits ? c.value.toLocaleString('ko-KR') : '';
      this.renderDoc();
    },
    onEarnTax: function (i, checked) { this.state.earnings[i].taxfree = !!checked; this.renderDoc(); },
    addDeduct: function () {
      if ((this.state.deductions || []).length >= (this.cfg.maxRows || 8)) return;
      this.state.deductions.push({ name: '', amount: 0 });
      this.drawDeduct(); this.renderDoc();
    },
    delDeduct: function (i) {
      this.state.deductions.splice(i, 1);
      if (!this.state.deductions.length) this.state.deductions.push({ name: '', amount: 0 });
      this.drawDeduct(); this.renderDoc();
    },
    onDeduct: function (i, v) { this.state.deductions[i].name = v; this.renderDoc(); },
    onDeductAmt: function (i, el) {
      var c = F.calc.cleanInt(el.value, F.calc.MAX_PRICE_DIGITS);
      this.state.deductions[i].amount = c.value;
      el.value = c.digits ? c.value.toLocaleString('ko-KR') : '';
      this.renderDoc();
    },
    // 4대보험 자동 계산 - 2026년 근로자 부담 요율(국민연금 4.75% · 건강 3.595% · 장기요양=건강보험료×13.14% · 고용 0.9%)
    // 과세 지급액(비과세 제외)을 공통 기준으로 한 참고값. 실제와 다를 수 있어 수정 가능하게 채운다.
    autoInsurance: function () {
      var base = (this.state.earnings || []).reduce(function (a, it) {
        return a + (it.taxfree ? 0 : (Number(it.amount) || 0));
      }, 0);
      if (base <= 0) { alert('먼저 지급 항목(과세 급여)을 입력한 뒤 눌러 주세요.'); return; }
      // 원단위 절사(10원 미만 버림). Math.round로 부동소수점 오차 보정(예: 3,180,000×0.009=28619.9999… → 28,620).
      var f10 = function (x) { return Math.floor(Math.round(x) / 10) * 10; };
      // 국민연금은 기준소득월액 상·하한 적용(2026.7~2027.6: 상한 659만·하한 41만). 건강·고용은 미적용.
      var npBase = Math.min(Math.max(base, 410000), 6590000);
      var hi = f10(base * 0.03595);
      var ins = [
        { name: '국민연금', amount: f10(npBase * 0.0475) },
        { name: '건강보험', amount: hi },
        { name: '장기요양보험', amount: f10(hi * 0.1314) },
        { name: '고용보험', amount: f10(base * 0.009) },
      ];
      // 기존 4대보험 행은 교체하고, 소득세·지방소득세·기타 공제는 뒤에 보존
      var others = (this.state.deductions || []).filter(function (it) {
        var nm = (it.name || '').replace(/\s/g, '');
        return !/(국민연금|건강보험|장기요양|고용보험)/.test(nm) && (it.name || it.amount);
      });
      this.state.deductions = ins.concat(others);
      this.drawDeduct(); this.renderDoc();
    },

    // 본문(.cl-flow 블록)을 A4 페이지 높이(1011px)로 패킹해 여러 .doc-page로 분할
    paginateFlow: function () {
      var doc = document.getElementById('doc');
      var flow = doc.querySelector('.cl-flow');
      if (!flow) return;
      var kids = Array.prototype.slice.call(flow.children);
      if (!kids.length) return;
      var CONTENT_H = 1011, MAX_PAGES = 20;
      function hasCls(el, cls) { return (' ' + (el.className || '') + ' ').indexOf(' ' + cls + ' ') !== -1; }
      function heightOf(el) {
        var st = window.getComputedStyle(el);
        return el.offsetHeight + (parseFloat(st.marginTop) || 0) + (parseFloat(st.marginBottom) || 0);
      }
      // 제목(cl-q 문항/섹션 라벨, cl-exp 경력 항목)이 페이지 경계에서 본문과 분리되지 않도록,
      // 제목부터 다음 제목 전까지의 본문 단락(cl-p)을 한 그룹으로 묶어 페이지네이션한다.
      var boundaries = [0];
      for (var i = 1; i < kids.length; i++) {
        if (hasCls(kids[i], 'cl-exp') || hasCls(kids[i], 'cl-q')) boundaries.push(i);
      }
      var groups = boundaries.map(function (start, idx) {
        var end = idx + 1 < boundaries.length ? boundaries[idx + 1] : kids.length;
        return kids.slice(start, end);
      });
      var pages = [[]], curH = 0;
      for (var g = 0; g < groups.length; g++) {
        var group = groups[g], gH = 0;
        for (var j = 0; j < group.length; j++) gH += heightOf(group[j]);
        if (curH + gH > CONTENT_H && pages[pages.length - 1].length) {
          // 상한 미만이면 새 페이지로 분할. 상한 도달 시엔 내용을 버리지 않고
          // 마지막 페이지에 계속 쌓아 소실을 방지한다(비정상적으로 긴 문서 방어).
          if (pages.length < MAX_PAGES) { pages.push([]); curH = 0; }
        }
        for (var k = 0; k < group.length; k++) pages[pages.length - 1].push(group[k].outerHTML);
        curH += gH;
      }
      var html = '';
      for (var p = 0; p < pages.length; p++) {
        html += '<div class="doc-page"><div class="doc-fit"><div class="cl-flow">' + pages[p].join('') + '</div></div></div>';
      }
      var sizer = doc.querySelector('.doc-sizer');
      if (sizer) sizer.innerHTML = '<div class="doc-pages">' + html + '</div>';
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
      if (this.cfg.flow) this.paginateFlow();
      this.fitPreview();
    },

    // A4 페이지(794x1123)를 미리보기 박스에 맞춰 스케일 (× 사용자 줌)
    // 데스크톱: 높이에 맞춰 한 장이 통째로 보이게. 모바일: 폭에 맞춰.
    fitPreview: function (remeasure) {
      var host = document.getElementById('doc');
      if (!host) return;
      var sizer = host.querySelector('.doc-sizer');
      var pages = host.querySelector('.doc-pages');
      if (!sizer || !pages) return;
      // 페이지 실제 크기를 읽어 적용 (A4=794×1123, 명함 등 다른 크기도 자동 대응)
      var pageNode = host.querySelector('.doc-page');
      var pw = (pageNode && pageNode.offsetWidth) || 794;
      var ph = (pageNode && pageNode.offsetHeight) || 1123;
      this._pw = pw;
      // 기준 배율은 리사이즈 때만 재측정. 재렌더 때마다 측정하면 스크롤바 등장→폭 축소→더 작아짐 루프 발생.
      if (remeasure || this._base == null) {
        var mobile = window.innerWidth <= 980;
        var prevOv = host.style.overflow;
        host.style.overflow = 'hidden';   // 측정 동안 스크롤바 영향 제거
        var availW = host.clientWidth - (mobile ? 0 : 36);
        var availH = host.clientHeight - 36;
        host.style.overflow = prevOv;
        if (availW <= 0) return;
        // 세로 문서(A4)는 폭에 맞춰 채워 좌우 회색 여백을 없애고(넘치는 세로는 스크롤),
        // 가로 문서(명함)는 통째로 보이되 패널을 꽉 채워 과하게 커지지 않게 상한을 둔다.
        var base = (ph > pw)
          ? (availW / pw)
          : Math.min(availW / pw, availH / ph, 1.15);
        if (!(base > 0)) base = availW / pw;
        this._base = base;
      }
      var scale = this._base * (this.userZoom || 1);
      pages.style.transformOrigin = 'top left';
      pages.style.transform = 'scale(' + scale + ')';
      sizer.style.width = ((this._pw || 794) * scale) + 'px';
      sizer.style.height = (pages.offsetHeight * scale) + 'px';
      var lbl = document.getElementById('zoomLabel');
      if (lbl) lbl.textContent = Math.round((this.userZoom || 1) * 100) + '%';
    },

    zoomIn: function () { this.userZoom = Math.min((this.userZoom || 1) + 0.1, 2.5); this.fitPreview(); },
    zoomOut: function () { this.userZoom = Math.max((this.userZoom || 1) - 0.1, 0.5); this.fitPreview(); },
    zoomReset: function () { this.userZoom = 1; this.fitPreview(); },

    // ----- 내보내기 -----
    downloadPDF: function (btn) { this.recordDocNo(); this.trackCreate(); F.exporter.downloadPDF(this.cfg.fileName + (this.state.no ? '_' + this.state.no : ''), btn, this.cfg.pageSize); },
    downloadPNG: function (btn) { this.recordDocNo(); this.trackCreate(); F.exporter.downloadPNG(this.cfg.fileName + (this.state.no ? '_' + this.state.no : ''), btn); },
    trackCreate: function () { if (F.trackCreate) F.trackCreate(this.slug || this.docType); },

    // ----- 모바일 탭 -----
    showPane: function (p) {
      document.querySelector('.pane-input').classList.toggle('hide', p !== 'input');
      document.querySelector('.pane-preview').classList.toggle('hide', p !== 'preview');
      document.getElementById('tabInput').classList.toggle('on', p === 'input');
      document.getElementById('tabPreview').classList.toggle('on', p === 'preview');
      if (p === 'preview') this.fitPreview(true);
    },

    bindResize: function () {
      var self = this;
      function sync() {
        var pi = document.querySelector('.pane-input');
        var pp = document.querySelector('.pane-preview');
        if (window.innerWidth > 980) {
          // 데스크톱: 두 패널 동시 표시
          pi.classList.remove('hide');
          pp.classList.remove('hide');
        } else if (!pi.classList.contains('hide') && !pp.classList.contains('hide')) {
          // 모바일 초기/데스크톱→모바일 전환: 둘 다 보이는 상태면 입력 탭만 (둘 다 뜨는 버그 방지)
          self.showPane('input');
        }
        self.fitPreview(true);
      }
      window.addEventListener('resize', sync);
      window.addEventListener('orientationchange', sync);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', sync);
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
