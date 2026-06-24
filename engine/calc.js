// 폼다 엔진 - 계산 모듈 (금액·부가세·한글금액·콤마·이스케이프)
// 브라우저: window.Formda.calc / Node 테스트: module.exports (vm/require 양쪽 지원)
(function (root) {
  'use strict';

  var MAX_PRICE_DIGITS = 10; // 단가 최대 10자리(약 99억) - 숫자 폭주 방지
  var MAX_QTY = 99999;

  function won(n) {
    return Math.round(n).toLocaleString('ko-KR') + ' 원';
  }

  function comma(n) {
    return Math.round(n).toLocaleString('ko-KR');
  }

  // 입력값에서 숫자만 추출 + 자릿수 제한
  function cleanInt(str, maxDigits) {
    var v = String(str).replace(/[^\d]/g, '').slice(0, maxDigits || MAX_PRICE_DIGITS);
    return { digits: v, value: parseInt(v || '0', 10) };
  }

  // 한글 금액 (조·경 단위까지)
  function korAmount(n) {
    n = Math.floor(n);
    if (n <= 0) return '영';
    var d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    var pos = ['', '십', '백', '천'];
    var big = ['', '만', '억', '조', '경'];
    var res = '', g = 0;
    while (n > 0) {
      var grp = n % 10000;
      if (grp > 0) {
        var s = '', p = 0, x = grp;
        while (x > 0) {
          var dig = x % 10;
          if (dig > 0) s = d[dig] + pos[p] + s;
          x = Math.floor(x / 10);
          p++;
        }
        res = s + big[g] + res;
      }
      n = Math.floor(n / 10000);
      g++;
    }
    return res;
  }

  // 품목 + 부가세 모드 -> 공급가액/부가세/합계
  // vatMode: '0.1'(10% 별도) | 'incl'(10% 포함) | '0'(없음)
  function totals(items, vatMode) {
    var supply = items.reduce(function (s, it) {
      return s + (it.qty || 0) * (it.price || 0);
    }, 0);
    var vat = 0, total = 0;
    if (vatMode === '0.1') {
      vat = supply * 0.1;
      total = supply + vat;
    } else if (vatMode === 'incl') {
      total = supply;
      supply = total / 1.1;
      vat = total - supply;
    } else {
      total = supply;
    }
    return { supply: supply, vat: vat, total: total };
  }

  // HTML 이스케이프 (사용자 입력이 미리보기 마크업을 깨지 않도록)
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var api = {
    MAX_PRICE_DIGITS: MAX_PRICE_DIGITS,
    MAX_QTY: MAX_QTY,
    won: won,
    comma: comma,
    cleanInt: cleanInt,
    korAmount: korAmount,
    totals: totals,
    esc: esc,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.Formda = root.Formda || {};
  root.Formda.calc = api;
})(typeof window !== 'undefined' ? window : this);
