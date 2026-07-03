// 폼다 텍스트 유틸 엔진 - A4 문서가 아닌 순수 클라이언트 유틸 (글자수·로마자·정렬)
// 페이지의 window.FORMDA_TEXT_TOOL = { slug, kind, sample } 를 읽어 #textTool 에 UI를 구성.
(function (root) {
  'use strict';

  // ---------- 한글 로마자 변환 코어 (국립국어원 표기법, 음절 단위) ----------
  // 인명·고유명사는 음절 사이 음운변화를 표기에 반영하지 않으므로 음절별 변환이 표준에 맞다.
  var CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  var JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  var JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

  function romanizeChar(ch) {
    var c = ch.charCodeAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return null;
    return CHO[(c / 588) | 0] + JUNG[((c % 588) / 28) | 0] + JONG[c % 28];
  }
  function romanizeWord(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) { var r = romanizeChar(s[i]); out += (r === null ? s[i] : r); }
    return out;
  }
  // 음절별 로마자 배열 (붙임표 표기용)
  function syllables(s) {
    return Array.prototype.map.call(s, function (ch) { var r = romanizeChar(ch); return r === null ? ch : r; });
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // 성씨 관용 표기 (여권 통용) + 대표 변형
  var SURNAME = {
    '김': 'Kim', '이': 'Lee', '박': 'Park', '최': 'Choi', '정': 'Jung', '강': 'Kang', '조': 'Cho', '윤': 'Yoon',
    '장': 'Jang', '임': 'Lim', '오': 'Oh', '한': 'Han', '신': 'Shin', '서': 'Seo', '권': 'Kwon', '황': 'Hwang',
    '안': 'Ahn', '송': 'Song', '전': 'Jeon', '홍': 'Hong', '유': 'Yoo', '고': 'Ko', '문': 'Moon', '양': 'Yang',
    '손': 'Son', '배': 'Bae', '백': 'Baek', '허': 'Heo', '남': 'Nam', '심': 'Sim', '노': 'Noh', '하': 'Ha',
    '곽': 'Kwak', '성': 'Sung', '차': 'Cha', '주': 'Joo', '우': 'Woo', '구': 'Koo', '민': 'Min', '류': 'Ryu',
    '나': 'Na', '진': 'Jin', '지': 'Ji', '엄': 'Eom', '채': 'Chae', '원': 'Won', '천': 'Cheon', '방': 'Bang',
    '현': 'Hyun', '함': 'Ham', '변': 'Byun', '염': 'Yeom', '여': 'Yeo', '추': 'Chu', '도': 'Do', '소': 'So',
    '석': 'Seok', '선': 'Sun', '설': 'Seol', '마': 'Ma', '길': 'Gil', '연': 'Yeon', '표': 'Pyo', '명': 'Myung',
    '기': 'Ki', '반': 'Ban', '왕': 'Wang', '금': 'Keum', '옥': 'Ok', '육': 'Yook', '인': 'In', '제': 'Je',
    '모': 'Mo', '탁': 'Tak', '국': 'Kook', '어': 'Eo', '은': 'Eun', '편': 'Pyeon', '용': 'Yong', '봉': 'Bong',
  };
  var SURNAME_ALT = {
    '김': ['Kim', 'Gim'], '이': ['Lee', 'Yi', 'Rhee'], '박': ['Park', 'Bak'], '최': ['Choi', 'Choe'],
    '정': ['Jung', 'Jeong', 'Chung'], '조': ['Cho', 'Jo'], '강': ['Kang', 'Gang'], '윤': ['Yoon', 'Yun'],
    '임': ['Lim', 'Im'], '유': ['Yoo', 'Yu'], '장': ['Jang', 'Chang'], '오': ['Oh', 'O'], '신': ['Shin', 'Sin'],
    '권': ['Kwon', 'Gwon'], '안': ['Ahn', 'An'], '전': ['Jeon', 'Chun'], '고': ['Ko', 'Go', 'Koh'],
    '문': ['Moon', 'Mun'], '손': ['Son', 'Sohn'], '백': ['Baek', 'Paik'], '노': ['Noh', 'No', 'Roh'],
    '주': ['Joo', 'Ju'], '우': ['Woo', 'Wu'], '구': ['Koo', 'Gu'], '류': ['Ryu', 'Yoo'],
  };
  function surname(s) {
    if (!s) return { main: '', alts: [] };
    var main = SURNAME[s] || cap(romanizeWord(s));
    var alts = (SURNAME_ALT[s] || [main]).filter(function (x) { return x !== main; });
    return { main: main, alts: alts };
  }

  // ---------- 주소 전용: 인접 음절 간 자음동화·유음화 반영 ----------
  // 인명과 달리 지명·도로명은 실제 발음대로 적어야 한다(예: 종로→Jongno, 왕십리→Wangsimni, 신라→Silla).
  // CHO 인덱스: 2=ㄴ, 5=ㄹ, 6=ㅁ. JONG 문자값 'k'/'t'/'p'=파열음 받침, 'n'/'m'/'ng'=비음 받침, 'l'=유음 받침.
  function jamoIndices(ch) {
    var c = ch.charCodeAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return null;
    return { cho: (c / 588) | 0, jung: ((c % 588) / 28) | 0, jong: c % 28 };
  }
  function romanizeAddrWord(s) {
    var syl = [];
    for (var i = 0; i < s.length; i++) {
      var idx = jamoIndices(s[i]);
      syl.push(idx ? { cho: idx.cho, jung: idx.jung, jongStr: JONG[idx.jong] } : { literal: s[i] });
    }
    for (var k = 0; k < syl.length - 1; k++) {
      var cur = syl[k], nxt = syl[k + 1];
      if (cur.literal || nxt.literal) continue;
      var cj = cur.jongOverride || cur.jongStr;
      if ((cj === 'k' || cj === 't' || cj === 'p') && (nxt.cho === 2 || nxt.cho === 5 || nxt.cho === 6)) {
        // 비음화: ㄱㄷㅂ받침 + ㄴㄹㅁ초성 -> ㅇㄴㅁ받침 (백마->baengma, 왕십리의 '십'->sim)
        cur.jongOverride = cj === 'k' ? 'ng' : (cj === 't' ? 'n' : 'm');
        if (nxt.cho === 5) nxt.choOverride = 'n'; // 뒤따르는 ㄹ도 비음화(왕십리의 '리'->ni)
      } else if ((cj === 'ng' || cj === 'm') && nxt.cho === 5) {
        // ㄹ의 비음화: ㅇㅁ받침 + ㄹ초성 -> ㄹ이 ㄴ으로 (종로->jongno)
        nxt.choOverride = 'n';
      } else if (cj === 'n' && nxt.cho === 5) {
        // 유음화: ㄴ+ㄹ -> ㄹㄹ (신라->silla)
        cur.jongOverride = 'l';
        nxt.choOverride = 'l';
      } else if (cj === 'l' && nxt.cho === 2) {
        // 유음화(역방향): ㄹ+ㄴ -> ㄹㄹ (별내->byeollae)
        nxt.choOverride = 'l';
      }
    }
    var out = '';
    for (var m = 0; m < syl.length; m++) {
      var c2 = syl[m];
      out += c2.literal || ((c2.choOverride || CHO[c2.cho]) + JUNG[c2.jung] + (c2.jongOverride || c2.jongStr));
    }
    return out;
  }

  // ---------- 주소 로마자 변환 (참고용 근사: 국립국어원 표기법 + 도로명 접미사) ----------
  var ADDR_CITY = { '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong' };
  // 긴 접미사 먼저. [한글접미사, 영문, 도시형(접미사 없이 도시명만)]
  var ADDR_SUF = [
    ['특별자치도', '-do'], ['특별자치시', '-si'], ['광역시', '-si', true], ['특별시', '-si', true],
    ['대로', '-daero'], ['로', '-ro'], ['길', '-gil'],
    ['도', '-do'], ['시', '-si'], ['군', '-gun'], ['구', '-gu'],
    ['읍', '-eup'], ['면', '-myeon'], ['동', '-dong'], ['리', '-ri'], ['가', '-ga'],
  ];
  function addrToken(tok) {
    if (/^[0-9][0-9\-]*$/.test(tok)) return { num: true, text: tok };
    for (var i = 0; i < ADDR_SUF.length; i++) {
      var suf = ADDR_SUF[i][0];
      if (tok.length > suf.length && tok.slice(-suf.length) === suf) {
        var base = tok.slice(0, tok.length - suf.length);
        if (ADDR_SUF[i][2] && ADDR_CITY[base]) return { text: ADDR_CITY[base] };   // 서울특별시 → Seoul
        var baseR = ADDR_CITY[base] || cap(romanizeAddrWord(base));
        return { text: baseR + ADDR_SUF[i][1] };
      }
    }
    if (ADDR_CITY[tok]) return { text: ADDR_CITY[tok] };
    return { text: cap(romanizeAddrWord(tok)) };
  }
  function romanizeAddress(s) {
    var toks = s.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return '';
    var parts = [];
    toks.forEach(function (tok) {
      var r = addrToken(tok);
      if (r.num && parts.length) parts[parts.length - 1] = r.text + ' ' + parts[parts.length - 1]; // 번호는 도로명 앞으로
      else parts.push(r.text);
    });
    return parts.reverse().join(', ');   // 작은 단위 → 큰 단위 (영문 순서)
  }

  // ---------- 공통 유틸 ----------
  function comma(n) { return Number(n).toLocaleString('ko-KR'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function copy(str, btn) {
    function done() { if (!btn) return; var t = btn.textContent; btn.textContent = '복사됨'; btn.classList.add('done'); setTimeout(function () { btn.textContent = t; btn.classList.remove('done'); }, 1200); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(str).then(done, function () {});
    else { var ta = document.createElement('textarea'); ta.value = str; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); }
  }
  function bindCopy(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-copy]'), function (b) {
      b.addEventListener('click', function () { copy(b.getAttribute('data-copy'), b); });
    });
  }
  function resultRow(label, value, alts) {
    var altHtml = (alts && alts.length) ? '<div class="tt-alts">다른 표기: ' + alts.map(esc).join(', ') + '</div>' : '';
    return '<div class="tt-row"><div class="tt-row-label">' + esc(label) + '</div>' +
      '<div class="tt-row-main"><span class="tt-val">' + esc(value) + '</span>' +
      '<button class="tt-copy" data-copy="' + esc(value) + '">복사</button></div>' + altHtml + '</div>';
  }
  function resultRowBig(label, value) {
    return '<div class="tt-row big"><div class="tt-row-label">' + esc(label) + '</div>' +
      '<div class="tt-row-main"><span class="tt-val">' + esc(value) + '</span>' +
      '<button class="tt-copy" data-copy="' + esc(value) + '">복사</button></div></div>';
  }

  // ---------- 도구별 렌더 ----------
  var TOOLS = {
    // 글자수 세기
    count: function (host, sample) {
      host.innerHTML =
        '<div class="tt-wrap split">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">텍스트 입력</span>' +
              '<div class="tt-actions"><button class="mini-btn" data-act="sample">샘플</button><button class="mini-btn danger" data-act="clear">비우기</button></div></div>' +
            '<textarea id="ttIn" class="tt-input" placeholder="여기에 글을 입력하거나 붙여넣으면 글자수가 실시간으로 계산됩니다."></textarea>' +
          '</div>' +
          '<div class="tt-side"><div class="tt-stats" id="ttStats"></div></div>' +
        '</div>';
      var ta = host.querySelector('#ttIn');
      function render() {
        var s = ta.value;
        var withSp = Array.from(s).length;
        var noSp = Array.from(s.replace(/\s/g, '')).length;
        var lines = s.length ? s.split(/\r\n|\r|\n/).length : 0;
        var words = s.trim() ? s.trim().split(/\s+/).length : 0;
        var bytes = (typeof Blob !== 'undefined') ? new Blob([s]).size : unescape(encodeURIComponent(s)).length;
        var won = Math.ceil(withSp / 200);
        var stats = [
          ['글자수 (공백 포함)', comma(withSp), true],
          ['글자수 (공백 제외)', comma(noSp)],
          ['공백 수', comma(withSp - noSp)],
          ['단어 수', comma(words)],
          ['줄 수', comma(lines)],
          ['바이트 (UTF-8)', comma(bytes)],
          ['원고지 (200자)', comma(won) + '매'],
        ];
        host.querySelector('#ttStats').innerHTML = stats.map(function (x) {
          return '<div class="tt-stat' + (x[2] ? ' main' : '') + '"><span class="num">' + x[1] + '</span><span class="lbl">' + x[0] + '</span></div>';
        }).join('');
      }
      ta.addEventListener('input', render);
      host.querySelector('[data-act=sample]').addEventListener('click', function () { ta.value = sample.text || ''; render(); ta.focus(); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { ta.value = ''; render(); ta.focus(); });
      render();
    },

    // 영문이름 변환
    'roman-name': function (host, sample) {
      host.innerHTML =
        '<div class="tt-wrap stack">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">한글 이름</span>' +
              '<div class="tt-actions"><button class="mini-btn" data-act="sample">샘플</button><button class="mini-btn danger" data-act="clear">비우기</button></div></div>' +
            '<div class="tt-name-grid">' +
              '<div class="tt-field"><label>성</label><input id="ttSur" placeholder="홍" maxlength="2" autocomplete="off"></div>' +
              '<div class="tt-field"><label>이름</label><input id="ttGiv" placeholder="길동" maxlength="6" autocomplete="off"></div>' +
            '</div>' +
            '<p class="tt-hint">국립국어원 로마자 표기법 기준이며, 성씨는 여권에서 널리 쓰이는 관용 표기를 우선 보여줍니다. 실제 여권 표기는 본인 선택입니다.</p>' +
          '</div>' +
          '<div class="tt-side"><div class="tt-out" id="ttOut"></div></div>' +
        '</div>';
      var out = host.querySelector('#ttOut');
      var sur = host.querySelector('#ttSur'), giv = host.querySelector('#ttGiv');
      function render() {
        var sv = sur.value.trim(), gv = giv.value.trim();
        if (!sv && !gv) { out.innerHTML = '<div class="tt-empty">성과 이름을 입력하면 여권용 로마자 표기가 나옵니다.</div>'; return; }
        var sm = surname(sv);
        var syl = syllables(gv);
        var joined = cap(syl.join(''));
        var hyphen = syl.map(function (x, i) { return i === 0 ? cap(x) : x; }).join('-');
        var spaced = syl.map(cap).join(' ');
        var rows = [];
        if (sv) rows.push(resultRow('성', sm.main, sm.alts));
        if (gv) rows.push(resultRow('이름', joined, [hyphen, spaced].filter(function (x) { return x && x !== joined; })));
        var full1 = (sm.main + ' ' + joined).trim();
        var full2 = (joined + ' ' + sm.main).trim();
        if (sv && gv) { rows.push(resultRowBig('여권·공식 (성 이름)', full1)); rows.push(resultRowBig('영어식 (이름 성)', full2)); }
        out.innerHTML = rows.join('');
        bindCopy(out);
      }
      sur.addEventListener('input', render); giv.addEventListener('input', render);
      host.querySelector('[data-act=sample]').addEventListener('click', function () { sur.value = sample.surname || '홍'; giv.value = sample.given || '길동'; render(); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { sur.value = ''; giv.value = ''; render(); sur.focus(); });
      render();
    },

    // 주소 영문 변환
    'roman-addr': function (host, sample) {
      host.innerHTML =
        '<div class="tt-wrap stack">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">한글 주소 (도로명)</span>' +
              '<div class="tt-actions"><button class="mini-btn" data-act="sample">샘플</button><button class="mini-btn danger" data-act="clear">비우기</button></div></div>' +
            '<textarea id="ttIn" class="tt-input short" placeholder="예: 서울특별시 강남구 테헤란로 152"></textarea>' +
            '<p class="tt-hint">국립국어원 표기법과 도로명주소 접미사(-ro, -gil, -gu 등)를 적용한 참고용 변환입니다. 상세주소·건물명은 직접 보완하세요.</p>' +
          '</div>' +
          '<div class="tt-side"><div class="tt-out" id="ttOut"></div></div>' +
        '</div>';
      var ta = host.querySelector('#ttIn'), out = host.querySelector('#ttOut');
      function render() {
        var v = ta.value.trim();
        if (!v) { out.innerHTML = '<div class="tt-empty">한글 주소를 입력하면 영문 표기가 나옵니다.</div>'; return; }
        var eng = romanizeAddress(v.replace(/\n/g, ' '));
        out.innerHTML = resultRowBig('영문 주소', eng);
        bindCopy(out);
      }
      ta.addEventListener('input', render);
      host.querySelector('[data-act=sample]').addEventListener('click', function () { ta.value = sample.text || '서울특별시 강남구 테헤란로 152'; render(); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { ta.value = ''; render(); ta.focus(); });
      render();
    },

    // QR코드 생성 (qrcodejs 라이브러리 사용, QR 페이지에서만 로드)
    qr: function (host, sample) {
      host.innerHTML =
        '<div class="tt-wrap stack">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">URL 또는 텍스트</span>' +
              '<div class="tt-actions"><button class="mini-btn" data-act="sample">샘플</button><button class="mini-btn danger" data-act="clear">비우기</button></div></div>' +
            '<textarea id="ttIn" class="tt-input short" placeholder="https://... 또는 담을 텍스트를 입력하세요."></textarea>' +
            '<div class="tt-opt-row" style="margin-top:12px">' +
              '<label class="tt-chip"><input type="radio" name="qrsize" value="200">작게</label>' +
              '<label class="tt-chip"><input type="radio" name="qrsize" value="280" checked>보통</label>' +
              '<label class="tt-chip"><input type="radio" name="qrsize" value="400">크게</label>' +
            '</div>' +
            '<p class="tt-hint">생성된 QR은 정적 코드라 만료되지 않습니다. PNG로 저장해 인쇄물·화면 어디에나 쓸 수 있습니다.</p>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="qr-out" id="qrOut"></div>' +
            '<button class="mini-btn qr-dl" id="qrDl" data-act="download" style="display:none">PNG 저장</button>' +
          '</div>' +
        '</div>';
      var ta = host.querySelector('#ttIn'), out = host.querySelector('#qrOut'), dl = host.querySelector('#qrDl');
      function render() {
        out.innerHTML = '';
        var v = ta.value.trim();
        if (!v) { dl.style.display = 'none'; out.innerHTML = '<div class="tt-empty">URL이나 텍스트를 입력하면 QR코드가 생성됩니다.</div>'; return; }
        if (typeof QRCode === 'undefined') { out.innerHTML = '<div class="tt-empty">QR 생성기를 불러오는 중입니다. 잠시 후 다시 시도하세요.</div>'; return; }
        var size = +(((host.querySelector('input[name=qrsize]:checked')) || {}).value) || 280;
        // UTF-8 바이트 길이 (한글 3바이트). 보정레벨 M 기준 약 2,300바이트가 한계 → 넘으면 라이브러리가 에러
        var bytes = (typeof Blob !== 'undefined') ? new Blob([v]).size : v.length;
        try {
          new QRCode(out, { text: v, width: size, height: size, colorDark: '#111111', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
          dl.style.display = '';
        } catch (e) {
          out.innerHTML = '<div class="tt-empty">내용이 너무 깁니다 (' + bytes.toLocaleString('ko-KR') + '바이트). QR코드 용량을 넘었으니 글자 수를 줄여 주세요. 긴 내용은 링크로 만들어 그 주소를 넣는 것이 좋습니다.</div>';
          dl.style.display = 'none';
        }
      }
      ta.addEventListener('input', render);
      Array.prototype.forEach.call(host.querySelectorAll('input[name=qrsize]'), function (el) { el.addEventListener('change', render); });
      host.querySelector('[data-act=sample]').addEventListener('click', function () { ta.value = sample.text || 'https://formda.kr'; render(); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { ta.value = ''; render(); ta.focus(); });
      dl.addEventListener('click', function () {
        var c = out.querySelector('canvas');
        var url = c ? c.toDataURL('image/png') : (out.querySelector('img') || {}).src;
        if (!url) return;
        var a = document.createElement('a'); a.href = url; a.download = 'qrcode.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
      // 라이브러리가 늦게 로드될 수 있어 한 번 더 시도
      if (typeof QRCode === 'undefined') window.addEventListener('load', render);
      render();
    },

    // 텍스트 정렬·정리
    align: function (host, sample) {
      host.innerHTML =
        '<div class="tt-wrap tt-align">' +
          '<div class="tt-bar"><span class="tt-bar-label">텍스트 정렬·정리</span>' +
            '<div class="tt-actions"><button class="mini-btn" data-act="sample">샘플</button><button class="mini-btn danger" data-act="clear">비우기</button></div></div>' +
          '<div class="tt-opts-bar">' +
            '<div class="tt-opt-row">' +
              '<label class="tt-chip"><input type="radio" name="ttsort" value="none" checked>정렬 안 함</label>' +
              '<label class="tt-chip"><input type="radio" name="ttsort" value="asc">오름차순</label>' +
              '<label class="tt-chip"><input type="radio" name="ttsort" value="desc">내림차순</label>' +
            '</div>' +
            '<div class="tt-opt-checks">' +
              '<label class="tt-chk"><input type="checkbox" data-op="trim">앞뒤 공백 제거</label>' +
              '<label class="tt-chk"><input type="checkbox" data-op="blank">빈 줄 제거</label>' +
              '<label class="tt-chk"><input type="checkbox" data-op="dedup">중복 줄 제거</label>' +
              '<label class="tt-chk"><input type="checkbox" data-op="number">줄 번호 매기기</label>' +
            '</div>' +
          '</div>' +
          '<div class="tt-align-cols">' +
            '<div class="tt-col">' +
              '<div class="tt-bar sub"><span class="tt-bar-label">입력 (줄 단위)</span></div>' +
              '<textarea id="ttIn" class="tt-input" placeholder="한 줄에 하나씩 입력하세요."></textarea>' +
            '</div>' +
            '<div class="tt-col">' +
              '<div class="tt-bar sub"><span class="tt-bar-label">결과 <span id="ttCnt" class="tt-cnt"></span></span><button class="mini-btn" data-act="copy">복사</button></div>' +
              '<textarea id="ttOut" class="tt-input tt-output" readonly placeholder="결과가 여기에 표시됩니다."></textarea>' +
            '</div>' +
          '</div>' +
        '</div>';
      var ta = host.querySelector('#ttIn'), out = host.querySelector('#ttOut');
      function op(name) { var el = host.querySelector('[data-op=' + name + ']'); return el && el.checked; }
      function render() {
        var lines = ta.value.split(/\r\n|\r|\n/);
        if (op('trim')) lines = lines.map(function (l) { return l.trim(); });
        if (op('blank')) lines = lines.filter(function (l) { return l.trim() !== ''; });
        if (op('dedup')) { var seen = Object.create(null); lines = lines.filter(function (l) { if (seen[l]) return false; seen[l] = 1; return true; }); }
        var sort = (host.querySelector('input[name=ttsort]:checked') || {}).value;
        if (sort === 'asc') lines.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
        else if (sort === 'desc') lines.sort(function (a, b) { return b.localeCompare(a, 'ko'); });
        if (op('number')) { var w = String(lines.length).length; lines = lines.map(function (l, i) { return (i + 1 + '.').padEnd(w + 1) + ' ' + l; }); }
        out.value = lines.join('\n');
        host.querySelector('#ttCnt').textContent = lines.length ? '(' + lines.length + '줄)' : '';
      }
      ta.addEventListener('input', render);
      Array.prototype.forEach.call(host.querySelectorAll('.tt-opts-bar input'), function (el) { el.addEventListener('change', render); });
      host.querySelector('[data-act=sample]').addEventListener('click', function () { ta.value = sample.text || ''; render(); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { ta.value = ''; render(); ta.focus(); });
      host.querySelector('[data-act=copy]').addEventListener('click', function (e) { copy(out.value, e.currentTarget); });
      render();
    },

    // 이미지 → PDF (여러 장을 한 PDF로. 전부 브라우저에서 처리, 서버 전송 없음)
    'img2pdf': function (host) {
      host.innerHTML =
        '<div class="tt-wrap stack i2p">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">이미지 추가 <span id="i2pCnt" class="tt-cnt"></span></span>' +
              '<div class="tt-actions"><button class="mini-btn danger" data-act="clear">모두 지우기</button></div></div>' +
            '<div class="i2p-drop" id="i2pDrop" tabindex="0" role="button" aria-label="이미지 선택">' +
              '<input type="file" id="i2pFile" accept="image/*" multiple hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<p class="i2p-drop-t">이미지를 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">JPG · PNG · WEBP · GIF · 여러 장 한 번에 · 순서 변경 가능</p>' +
            '</div>' +
            '<div class="i2p-grid" id="i2pGrid"></div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="i2p-opts">' +
              '<div class="i2p-opt"><div class="i2p-opt-h">페이지 크기</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="i2psize" value="a4" checked>A4</label>' +
                '<label class="tt-chip"><input type="radio" name="i2psize" value="letter">Letter</label>' +
                '<label class="tt-chip"><input type="radio" name="i2psize" value="fit">이미지 원본</label>' +
              '</div></div>' +
              '<div class="i2p-opt" id="i2pOriWrap"><div class="i2p-opt-h">방향</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="i2pori" value="auto" checked>자동</label>' +
                '<label class="tt-chip"><input type="radio" name="i2pori" value="p">세로</label>' +
                '<label class="tt-chip"><input type="radio" name="i2pori" value="l">가로</label>' +
              '</div></div>' +
              '<div class="i2p-opt" id="i2pMarWrap"><div class="i2p-opt-h">여백</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="i2pmar" value="0">없음</label>' +
                '<label class="tt-chip"><input type="radio" name="i2pmar" value="10" checked>좁게</label>' +
                '<label class="tt-chip"><input type="radio" name="i2pmar" value="20">넓게</label>' +
              '</div></div>' +
            '</div>' +
            '<button class="mini-btn i2p-make" id="i2pMake" disabled>PDF 만들기</button>' +
            '<p class="tt-hint">여러 장을 추가한 순서대로 한 개의 PDF로 합쳐집니다. 변환은 모두 사용자 브라우저에서 이루어지며, 이미지를 서버로 전송하거나 저장하지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var entries = [];   // { file, name, url, w, h }
      var grid = host.querySelector('#i2pGrid');
      var drop = host.querySelector('#i2pDrop');
      var fileInput = host.querySelector('#i2pFile');
      var makeBtn = host.querySelector('#i2pMake');
      var cntEl = host.querySelector('#i2pCnt');
      var oriWrap = host.querySelector('#i2pOriWrap');
      var marWrap = host.querySelector('#i2pMarWrap');
      var busy = false;

      function opt(name) { return (host.querySelector('input[name=' + name + ']:checked') || {}).value; }

      function fileToEntry(file) {
        return new Promise(function (resolve) {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.onload = function () { resolve({ file: file, name: file.name, url: url, w: img.naturalWidth, h: img.naturalHeight }); };
          img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
          img.src = url;
        });
      }

      function addFiles(list) {
        var arr = Array.prototype.slice.call(list).filter(function (f) {
          return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name);
        });
        if (!arr.length) return;
        Promise.all(arr.map(fileToEntry)).then(function (res) {
          var skipped = 0;
          res.forEach(function (e) { if (e) entries.push(e); else skipped++; });
          render();
          if (skipped) alert(skipped + '개의 파일은 이미지로 읽을 수 없어 제외했습니다. (지원 형식: JPG, PNG, WEBP, GIF)');
        });
      }

      function render() {
        if (!entries.length) {
          grid.innerHTML = '';
          cntEl.textContent = '';
          makeBtn.disabled = true;
          return;
        }
        var last = entries.length - 1;
        grid.innerHTML = entries.map(function (e, i) {
          return '<div class="i2p-item" data-i="' + i + '">' +
            '<div class="i2p-thumb"><img src="' + e.url + '" alt="" loading="lazy"></div>' +
            '<div class="i2p-item-bar">' +
              '<button class="i2p-mv" data-mv="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="앞으로">◀</button>' +
              '<span class="i2p-idx">' + (i + 1) + '</span>' +
              '<button class="i2p-mv" data-mv="1"' + (i === last ? ' disabled' : '') + ' aria-label="뒤로">▶</button>' +
              '<button class="i2p-del" data-del aria-label="삭제">✕</button>' +
            '</div>' +
          '</div>';
        }).join('');
        cntEl.textContent = '(' + entries.length + '장 · PDF 1개로 합쳐집니다)';
        makeBtn.disabled = false;
      }

      grid.addEventListener('click', function (e) {
        var item = e.target.closest('.i2p-item'); if (!item) return;
        var i = +item.getAttribute('data-i');
        if (e.target.closest('[data-del]')) {
          URL.revokeObjectURL(entries[i].url); entries.splice(i, 1); render();
        } else {
          var mv = e.target.closest('[data-mv]'); if (!mv) return;
          var j = i + (+mv.getAttribute('data-mv'));
          if (j < 0 || j >= entries.length) return;
          var t = entries[i]; entries[i] = entries[j]; entries[j] = t; render();
        }
      });

      // 페이지 크기 = '이미지 원본'이면 방향·여백은 의미가 없으므로 비활성
      function syncOpts() {
        var fit = opt('i2psize') === 'fit';
        [oriWrap, marWrap].forEach(function (w) { w.classList.toggle('off', fit); w.querySelectorAll('input').forEach(function (el) { el.disabled = fit; }); });
      }
      host.querySelectorAll('input[name=i2psize]').forEach(function (el) { el.addEventListener('change', syncOpts); });
      syncOpts();

      // 드래그 앤 드롭 + 클릭 선택
      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

      host.querySelector('[data-act=clear]').addEventListener('click', function () {
        entries.forEach(function (e) { URL.revokeObjectURL(e.url); }); entries = []; render();
      });

      // jsPDF는 무겁다(~350KB). 페이지 로드가 아니라 첫 변환 클릭 때 한 번만 지연 로드.
      var jspdfPromise = null;
      function ensureJsPDF() {
        if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
        if (!jspdfPromise) {
          jspdfPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { jspdfPromise = null; reject(new Error('PDF 라이브러리를 불러오지 못했습니다.')); };
            document.head.appendChild(s);
          });
        }
        return jspdfPromise;
      }

      // 각 이미지를 캔버스로 JPEG 변환(투명 배경은 흰색으로). 형식 호환·용량을 안정화.
      var MAX_SIDE = 2400;
      function toJpeg(entry) {
        return new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () {
            var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
            var cw = Math.max(1, Math.round(img.naturalWidth * scale));
            var ch = Math.max(1, Math.round(img.naturalHeight * scale));
            var c = document.createElement('canvas'); c.width = cw; c.height = ch;
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
            resolve({ data: c.toDataURL('image/jpeg', 0.92), w: cw, h: ch });
          };
          img.onerror = function () { reject(new Error(entry.name + ' 변환 실패')); };
          img.src = entry.url;
        });
      }

      async function build() {
        if (busy || !entries.length) return;
        busy = true;
        var label = makeBtn.textContent;
        makeBtn.textContent = 'PDF 만드는 중...'; makeBtn.disabled = true;
        try {
          await ensureJsPDF();
          var jsPDF = window.jspdf.jsPDF;
          var size = opt('i2psize');
          var ori = opt('i2pori') || 'auto';
          var margin = +(opt('i2pmar') || 0);
          var pdf = null;
          for (var i = 0; i < entries.length; i++) {
            var jp = await toJpeg(entries[i]);
            if (size === 'fit') {
              var o = jp.w >= jp.h ? 'l' : 'p';
              var fmt = [jp.w, jp.h];
              if (!pdf) pdf = new jsPDF({ orientation: o, unit: 'px', format: fmt });
              else pdf.addPage(fmt, o);
              pdf.addImage(jp.data, 'JPEG', 0, 0, jp.w, jp.h, undefined, 'FAST');
            } else {
              var fmtName = size === 'letter' ? 'letter' : 'a4';
              var dim = size === 'letter' ? [215.9, 279.4] : [210, 297]; // mm, 세로 기준
              var po = ori === 'auto' ? (jp.w >= jp.h ? 'l' : 'p') : ori;
              var pw = po === 'l' ? dim[1] : dim[0];
              var ph = po === 'l' ? dim[0] : dim[1];
              if (!pdf) pdf = new jsPDF({ orientation: po, unit: 'mm', format: fmtName });
              else pdf.addPage(fmtName, po);
              var cw2 = Math.max(1, pw - margin * 2), ch2 = Math.max(1, ph - margin * 2);
              var r = Math.min(cw2 / jp.w, ch2 / jp.h); // mm per px (여백 안에 비율 유지 맞춤)
              var iw = jp.w * r, ih = jp.h * r;
              pdf.addImage(jp.data, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih, undefined, 'FAST');
            }
          }
          pdf.save('formda-images.pdf');
        } catch (e) {
          alert('PDF 생성 중 오류가 발생했습니다: ' + (e && e.message ? e.message : e));
        } finally {
          makeBtn.textContent = label; makeBtn.disabled = false; busy = false;
        }
      }
      makeBtn.addEventListener('click', build);
      render();
    },

    // PDF 합치기 (여러 PDF를 순서대로 하나로. pdf-lib, 전부 브라우저 처리)
    'pdfmerge': function (host) {
      host.innerHTML =
        '<div class="tt-wrap stack i2p">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">PDF 추가 <span id="pmCnt" class="tt-cnt"></span></span>' +
              '<div class="tt-actions"><button class="mini-btn danger" data-act="clear">모두 지우기</button></div></div>' +
            '<div class="i2p-drop" id="pmDrop" tabindex="0" role="button" aria-label="PDF 선택">' +
              '<input type="file" id="pmFile" accept="application/pdf,.pdf" multiple hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<p class="i2p-drop-t">PDF를 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">여러 개 한 번에 · 순서 변경 가능 · 추가한 순서대로 합쳐집니다</p>' +
            '</div>' +
            '<div class="pdf-list" id="pmList"></div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<button class="mini-btn i2p-make" id="pmMake" disabled>PDF 합치기</button>' +
            '<p class="tt-hint">추가한 순서대로 하나의 PDF로 합쳐집니다. 처리는 모두 사용자 브라우저에서 이루어지며, 파일이 서버로 전송되지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var entries = [];   // { file, name, size, pages }
      var list = host.querySelector('#pmList');
      var drop = host.querySelector('#pmDrop');
      var fileInput = host.querySelector('#pmFile');
      var makeBtn = host.querySelector('#pmMake');
      var cntEl = host.querySelector('#pmCnt');
      var busy = false;

      var pdflibPromise = null;
      function ensurePdfLib() {
        if (window.PDFLib) return Promise.resolve();
        if (!pdflibPromise) {
          pdflibPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { pdflibPromise = null; reject(new Error('PDF 라이브러리를 불러오지 못했습니다.')); };
            document.head.appendChild(s);
          });
        }
        return pdflibPromise;
      }
      function sizeStr(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'; }

      async function addFiles(fileList) {
        var arr = Array.prototype.slice.call(fileList).filter(function (f) {
          return f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        });
        if (!arr.length) return;
        try { await ensurePdfLib(); } catch (e) { alert(e.message); return; }
        var skipped = 0;
        for (var i = 0; i < arr.length; i++) {
          try {
            var bytes = await arr[i].arrayBuffer();
            var doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            entries.push({ file: arr[i], name: arr[i].name, size: arr[i].size, pages: doc.getPageCount() });
          } catch (e) { skipped++; }
        }
        render();
        if (skipped) alert(skipped + '개 파일은 열 수 없어 제외했습니다. (손상되었거나 암호가 걸린 PDF일 수 있습니다)');
      }

      function render() {
        if (!entries.length) { list.innerHTML = ''; cntEl.textContent = ''; makeBtn.disabled = true; return; }
        var last = entries.length - 1, totalPages = 0;
        list.innerHTML = entries.map(function (e, i) {
          totalPages += e.pages;
          return '<div class="pdf-item" data-i="' + i + '">' +
            '<span class="pdf-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/></svg></span>' +
            '<span class="pdf-meta"><span class="pdf-name">' + esc(e.name) + '</span><span class="pdf-sub">' + e.pages + '쪽 · ' + sizeStr(e.size) + '</span></span>' +
            '<span class="pdf-ord"><button class="i2p-mv" data-mv="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="위로">▲</button>' +
              '<button class="i2p-mv" data-mv="1"' + (i === last ? ' disabled' : '') + ' aria-label="아래로">▼</button>' +
              '<button class="i2p-del" data-del aria-label="삭제">✕</button></span>' +
          '</div>';
        }).join('');
        cntEl.textContent = '(' + entries.length + '개 · 총 ' + totalPages + '쪽)';
        makeBtn.disabled = false;
      }

      list.addEventListener('click', function (e) {
        var item = e.target.closest('.pdf-item'); if (!item) return;
        var i = +item.getAttribute('data-i');
        if (e.target.closest('[data-del]')) { entries.splice(i, 1); render(); return; }
        var mv = e.target.closest('[data-mv]'); if (!mv) return;
        var j = i + (+mv.getAttribute('data-mv'));
        if (j < 0 || j >= entries.length) return;
        var t = entries[i]; entries[i] = entries[j]; entries[j] = t; render();
      });

      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { entries = []; render(); });

      async function merge() {
        if (busy || entries.length < 1) return;
        busy = true;
        var label = makeBtn.textContent; makeBtn.textContent = '합치는 중...'; makeBtn.disabled = true;
        try {
          await ensurePdfLib();
          var PDFLib = window.PDFLib;
          var out = await PDFLib.PDFDocument.create();
          for (var i = 0; i < entries.length; i++) {
            var bytes = await entries[i].file.arrayBuffer();
            var src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            var copied = await out.copyPages(src, src.getPageIndices());
            copied.forEach(function (p) { out.addPage(p); });
          }
          var merged = await out.save();
          var blob = new Blob([merged], { type: 'application/pdf' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a'); a.href = url; a.download = 'formda-merged.pdf';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (e) {
          alert('PDF 합치기 중 오류가 발생했습니다: ' + (e && e.message ? e.message : e));
        } finally { makeBtn.textContent = label; makeBtn.disabled = false; busy = false; }
      }
      makeBtn.addEventListener('click', merge);
      render();
    },

    // PDF 분할 (한 PDF에서 페이지 범위 추출 또는 낱장 분리. pdf-lib + 낱장은 JSZip)
    'pdfsplit': function (host) {
      host.innerHTML =
        '<div class="tt-wrap stack i2p">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">PDF 선택 <span id="psCnt" class="tt-cnt"></span></span>' +
              '<div class="tt-actions"><button class="mini-btn danger" data-act="clear">지우기</button></div></div>' +
            '<div class="i2p-drop" id="psDrop" tabindex="0" role="button" aria-label="PDF 선택">' +
              '<input type="file" id="psFile" accept="application/pdf,.pdf" hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<p class="i2p-drop-t">PDF를 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">한 개의 PDF · 원하는 페이지만 추출하거나 낱장으로 분리</p>' +
            '</div>' +
            '<div class="pdf-list" id="psList"></div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="i2p-opts" id="psOpts" style="display:none">' +
              '<div class="i2p-opt"><div class="i2p-opt-h">분할 방식</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="psmode" value="range" checked>페이지 추출</label>' +
                '<label class="tt-chip"><input type="radio" name="psmode" value="each">낱장 분리</label>' +
              '</div></div>' +
              '<div class="i2p-opt" id="psRangeWrap"><div class="i2p-opt-h">추출할 페이지</div>' +
                '<input id="psRange" class="ps-range" placeholder="예: 1-3, 5, 8-10">' +
                '<p class="tt-hint" style="margin-top:6px">쉼표로 여러 범위를 지정합니다. 위 페이지만 골라 한 개의 PDF로 만듭니다.</p></div>' +
              '<p class="tt-hint" id="psEachHint" style="display:none">모든 페이지를 1쪽씩 개별 PDF로 나눠 ZIP으로 내려받습니다.</p>' +
            '</div>' +
            '<button class="mini-btn i2p-make" id="psMake" disabled>분할하기</button>' +
            '<p class="tt-hint">처리는 모두 사용자 브라우저에서 이루어지며, 파일이 서버로 전송되지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var cur = null;   // { name, size, pages, bytes }
      var listEl = host.querySelector('#psList');
      var drop = host.querySelector('#psDrop');
      var fileInput = host.querySelector('#psFile');
      var makeBtn = host.querySelector('#psMake');
      var cntEl = host.querySelector('#psCnt');
      var opts = host.querySelector('#psOpts');
      var rangeWrap = host.querySelector('#psRangeWrap');
      var eachHint = host.querySelector('#psEachHint');
      var rangeInput = host.querySelector('#psRange');
      var busy = false;

      function loadLib(src, glob) {
        if (window[glob]) return Promise.resolve();
        return new Promise(function (resolve, reject) {
          var s = document.createElement('script');
          s.src = src; s.async = true;
          s.onload = resolve;
          s.onerror = function () { reject(new Error('라이브러리를 불러오지 못했습니다.')); };
          document.head.appendChild(s);
        });
      }
      function ensurePdfLib() { return loadLib('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 'PDFLib'); }
      function ensureJsZip() { return loadLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip'); }
      function sizeStr(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'; }

      function opt(name) { return (host.querySelector('input[name=' + name + ']:checked') || {}).value; }
      function mode() { return opt('psmode') || 'range'; }
      function syncMode() {
        var m = mode();
        rangeWrap.style.display = m === 'range' ? '' : 'none';
        eachHint.style.display = m === 'each' ? '' : 'none';
      }

      async function setFile(file) {
        if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return;
        try { await ensurePdfLib(); } catch (e) { alert(e.message); return; }
        try {
          var bytes = await file.arrayBuffer();
          var doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          cur = { name: file.name, size: file.size, pages: doc.getPageCount(), bytes: bytes };
        } catch (e) { alert('PDF를 열 수 없습니다. 손상되었거나 암호가 걸린 파일일 수 있습니다.'); return; }
        render();
      }
      function render() {
        if (!cur) { listEl.innerHTML = ''; cntEl.textContent = ''; opts.style.display = 'none'; makeBtn.disabled = true; return; }
        listEl.innerHTML = '<div class="pdf-item">' +
          '<span class="pdf-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/></svg></span>' +
          '<span class="pdf-meta"><span class="pdf-name">' + esc(cur.name) + '</span><span class="pdf-sub">' + cur.pages + '쪽 · ' + sizeStr(cur.size) + '</span></span></div>';
        cntEl.textContent = '(' + cur.pages + '쪽)';
        opts.style.display = '';
        makeBtn.disabled = false;
        syncMode();
      }

      function parseRanges(str, max) {
        var out = [], seen = {};
        String(str).split(',').forEach(function (part) {
          part = part.trim(); if (!part) return;
          var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
          if (m) {
            var a = +m[1], b = +m[2]; if (a > b) { var t = a; a = b; b = t; }
            for (var p = a; p <= b; p++) { if (p >= 1 && p <= max && !seen[p]) { seen[p] = 1; out.push(p - 1); } }
          } else if (/^\d+$/.test(part)) {
            var n = +part; if (n >= 1 && n <= max && !seen[n]) { seen[n] = 1; out.push(n - 1); }
          }
        });
        return out;
      }

      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) setFile(fileInput.files[0]); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { cur = null; render(); });
      host.querySelectorAll('input[name=psmode]').forEach(function (el) { el.addEventListener('change', syncMode); });

      function saveBlob(blob, name) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }
      async function split() {
        if (busy || !cur) return;
        var m = mode();
        var indices = null;
        if (m === 'range') {
          indices = parseRanges(rangeInput.value, cur.pages);
          if (!indices.length) { alert('추출할 페이지를 올바르게 입력하세요. (예: 1-3, 5) · 이 PDF는 1~' + cur.pages + '쪽입니다.'); return; }
        }
        busy = true;
        var label = makeBtn.textContent; makeBtn.textContent = '처리 중...'; makeBtn.disabled = true;
        try {
          await ensurePdfLib();
          var PDFLib = window.PDFLib;
          var src = await PDFLib.PDFDocument.load(cur.bytes, { ignoreEncryption: true });
          if (m === 'range') {
            var out = await PDFLib.PDFDocument.create();
            var copied = await out.copyPages(src, indices);
            copied.forEach(function (p) { out.addPage(p); });
            saveBlob(new Blob([await out.save()], { type: 'application/pdf' }), 'formda-extracted.pdf');
          } else {
            await ensureJsZip();
            var zip = new window.JSZip();
            var pad = String(cur.pages).length;
            for (var i = 0; i < cur.pages; i++) {
              var one = await PDFLib.PDFDocument.create();
              var pg = await one.copyPages(src, [i]);
              one.addPage(pg[0]);
              var pn = String(i + 1); while (pn.length < pad) pn = '0' + pn;
              zip.file('page-' + pn + '.pdf', await one.save());
            }
            saveBlob(await zip.generateAsync({ type: 'blob' }), 'formda-split.zip');
          }
        } catch (e) {
          alert('PDF 분할 중 오류가 발생했습니다: ' + (e && e.message ? e.message : e));
        } finally { makeBtn.textContent = label; makeBtn.disabled = false; busy = false; }
      }
      makeBtn.addEventListener('click', split);
      render();
    },

    // 증명사진 규격 맞추기 - 사진을 규격 프레임에 이동·확대해 300DPI로 크롭 저장 (배경제거 없음)
    'idphoto': function (host) {
      var PRESETS = [
        { id: 'id34', label: '증명사진 3×4', w: 30, h: 40 },
        { id: 'passport', label: '여권 3.5×4.5', w: 35, h: 45 },
        { id: 'visa2', label: '미국비자 2×2in', w: 50.8, h: 50.8 },
      ];
      var DPI = 300, CW = 320, CH = 420; // 미리보기 캔버스 논리 크기
      host.innerHTML =
        '<div class="tt-wrap stack idp">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">증명사진 만들기</span>' +
              '<div class="tt-actions"><button class="mini-btn" data-act="reopen" style="display:none">다른 사진</button></div></div>' +
            '<div class="i2p-drop" id="idpDrop" tabindex="0" role="button" aria-label="사진 선택">' +
              '<input type="file" id="idpFile" accept="image/*" hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.6"/><path d="m4 17 4.5-4.5L13 17l3-3 4 4"/></svg>' +
              '<p class="i2p-drop-t">사진을 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">얼굴이 정면으로 나온 사진을 올린 뒤 규격에 맞춰 조정하세요</p>' +
            '</div>' +
            '<div class="idp-stage" id="idpStage" style="display:none">' +
              '<canvas id="idpCanvas" width="' + CW + '" height="' + CH + '"></canvas>' +
              '<div class="idp-zoom"><span>축소</span><input type="range" id="idpZoom" min="1" max="3" step="0.01" value="1"><span>확대</span></div>' +
              '<p class="tt-hint">사진을 드래그해 위치를, 슬라이더로 크기를 맞추세요. 파란 테두리 안이 저장 영역입니다.</p>' +
            '</div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="i2p-opts"><div class="i2p-opt"><div class="i2p-opt-h">규격</div><div class="tt-opt-row" id="idpPresets">' +
              PRESETS.map(function (p, i) { return '<label class="tt-chip"><input type="radio" name="idpsize" value="' + i + '"' + (i === 0 ? ' checked' : '') + '>' + p.label + '</label>'; }).join('') +
            '</div></div></div>' +
            '<button class="mini-btn i2p-make" id="idpSave" disabled>사진 저장 (JPG)</button>' +
            '<p class="tt-hint">300DPI 규격 크기(예: 3×4cm=354×472px)로 저장됩니다. 배경은 원본 그대로이며, 사진 처리는 모두 브라우저에서 이루어져 서버로 전송되지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var drop = host.querySelector('#idpDrop');
      var stage = host.querySelector('#idpStage');
      var fileInput = host.querySelector('#idpFile');
      var canvas = host.querySelector('#idpCanvas');
      var ctx = canvas.getContext('2d');
      var zoom = host.querySelector('#idpZoom');
      var saveBtn = host.querySelector('#idpSave');
      var reopenBtn = host.querySelector('[data-act=reopen]');
      var img = null, preset = PRESETS[0];
      var crop = { x: 0, y: 0, w: 0, h: 0 };
      var view = { scale: 1, min: 1, x: 0, y: 0 };

      function computeCrop() {
        var aspect = preset.w / preset.h;                 // 폭/높이
        var maxW = CW * 0.82, maxH = CH * 0.82;
        var w = maxW, h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        crop.w = w; crop.h = h; crop.x = (CW - w) / 2; crop.y = (CH - h) / 2;
      }
      function clamp() {
        view.min = Math.max(crop.w / img.naturalWidth, crop.h / img.naturalHeight);
        if (view.scale < view.min) view.scale = view.min;
        if (view.scale > view.min * 3) view.scale = view.min * 3;
        var dw = img.naturalWidth * view.scale, dh = img.naturalHeight * view.scale;
        // 크롭 창이 이미지 밖으로 나가지 않도록 위치 제한
        view.x = Math.min(crop.x, Math.max(crop.x + crop.w - dw, view.x));
        view.y = Math.min(crop.y, Math.max(crop.y + crop.h - dh, view.y));
      }
      function draw() {
        ctx.clearRect(0, 0, CW, CH);
        ctx.fillStyle = '#eef0f4'; ctx.fillRect(0, 0, CW, CH);
        var dw = img.naturalWidth * view.scale, dh = img.naturalHeight * view.scale;
        ctx.drawImage(img, view.x, view.y, dw, dh);
        // 크롭 밖 어둡게
        ctx.save();
        ctx.fillStyle = 'rgba(20,24,36,.55)';
        ctx.beginPath();
        ctx.rect(0, 0, CW, CH);
        ctx.rect(crop.x, crop.y, crop.w, crop.h);
        ctx.fill('evenodd');
        ctx.restore();
        // 크롭 테두리
        ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
        ctx.strokeRect(crop.x + 1, crop.y + 1, crop.w - 2, crop.h - 2);
      }
      function reset() {
        computeCrop();
        view.min = Math.max(crop.w / img.naturalWidth, crop.h / img.naturalHeight);
        view.scale = view.min;
        view.x = crop.x + (crop.w - img.naturalWidth * view.scale) / 2;
        view.y = crop.y + (crop.h - img.naturalHeight * view.scale) / 2;
        zoom.value = 1; clamp(); draw();
      }
      function setFile(file) {
        if (!file || !/^image\//.test(file.type)) return;
        var url = URL.createObjectURL(file);
        var im = new Image();
        im.onload = function () {
          img = im; drop.style.display = 'none'; stage.style.display = '';
          reopenBtn.style.display = ''; saveBtn.disabled = false;
          reset();
          setTimeout(function () { URL.revokeObjectURL(url); }, 100);
        };
        im.onerror = function () { URL.revokeObjectURL(url); alert('이미지를 열 수 없습니다. 다른 사진을 선택하세요.'); };
        im.src = url;
      }

      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      reopenBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) setFile(fileInput.files[0]); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });

      // 드래그 이동
      var dragging = false, lastX = 0, lastY = 0;
      function pt(e) { var r = canvas.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (CW / r.width), y: (t.clientY - r.top) * (CH / r.height) }; }
      canvas.addEventListener('pointerdown', function (e) { if (!img) return; dragging = true; var p = pt(e); lastX = p.x; lastY = p.y; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', function (e) { if (!dragging) return; var p = pt(e); view.x += p.x - lastX; view.y += p.y - lastY; lastX = p.x; lastY = p.y; clamp(); draw(); });
      canvas.addEventListener('pointerup', function () { dragging = false; });
      canvas.addEventListener('pointercancel', function () { dragging = false; });

      zoom.addEventListener('input', function () {
        if (!img) return;
        var cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2;  // 크롭 중심 기준 확대
        var old = view.scale;
        view.scale = view.min * parseFloat(zoom.value);
        clamp();
        var f = view.scale / old;
        view.x = cx - (cx - view.x) * f; view.y = cy - (cy - view.y) * f;
        clamp(); draw();
      });
      host.querySelectorAll('input[name=idpsize]').forEach(function (el) {
        el.addEventListener('change', function () { preset = PRESETS[+el.value]; if (img) reset(); });
      });

      saveBtn.addEventListener('click', function () {
        if (!img) return;
        var outW = Math.round(preset.w / 25.4 * DPI), outH = Math.round(preset.h / 25.4 * DPI);
        // 크롭 창(캔버스 좌표) → 원본 이미지 좌표
        var sx = (crop.x - view.x) / view.scale, sy = (crop.y - view.y) / view.scale;
        var sw = crop.w / view.scale, sh = crop.h / view.scale;
        var out = document.createElement('canvas'); out.width = outW; out.height = outH;
        var octx = out.getContext('2d');
        octx.fillStyle = '#fff'; octx.fillRect(0, 0, outW, outH);
        octx.imageSmoothingQuality = 'high';
        octx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        var a = document.createElement('a');
        a.href = out.toDataURL('image/jpeg', 0.95);
        a.download = '증명사진_' + preset.w + 'x' + preset.h + '.jpg';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
    },

    // PDF 워터마크 삽입 - 캔버스로 텍스트를 그려 PNG로 만든 뒤 각 페이지에 도장처럼 찍기 (한글 폰트 임베딩 없이 브라우저 렌더링 재사용)
    'pdfwatermark': function (host) {
      host.innerHTML =
        '<div class="tt-wrap stack i2p">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">PDF 선택 <span id="wmCnt" class="tt-cnt"></span></span>' +
              '<div class="tt-actions"><button class="mini-btn danger" data-act="clear">지우기</button></div></div>' +
            '<div class="i2p-drop" id="wmDrop" tabindex="0" role="button" aria-label="PDF 선택">' +
              '<input type="file" id="wmFile" accept="application/pdf,.pdf" hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<p class="i2p-drop-t">PDF를 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">한 개의 PDF · 모든 페이지에 워터마크가 반복해서 찍힙니다</p>' +
            '</div>' +
            '<div class="pdf-list" id="wmList"></div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="i2p-opts" id="wmOpts" style="display:none">' +
              '<div class="i2p-opt"><div class="i2p-opt-h">워터마크 문구</div>' +
                '<input id="wmText" placeholder="예: 대외비" value="대외비" maxlength="20"></div>' +
              '<div class="i2p-opt"><div class="i2p-opt-h">배치</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="wmpos" value="tile" checked>반복(타일)</label>' +
                '<label class="tt-chip"><input type="radio" name="wmpos" value="center">가운데 1개</label>' +
              '</div></div>' +
              '<div class="i2p-opt"><div class="i2p-opt-h">진하기</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="wmop" value="18">연하게</label>' +
                '<label class="tt-chip"><input type="radio" name="wmop" value="32" checked>보통</label>' +
                '<label class="tt-chip"><input type="radio" name="wmop" value="50">진하게</label>' +
              '</div></div>' +
            '</div>' +
            '<button class="mini-btn i2p-make" id="wmMake" disabled>워터마크 넣기</button>' +
            '<p class="tt-hint">처리는 모두 사용자 브라우저에서 이루어지며, 파일이 서버로 전송되지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var cur = null;   // { name, size, pages, bytes }
      var listEl = host.querySelector('#wmList');
      var drop = host.querySelector('#wmDrop');
      var fileInput = host.querySelector('#wmFile');
      var makeBtn = host.querySelector('#wmMake');
      var cntEl = host.querySelector('#wmCnt');
      var opts = host.querySelector('#wmOpts');
      var textInput = host.querySelector('#wmText');
      var busy = false;

      var pdflibPromise = null;
      function ensurePdfLib() {
        if (window.PDFLib) return Promise.resolve();
        if (!pdflibPromise) {
          pdflibPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { pdflibPromise = null; reject(new Error('PDF 라이브러리를 불러오지 못했습니다.')); };
            document.head.appendChild(s);
          });
        }
        return pdflibPromise;
      }
      function sizeStr(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'; }
      function opt(name) { return (host.querySelector('input[name=' + name + ']:checked') || {}).value; }

      async function setFile(file) {
        if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return;
        try { await ensurePdfLib(); } catch (e) { alert(e.message); return; }
        try {
          var bytes = await file.arrayBuffer();
          var doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          cur = { name: file.name, size: file.size, pages: doc.getPageCount(), bytes: bytes };
        } catch (e) { alert('PDF를 열 수 없습니다. 손상되었거나 암호가 걸린 파일일 수 있습니다.'); return; }
        render();
      }
      function render() {
        if (!cur) { listEl.innerHTML = ''; cntEl.textContent = ''; opts.style.display = 'none'; makeBtn.disabled = true; return; }
        listEl.innerHTML = '<div class="pdf-item">' +
          '<span class="pdf-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/></svg></span>' +
          '<span class="pdf-meta"><span class="pdf-name">' + esc(cur.name) + '</span><span class="pdf-sub">' + cur.pages + '쪽 · ' + sizeStr(cur.size) + '</span></span></div>';
        cntEl.textContent = '(' + cur.pages + '쪽)';
        opts.style.display = '';
        makeBtn.disabled = false;
      }

      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) setFile(fileInput.files[0]); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { cur = null; render(); });

      // 워터마크 텍스트는 pdf-lib 표준 폰트가 한글을 지원하지 않아, 브라우저 캔버스로 그린 뒤 PNG로 임베드한다.
      function dataUrlToBytes(dataUrl) {
        var base64 = dataUrl.split(',')[1];
        var bin = atob(base64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
      }
      function makeWatermarkPng(text, opacityPct) {
        var fontSize = 40;
        var mCanvas = document.createElement('canvas');
        var mctx = mCanvas.getContext('2d');
        mctx.font = 'bold ' + fontSize + 'px sans-serif';
        var textW = Math.max(mctx.measureText(text).width, fontSize);
        var size = Math.ceil(Math.SQRT2 * (textW + fontSize));
        var canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.font = 'bold ' + fontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(120,120,120,' + (opacityPct / 100) + ')';
        ctx.fillText(text, 0, 0);
        return { dataUrl: canvas.toDataURL('image/png'), size: size };
      }

      async function stamp() {
        if (busy || !cur) return;
        var text = (textInput.value || '').trim();
        if (!text) { alert('워터마크 문구를 입력하세요.'); return; }
        busy = true;
        var label = makeBtn.textContent; makeBtn.textContent = '처리 중...'; makeBtn.disabled = true;
        try {
          await ensurePdfLib();
          var PDFLib = window.PDFLib;
          var src = await PDFLib.PDFDocument.load(cur.bytes, { ignoreEncryption: true });
          var wm = makeWatermarkPng(text, +opt('wmop') || 32);
          var pngImage = await src.embedPng(dataUrlToBytes(wm.dataUrl));
          var pos = opt('wmpos') || 'tile';
          var pages = src.getPages();
          pages.forEach(function (page) {
            var size = page.getSize();
            if (pos === 'center') {
              var side = Math.min(size.width, size.height) * 0.6;
              page.drawImage(pngImage, { x: (size.width - side) / 2, y: (size.height - side) / 2, width: side, height: side });
            } else {
              var step = wm.size * 0.9;
              for (var y = -wm.size / 2; y < size.height + wm.size / 2; y += step) {
                for (var x = -wm.size / 2; x < size.width + wm.size / 2; x += step) {
                  page.drawImage(pngImage, { x: x, y: y, width: wm.size, height: wm.size });
                }
              }
            }
          });
          var bytes = await src.save();
          var blob = new Blob([bytes], { type: 'application/pdf' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a'); a.href = url; a.download = 'formda-watermarked.pdf';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (e) {
          alert('워터마크 삽입 중 오류가 발생했습니다: ' + (e && e.message ? e.message : e));
        } finally { makeBtn.textContent = label; makeBtn.disabled = false; busy = false; }
      }
      makeBtn.addEventListener('click', stamp);
      render();
    },

    // PDF 페이지 회전 - 전체/홀수/짝수 페이지를 90도 단위로 상대 회전
    'pdfrotate': function (host) {
      host.innerHTML =
        '<div class="tt-wrap stack i2p">' +
          '<div class="tt-main">' +
            '<div class="tt-bar"><span class="tt-bar-label">PDF 선택 <span id="rtCnt" class="tt-cnt"></span></span>' +
              '<div class="tt-actions"><button class="mini-btn danger" data-act="clear">지우기</button></div></div>' +
            '<div class="i2p-drop" id="rtDrop" tabindex="0" role="button" aria-label="PDF 선택">' +
              '<input type="file" id="rtFile" accept="application/pdf,.pdf" hidden>' +
              '<svg class="i2p-drop-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
              '<p class="i2p-drop-t">PDF를 끌어다 놓거나 <b>클릭해서 선택</b></p>' +
              '<p class="i2p-drop-s">한 개의 PDF · 스캔이 옆으로 눕거나 거꾸로 나온 경우에 씁니다</p>' +
            '</div>' +
            '<div class="pdf-list" id="rtList"></div>' +
          '</div>' +
          '<div class="tt-side">' +
            '<div class="i2p-opts" id="rtOpts" style="display:none">' +
              '<div class="i2p-opt"><div class="i2p-opt-h">회전 방향</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="rtangle" value="90" checked>90° 시계방향</label>' +
                '<label class="tt-chip"><input type="radio" name="rtangle" value="-90">90° 반시계방향</label>' +
                '<label class="tt-chip"><input type="radio" name="rtangle" value="180">180°</label>' +
              '</div></div>' +
              '<div class="i2p-opt"><div class="i2p-opt-h">적용 범위</div><div class="tt-opt-row">' +
                '<label class="tt-chip"><input type="radio" name="rtscope" value="all" checked>전체 페이지</label>' +
                '<label class="tt-chip"><input type="radio" name="rtscope" value="odd">홀수 쪽만</label>' +
                '<label class="tt-chip"><input type="radio" name="rtscope" value="even">짝수 쪽만</label>' +
              '</div></div>' +
              '<p class="tt-hint">양면 스캔에서 뒷면만 거꾸로 나왔다면 홀수 쪽·짝수 쪽만 골라 회전하세요.</p>' +
            '</div>' +
            '<button class="mini-btn i2p-make" id="rtMake" disabled>회전하기</button>' +
            '<p class="tt-hint">처리는 모두 사용자 브라우저에서 이루어지며, 파일이 서버로 전송되지 않습니다.</p>' +
          '</div>' +
        '</div>';

      var cur = null;   // { name, size, pages, bytes }
      var listEl = host.querySelector('#rtList');
      var drop = host.querySelector('#rtDrop');
      var fileInput = host.querySelector('#rtFile');
      var makeBtn = host.querySelector('#rtMake');
      var cntEl = host.querySelector('#rtCnt');
      var opts = host.querySelector('#rtOpts');
      var busy = false;

      var pdflibPromise = null;
      function ensurePdfLib() {
        if (window.PDFLib) return Promise.resolve();
        if (!pdflibPromise) {
          pdflibPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { pdflibPromise = null; reject(new Error('PDF 라이브러리를 불러오지 못했습니다.')); };
            document.head.appendChild(s);
          });
        }
        return pdflibPromise;
      }
      function sizeStr(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'; }
      function opt(name) { return (host.querySelector('input[name=' + name + ']:checked') || {}).value; }

      async function setFile(file) {
        if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return;
        try { await ensurePdfLib(); } catch (e) { alert(e.message); return; }
        try {
          var bytes = await file.arrayBuffer();
          var doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          cur = { name: file.name, size: file.size, pages: doc.getPageCount(), bytes: bytes };
        } catch (e) { alert('PDF를 열 수 없습니다. 손상되었거나 암호가 걸린 파일일 수 있습니다.'); return; }
        render();
      }
      function render() {
        if (!cur) { listEl.innerHTML = ''; cntEl.textContent = ''; opts.style.display = 'none'; makeBtn.disabled = true; return; }
        listEl.innerHTML = '<div class="pdf-item">' +
          '<span class="pdf-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/></svg></span>' +
          '<span class="pdf-meta"><span class="pdf-name">' + esc(cur.name) + '</span><span class="pdf-sub">' + cur.pages + '쪽 · ' + sizeStr(cur.size) + '</span></span></div>';
        cntEl.textContent = '(' + cur.pages + '쪽)';
        opts.style.display = '';
        makeBtn.disabled = false;
      }

      drop.addEventListener('click', function () { fileInput.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) setFile(fileInput.files[0]); fileInput.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
      host.querySelector('[data-act=clear]').addEventListener('click', function () { cur = null; render(); });

      async function rotate() {
        if (busy || !cur) return;
        busy = true;
        var label = makeBtn.textContent; makeBtn.textContent = '처리 중...'; makeBtn.disabled = true;
        try {
          await ensurePdfLib();
          var PDFLib = window.PDFLib;
          var src = await PDFLib.PDFDocument.load(cur.bytes, { ignoreEncryption: true });
          var delta = +opt('rtangle') || 90;
          var scope = opt('rtscope') || 'all';
          src.getPages().forEach(function (page, idx) {
            var pageNum = idx + 1;
            var apply = scope === 'all' || (scope === 'odd' && pageNum % 2 === 1) || (scope === 'even' && pageNum % 2 === 0);
            if (!apply) return;
            var next = ((page.getRotation().angle + delta) % 360 + 360) % 360;
            page.setRotation(PDFLib.degrees(next));
          });
          var bytes = await src.save();
          var blob = new Blob([bytes], { type: 'application/pdf' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a'); a.href = url; a.download = 'formda-rotated.pdf';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (e) {
          alert('PDF 회전 중 오류가 발생했습니다: ' + (e && e.message ? e.message : e));
        } finally { makeBtn.textContent = label; makeBtn.disabled = false; busy = false; }
      }
      makeBtn.addEventListener('click', rotate);
      render();
    },
  };

  function boot() {
    var t = root.FORMDA_TEXT_TOOL;
    if (!t) return;
    var host = document.getElementById('textTool');
    if (!host || !TOOLS[t.kind]) return;
    TOOLS[t.kind](host, t.sample || {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // 빌드(노드)에서 썸네일/테스트용으로 코어 노출
  root.FormdaText = { romanizeWord: romanizeWord, syllables: syllables, surname: surname, romanizeAddress: romanizeAddress };
})(typeof window !== 'undefined' ? window : this);
