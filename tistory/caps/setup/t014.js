set('date','2026-12-10'); set('no','2026-118'); set('dept','디자인팀'); set('writer','윤채아'); set('approvers','담당,팀장,대표');
for (let k=0;k<3;k++){ const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='+ 항목 추가'); if(document.querySelectorAll('input[oninput^="Formda.app.onName"]').length<6 && b){ b.click(); await sleep(200);} }
const rows=[['기업업무추진비','○○상사 2명, 1월 납품 일정 협의 점심(법인카드)','48,000'],['복리후생비','디자인팀 4명 야근 저녁 식대','52,000'],['운반비','시안 출력물 퀵 전달','15,000'],['소모품비','프린터 토너 1개','89,000'],['여비교통비','부산 현장 출장 기차표 1명 왕복','119,600'],['도서인쇄비','업무용 디자인 서적 2권','36,000']];
const q=(h,i)=>[...document.querySelectorAll('input[oninput]')].find(x=>x.getAttribute('oninput').startsWith(`Formda.app.${h}(${i},`));
rows.forEach((r,i)=>{ [['onName',r[0]],['onSpec',r[1]],['onPrice',r[2]]].forEach(([h,v])=>{const e=q(h,i); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}}); });
set('note','법인카드 사용 4건은 카드 전표, 퀵·서적은 현금영수증 첨부.');
await sleep(400);
document.querySelector('#doc').innerText.slice(0,900)
