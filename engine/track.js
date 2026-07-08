// 폼다 측정 래퍼 (전 페이지 로드) - GA4 gtag 이벤트 + Web3Forms 리드 수집
// 설정은 window.FORMDA_CFG (shell.mjs head가 data/config.js에서 주입).
// GA_ID/WEB3FORMS_KEY가 비어 있으면 해당 동작은 조용히 no-op (스캐폴딩 단계).
(function (root) {
  'use strict';
  root.Formda = root.Formda || {};
  var F = root.Formda;
  var CFG = root.FORMDA_CFG || {};

  // GA4 이벤트 전송 (gtag 미로드 시 조용히 무시)
  function track(event, params) {
    try {
      if (typeof root.gtag === 'function') root.gtag('event', event, params || {});
    } catch (e) {}
  }

  // Web3Forms로 리드/피드백 전송. 키 없으면 즉시 false (실결제·백엔드 0).
  function postLead(payload) {
    var key = CFG.WEB3FORMS_KEY;
    if (!key) return Promise.resolve(false);
    var body = Object.assign({ access_key: key, from_name: '폼다' }, payload);
    try {
      return fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  // 재방문·반복작성 추적: 다운로드 시 호출. 2회차+엔 repeat_create (구독 신호).
  var CREATE_KEY = 'formda_creates';
  function trackCreate(docType) {
    var n = 0;
    try { n = parseInt(localStorage.getItem(CREATE_KEY) || '0', 10) || 0; } catch (e) {}
    n += 1;
    try { localStorage.setItem(CREATE_KEY, String(n)); } catch (e) {}
    track('create', { doc_type: docType || '', count: n });
    if (n >= 2) track('repeat_create', { doc_type: docType || '', count: n });
  }

  // ---- 플로팅 피드백 버튼 + 모달 (전 페이지) ----
  // 어느 페이지에서 눌렀는지 컨텍스트 태깅 (도구:슬러그 / 카테고리 / 가이드 / 홈)
  function pageContext() {
    try {
      if (root.FORMDA_TOOL && root.FORMDA_TOOL.slug) return 'tool:' + root.FORMDA_TOOL.slug;
      var p = location.pathname;
      var m = p.match(/\/category\/([a-z0-9-]+)\.html/);
      if (m) return m[1];
      if (/\/guides\//.test(p)) return 'guide';
      if (p === '/' || /\/index\.html$/.test(p)) return 'home';
      return 'etc';
    } catch (e) { return 'etc'; }
  }

  var fbOverlay = null;
  function fbBuild() {
    fbOverlay = document.createElement('div');
    fbOverlay.className = 'fd-modal-overlay';
    fbOverlay.innerHTML =
      '<div class="fd-modal fd-modal-wide" role="dialog" aria-modal="true" aria-labelledby="fdFbTitle">' +
      '<button class="fd-modal-x" type="button" aria-label="닫기">&times;</button>' +
      '<div class="fd-modal-badge">의견 보내기</div>' +
      '<h3 id="fdFbTitle">폼다에 바라는 점이 있나요?</h3>' +
      '<p class="fd-modal-note">필요한 문서 요청, 불편한 점, 오류 제보까지 무엇이든 좋아요.<br>남겨 주신 한 줄이 폼다를 개선하는 데 그대로 반영됩니다.</p>' +
      '<form class="fd-modal-form fd-fb-form" novalidate>' +
      '<textarea name="message" rows="3" placeholder="예) 급여명세서도 만들 수 있으면 좋겠어요&#10;예) 견적서에 할인 항목을 넣고 싶어요&#10;예) OO 화면에서 저장이 잘 안 돼요"></textarea>' +
      '<p class="fd-fb-err" hidden>어떤 점이든 좋으니 한 줄 남겨 주세요.</p>' +
      '<input type="email" name="email" placeholder="이메일 (선택 · 반영되면 알려드려요)" autocomplete="email">' +
      '<button type="submit" class="btn btn-primary">보내기</button></form>' +
      '<div class="fd-modal-done" hidden>의견 고맙습니다! 검토해서 반영할게요 🙌</div>';
    fbOverlay.addEventListener('click', function (e) { if (e.target === fbOverlay) fbClose(); });
    fbOverlay.querySelector('.fd-modal-x').addEventListener('click', fbClose);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fbOverlay && fbOverlay.classList.contains('on')) fbClose();
    });
    // 브라우저 기본 검증 팝업 대신 폼다 스타일 인라인 안내 사용
    var ta = fbOverlay.querySelector('textarea[name=message]');
    var err = fbOverlay.querySelector('.fd-fb-err');
    if (ta) ta.addEventListener('input', function () { ta.classList.remove('err'); if (err) err.hidden = true; });
    var form = fbOverlay.querySelector('.fd-fb-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = (form.message.value || '').trim();
      if (!msg) { if (err) err.hidden = false; form.message.classList.add('err'); form.message.focus(); return; }
      var btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = '보내는 중...';
      var ctx = pageContext();
      track('submit_feedback', { context: ctx });
      var done = function (ok) {
        form.style.display = 'none';
        var el = fbOverlay.querySelector('.fd-modal-done');
        el.hidden = false;
        el.classList.toggle('err', !ok);
        el.textContent = ok
          ? '의견 고맙습니다! 검토해서 반영할게요 🙌'
          : '전송에 실패했어요. jptcalc@naver.com으로 직접 보내 주시면 꼭 확인할게요.';
      };
      postLead({
        type: 'tool_request', context: ctx, message: msg, email: (form.email.value || '').trim(),
        subject: '[폼다] 도구 요청/피드백 - ' + ctx,
      }).then(done).catch(function () { done(false); });
    });
    document.body.appendChild(fbOverlay);
  }
  function fbOpen() {
    if (!fbOverlay) fbBuild();
    var form = fbOverlay.querySelector('.fd-fb-form');
    form.hidden = false;
    form.style.display = '';
    fbOverlay.querySelector('.fd-modal-done').hidden = true;
    var e0 = fbOverlay.querySelector('.fd-fb-err'); if (e0) e0.hidden = true;
    var t0 = form.querySelector('textarea'); if (t0) t0.classList.remove('err');
    var btn = form.querySelector('button'); btn.disabled = false; btn.textContent = '보내기';
    fbOverlay.classList.add('on');
    document.body.classList.add('fd-modal-open');
    track('open_feedback', { context: pageContext() });
    var t = form.querySelector('textarea'); if (t) setTimeout(function () { t.focus(); }, 30);
  }
  function fbClose() {
    if (fbOverlay) { fbOverlay.classList.remove('on'); document.body.classList.remove('fd-modal-open'); }
  }
  function fbInit() {
    if (document.querySelector('.fd-fab')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'fd-fab'; btn.setAttribute('aria-label', '의견 보내기');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.4A8.1 8.1 0 0 1 3.5 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>' +
      '<span>의견</span>';
    btn.addEventListener('click', fbOpen);
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fbInit);
  else fbInit();

  F.track = track;
  F.postLead = postLead;
  F.trackCreate = trackCreate;
  F.feedbackOpen = fbOpen;
})(typeof window !== 'undefined' ? window : this);
