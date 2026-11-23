set('name','이서윤'); set('birth','2005-08-14'); set('tel','010-0000-0000'); set('email',''); set('addr','서울특별시 마포구 서교동');
set('applyPart','카페 음료 제조·홀 (홍대입구점)'); set('availDays','화·목 + 일요일'); set('availTime','평일 13:00~18:00 / 일 10:00~16:00');
set('availStart','12월 1일부터'); set('availPeriod','3개월 이상 (겨울방학 포함)');
const rows=[...document.querySelectorAll('input[oninput]')].filter(e=>/onEdu|onCareer|onExp|onWork/.test(e.getAttribute('oninput')));
const vals=['2024.03 ~ 재학중','○○대학교','식품영양학과 2학년','재학','2021.03 ~ 2024.02','○○고등학교','인문계','졸업','2025.07 ~ 2025.08','○○베이커리','빵 진열·포장·계산','주 4일 · 6시간','','','',''];
rows.forEach((e,i)=>{ if(i<vals.length){ e.value=vals[i]; e.dispatchEvent(new Event('input',{bubbles:true})); }});
set('etc','보건증 있음 (2026년 10월 검진, 유효기간 1년)');
set('selfIntro','베이커리에서 두 달 동안 빵 진열과 포장, 계산을 맡았습니다. 음료 제조는 처음이지만 레시피는 출근 전에 외워 오겠습니다.');
set('date','2026-11-24');
({rows: rows.length, doc: document.querySelector('#doc').innerText.slice(0,900)})
