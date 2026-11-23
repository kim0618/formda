set('date','2026-12-03'); set('no','2026-012'); set('from','○○오피스'); set('fromReg','000-00-00000'); set('fromCeo','윤태호'); set('fromBiz','도소매 / 사무용품'); set('fromTel','02-000-0000'); set('fromAddr','서울특별시 ○○구 ○○로 3');
set('to','○○디자인'); set('toReg','000-00-00000'); set('toCeo','서민아'); set('toTel','02-000-0000'); set('toAddr','서울특별시 ○○구 ○○로 9');
for (let k=0;k<2;k++){ const del=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='×'&&/delRow/.test(b.getAttribute('onclick')||'')); if(del.length) { del[del.length-1].click(); await sleep(200);} }
const ins2=[...document.querySelectorAll('input[oninput]')];
const it=[['A4 복사용지','80g 박스','10','25,000'],['토너','정품','2','90,000']];
it.forEach((r,i)=>['onName','onSpec','onQty','onPrice'].forEach((h,k)=>{const e=ins2.find(x=>x.getAttribute('oninput').startsWith('Formda.app.'+h+'('+i+',')); if(e){e.value=r[k]; e.dispatchEvent(new Event('input',{bubbles:true}));}}));
const v=document.getElementById('f-vat'); v.value='0.1'; v.dispatchEvent(new Event('change',{bubbles:true}));
set('prevBalance','500,000'); set('paidAmount','300,000'); set('note','');
await sleep(400);
document.querySelector('#doc').innerText.split('\n').filter(l=>/잔액|합계|공급가액/.test(l)).join(' | ')
