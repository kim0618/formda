const CL="[측정 조건까지 적는 품질관리 담당자]\n식품공학과 4학년 여름, 6주 동안 김치 공장 현장실습에서 염도 검사를 맡았습니다. 하루 40개 시료를 재다 보니 오후 측정값이 오전보다 높게 나오는 날이 이어졌고, 같은 배합인데도 출하 기준을 넘길 뻔한 날이 두 번 있었습니다.\n원인을 찾으려고 측정 시각과 실내 온도, 보정 여부를 표로 적었습니다. 점심 뒤 염도계 보정을 건너뛴 날에만 값이 튄다는 것을 확인했고, 반장님께 보정을 점심 직후에 한 번 더 넣자고 말씀드렸습니다. 마지막 2주 동안 오전·오후 차이는 0.05%p 안으로 줄었고, 제가 만든 표는 실습이 끝난 뒤에도 현장 기록지로 쓰였습니다.\n이 일로 품질 문제가 장비보다 작업 순서에서 먼저 생길 수 있다는 것을 배웠습니다. 귀사 품질관리 직무에서도 검사 결과만 남기지 않고 측정 조건을 함께 기록해, 이상치가 나왔을 때 원인을 하루 안에 좁히는 담당자가 되겠습니다.";
set('name','한서율'); set('applyTo','○○식품 품질관리 신입');
for (let k=0;k<5;k++){ const b=[...document.querySelectorAll('button')].filter(x=>/delQ\(/.test(x.getAttribute('onclick')||'')); if(b.length>1){ b[b.length-1].click(); await sleep(150);} }
const h=document.querySelector('input.q-head'), q=document.querySelector('textarea.q-body');
h.value='2. 직무 역량과 경험 (500자 이내)'; h.dispatchEvent(new Event('input',{bubbles:true}));
q.value=CL; q.dispatchEvent(new Event('input',{bubbles:true})); await sleep(400);
({count:document.querySelector('#qc-0').innerText, qn:document.querySelectorAll('textarea.q-body').length, pages:document.querySelectorAll('#doc .doc-page').length})
