const s=document.getElementById('ttSur'), g=document.getElementById('ttGiv');
s.value='이'; g.value='서윤'; s.dispatchEvent(new Event('input',{bubbles:true})); g.dispatchEvent(new Event('input',{bubbles:true}));
await sleep(400);
document.querySelector('main').innerText.split('비우기')[1].slice(0,300)
