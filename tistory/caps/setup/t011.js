set('hoFrom','정하윤'); set('hoFromDept','행정실'); set('hoFromPos','주임'); set('hoTo','오세린'); set('hoToDept','행정실'); set('hoToPos','행정 직원');
const ins=[...document.querySelectorAll('input[oninput],textarea[oninput]')];
const put=(h,i,v)=>{const e=ins.find(x=>x.getAttribute('oninput').startsWith(`Formda.app.${h}(${i},`)); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}};
const rows=[['1월 수강료 수납','1월 4일부터 수납. 12월 미납 3명, 명단은 공유 폴더 /수납/12월'],['학부모 상담','1월 첫 주 6건 예약 완료, 시간표는 상담 달력 참조'],['교재 주문','2월 교재 1월 8일 주문 예정, 반별 수량표 작성 완료'],['차량 운행표','1월 운행표 확정, 기사님 연락처는 비상연락망 2쪽'],['출결 문자','수업 시작 10분 뒤 미출석 학생에게 발송, 문구는 문자함 저장']];
rows.forEach((r,i)=>{put('onName',i,r[0]); put('onSpec',i,r[1]);});
set('hoDate','2026-12-29'); set('hoPeriod','2026-12-17 ~ 2026-12-29'); set('no',''); set('hoConfirm','원장 문지호'); set('note','프로그램 로그인 정보는 원장에게 따로 전달. 12월 28일 점검에서 나온 질문은 이 칸에 덧붙임.');
document.querySelector('#doc').innerText.slice(0,900)
