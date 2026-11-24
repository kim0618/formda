const e=document.getElementById('ttIn'); e.value='서울특별시 송파구 새봄로 12 101동 1203호'; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(300);
const noComma=document.getElementById('ttOut').innerText.replace(/\n/g,' | ');
e.value='서울특별시 송파구 새봄로 12, 101동 1203호'; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(300);
[noComma, document.getElementById('ttOut').innerText.replace(/\n/g,' | ')]
