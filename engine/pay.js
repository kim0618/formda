// 폼다 결제 painted-door 모달 (도구 페이지) - 실결제 없음(사업자등록 전 수요검증)
// 유료 버튼 클릭 -> "곧 출시·알림 신청" 모달 -> 이메일 수집(Web3Forms) + GA 이벤트.
// 클릭=상한 신호, 이메일 전환=진짜 신호. track.js(F.track/F.postLead)에 의존.
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};
  var F = root.Formda;
  var CFG = root.FORMDA_CFG || {};
  var TOOL = root.FORMDA_TOOL || {};
  var docType = TOOL.slug || TOOL.docType || '';

  function won(n) { return (n || 0).toLocaleString('ko-KR'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var SUB_M = CFG.PRICE_SUB || 4900;
  var SUB_Y = CFG.PRICE_SUB_YEAR || 53900;
  var PLANS = {
    single: {
      title: '워터마크 없이 저장', price: CFG.PRICE_SINGLE || 1000, unit: '건당',
      feats: ['하단 폼다 표기·중앙 로고 제거', '고해상도 PDF·PNG 저장', '추가 고급 템플릿'],
      event: 'click_single',
    },
    subscribe: {
      title: '폼다 프리미엄',
      feats: ['워터마크 무제한 제거', '여러 거래처 정보 저장', '품목 프리셋·문서번호 자동 채번', '작성 문서 히스토리·재발행'],
      event: 'click_subscribe',
      periods: [
        { key: 'month', label: '월간', price: SUB_M, unit: '월', sub: '' },
        { key: 'year', label: '연간', tag: '1개월 할인', price: SUB_Y, unit: '년', sub: '' },
      ],
    },
  };

  function priceHTML(price, unit) { return '<b>' + won(price) + '원</b><span>' + esc(unit) + '</span>'; }

  var overlay = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'fd-modal-overlay';
    overlay.innerHTML =
      '<div class="fd-modal" role="dialog" aria-modal="true" aria-labelledby="fdModalTitle">' +
      '<button class="fd-modal-x" type="button" aria-label="닫기">&times;</button>' +
      '<div class="fd-modal-body"></div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.fd-modal-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('on')) close();
    });
    document.body.appendChild(overlay);
  }

  function open(kind) {
    var plan = PLANS[kind] || PLANS.single;
    if (F.track) F.track(plan.event, { doc_type: docType });
    if (!overlay) build();
    var body = overlay.querySelector('.fd-modal-body');
    var feats = plan.feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var hasPeriods = !!plan.periods;
    var p0 = hasPeriods ? plan.periods[0] : null;
    var selPeriod = hasPeriods ? p0.key : '';

    var toggle = hasPeriods
      ? '<div class="fd-period" role="tablist">' + plan.periods.map(function (p, i) {
          return '<button type="button" class="fd-period-opt' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
            esc(p.label) + (p.tag ? '<em>' + esc(p.tag) + '</em>' : '') + '</button>';
        }).join('') + '</div>'
      : '';

    body.innerHTML =
      '<div class="fd-modal-badge">곧 출시</div>' +
      '<h3 id="fdModalTitle">' + esc(plan.title) + '</h3>' +
      toggle +
      '<div class="fd-modal-price">' + priceHTML(hasPeriods ? p0.price : plan.price, hasPeriods ? p0.unit : plan.unit) + '</div>' +
      '<div class="fd-modal-subnote">' + (hasPeriods ? esc(p0.sub) : '') + '</div>' +
      '<ul class="fd-modal-feats">' + feats + '</ul>' +
      '<p class="fd-modal-note">아직 준비 중인 기능이에요. 이메일을 남겨 주시면 <b>출시와 얼리버드 할인</b> 소식을 가장 먼저 알려 드릴게요.</p>' +
      '<form class="fd-modal-form">' +
      '<input type="email" name="email" required placeholder="이메일 주소" autocomplete="email">' +
      '<button type="submit" class="btn btn-primary">출시 알림 신청</button></form>' +
      '<div class="fd-modal-done" hidden>신청 완료! 출시되면 이메일로 알려 드릴게요. 감사합니다 🙌</div>';

    if (hasPeriods) {
      var opts = body.querySelectorAll('.fd-period-opt');
      var priceBox = body.querySelector('.fd-modal-price');
      var subBox = body.querySelector('.fd-modal-subnote');
      Array.prototype.forEach.call(opts, function (btn) {
        btn.addEventListener('click', function () {
          var p = plan.periods[+btn.getAttribute('data-i')];
          Array.prototype.forEach.call(opts, function (b) { b.classList.remove('on'); });
          btn.classList.add('on');
          priceBox.innerHTML = priceHTML(p.price, p.unit);
          subBox.textContent = p.sub || '';
          selPeriod = p.key;
          if (F.track) F.track('select_period', { doc_type: docType, period: p.key });
        });
      });
    }

    var form = body.querySelector('.fd-modal-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (form.email.value || '').trim();
      if (!email) return;
      var btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = '신청 중...';
      var params = { doc_type: docType, plan: kind };
      if (hasPeriods) params.period = selPeriod;
      if (F.track) F.track('submit_email', params);
      var done = function (ok) {
        form.style.display = 'none';
        var el = body.querySelector('.fd-modal-done');
        el.hidden = false;
        el.classList.toggle('err', !ok);
        el.textContent = ok
          ? '신청 완료! 출시되면 이메일로 알려 드릴게요. 감사합니다 🙌'
          : '전송에 실패했어요. jptcalc@naver.com으로 이메일을 보내 주시면 꼭 챙길게요.';
      };
      if (F.postLead) {
        F.postLead({
          type: 'email_signup', plan: kind, period: hasPeriods ? selPeriod : '', doc_type: docType, email: email,
          subject: '[폼다] 출시 알림 신청 - ' + kind + (hasPeriods ? '/' + selPeriod : '') + ' / ' + docType,
        }).then(done).catch(function () { done(false); });
      } else { done(true); }
    });

    overlay.classList.add('on');
    document.body.classList.add('fd-modal-open');
    var inp = body.querySelector('input[name=email]');
    if (inp) setTimeout(function () { inp.focus(); }, 30);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('on');
    document.body.classList.remove('fd-modal-open');
  }

  // 가격 옵션이 화면에 노출되면 view_pricing 1회
  function watchPricing() {
    var el = document.querySelector('.fd-pricing');
    if (!el || !F.track) return;
    var fired = false;
    function fire() { if (!fired) { fired = true; F.track('view_pricing', { doc_type: docType }); } }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { fire(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(el);
    } else { fire(); }
  }

  F.pay = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchPricing);
  else watchPricing();
})(typeof window !== 'undefined' ? window : this);
