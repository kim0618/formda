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
        var baseR = ADDR_CITY[base] || cap(romanizeWord(base));
        return { text: baseR + ADDR_SUF[i][1] };
      }
    }
    if (ADDR_CITY[tok]) return { text: ADDR_CITY[tok] };
    return { text: cap(romanizeWord(tok)) };
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
        if (op('dedup')) { var seen = {}; lines = lines.filter(function (l) { if (seen[l]) return false; seen[l] = 1; return true; }); }
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
