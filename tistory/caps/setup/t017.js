const clr=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='전체 비우기'); if(clr) clr.click(); await sleep(400);
set('name','서지안'); set('birth','2010-05-12'); set('tel','010-0000-0000'); set('addr','경기도 ○○시 ○○동');
set('applyPart','편의점 계산·진열 (○○점)'); set('availDays','화·목 + 토요일'); set('availTime','평일 17:00~21:00 / 토 10:00~17:00');
set('availStart','12월 15일부터'); set('availPeriod','6개월 이상 (내년 6월까지)');
const ins=[...document.querySelectorAll('input[oninput]')]; const put=(h,i,k,v)=>{const e=ins.find(x=>x.getAttribute('oninput').startsWith(`Formda.app.${h}(${i}, '${k}'`)); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}};
[['period','2026.03 ~ 재학중'],['school','○○고등학교'],['major','1학년'],['status','재학']].forEach(([k,v])=>put('onEdu',0,k,v));
set('etc','컴퓨터활용능력 2급 준비 중');
set('selfIntro','처음 지원하는 아르바이트입니다. 매장이 학교에서 걸어서 10분 거리라 평일 수업이 끝난 뒤 바로 올 수 있습니다. 반에서 급식 당번 순서표를 맡고 있어서, 정해진 시간에 맞춰 나오고 교대하는 일에는 익숙합니다.');
set('date','2026-12-10');
document.querySelector('#doc').innerText
