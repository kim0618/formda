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
          // 십·백·천 자리의 1은 '일'을 생략(표준 표기: 일십→십, 일백→백)
          if (dig > 0) s = ((dig === 1 && p > 0) ? '' : d[dig]) + pos[p] + s;
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
  // perRow=true(거래명세서 등 행별 세액 컬럼 노출): 합계를 행별 반올림값의 합으로 계산해
  //   화면의 세액 컬럼 합과 합계 세액이 정확히 일치하도록 함.
  function totals(items, vatMode, perRow) {
    var gross = items.reduce(function (s, it) {
      return s + (it.qty || 0) * (it.price || 0);
    }, 0);
    var supply = gross, vat = 0, total = 0;
    if (vatMode === '0.1') {
      if (perRow) {
        vat = items.reduce(function (s, it) {
          return s + Math.round((it.qty || 0) * (it.price || 0) * 0.1);
        }, 0);
      } else {
        vat = gross * 0.1;
      }
      supply = gross;
      total = supply + vat;
    } else if (vatMode === 'incl') {
      total = gross;
      if (perRow) {
        supply = items.reduce(function (s, it) {
          return s + Math.round((it.qty || 0) * (it.price || 0) / 1.1);
        }, 0);
      } else {
        supply = total / 1.1;
      }
      vat = total - supply;
    } else {
      total = gross;
      supply = gross;
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
