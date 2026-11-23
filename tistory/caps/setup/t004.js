set('date','2026-11-26'); set('no','2026-112'); set('validity','2026년 12월 10일까지');
set('from','○○우드공방'); set('fromReg','000-00-00000'); set('fromCeo','한도윤'); set('fromBiz','제조 / 원목가구'); set('fromTel','031-000-0000'); set('fromAddr','경기도 ○○시 ○○로 30'); set('to','이수민');
const ins=[...document.querySelectorAll('input[oninput]')];
const items=[['원목 식탁 제작','오크 1800×900','1','1,200,000'],['원목 의자','오크','4','150,000'],['배송·설치','수도권','1','100,000'],['','','','']];
items.forEach((it,i)=>{ ['onName','onSpec','onQty','onPrice'].forEach((h,k)=>{ const e=ins.find(x=>x.getAttribute('oninput').startsWith('Formda.app.'+h+'('+i+',')); if(e){ e.value=it[k]; e.dispatchEvent(new Event('input',{bubbles:true})); } }); });
const v=document.getElementById('f-vat'); v.value='0.1'; v.dispatchEvent(new Event('change',{bubbles:true}));
set('note','유효기간이 지나면 자재 단가를 다시 확인해 견적을 새로 드립니다.');
await sleep(400);
document.querySelector('#doc').innerText.slice(0,900)
