set('date','2026-12-17'); set('no','2026-1217'); set('from','○○베이커리 주식회사'); set('fromReg','000-00-00000'); set('fromCeo','문○○'); set('fromBiz','제조 / 제과'); set('fromTel','02-000-0000'); set('fromAddr','서울특별시 ○○구 ○○로 30');
set('to','○○패키지'); set('toReg','000-00-00000'); set('toCeo','오○○'); set('toTel','031-000-0000'); set('toAddr','경기도 ○○시 산단로 9');
const q=(h,i)=>[...document.querySelectorAll('input[oninput]')].find(x=>x.getAttribute('oninput').startsWith(`Formda.app.${h}(${i},`));
for (let k=0;k<2;k++){ const del=[...document.querySelectorAll('button')].filter(b=>/delRow|delItem/.test(b.getAttribute('onclick')||'')); if(document.querySelectorAll('input[oninput^="Formda.app.onName"]').length>3 && del.length){ del[del.length-1].click(); await sleep(200);} }
const rows=[['쇼핑백 (소)','로고 1도 인쇄','2000','180'],['쇼핑백 (대)','로고 1도 인쇄','3000','240'],['인쇄 동판','1식','1','50000']];
rows.forEach((r,i)=>[['onName',r[0]],['onSpec',r[1]],['onQty',r[2]],['onPrice',r[3]]].forEach(([h,v])=>{const e=q(h,i); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}}));
set('deliveryDate','2026-12-28'); set('deliveryPlace','발주자 본사 1층 창고');
set('paymentTerms','납품 후 7일 이내 검수, 검수 완료일로부터 30일 이내 계좌이체');
set('note','수량 부족과 인쇄 불량은 검수 기간 안에 이메일로 통지합니다. 검수 기간이 지난 뒤 발견한 인쇄 불량은 발견 즉시 통지합니다.');
await sleep(400);
document.querySelector('#doc').innerText
