set('name','한지우'); set('birth','1998-06-15'); set('tel','010-0000-0000'); set('email','jiwoo@example.com'); set('addr','서울특별시 ○○구');
const ins=[...document.querySelectorAll('input[oninput]')];
const put=(h,i,k,v)=>{const e=ins.find(x=>x.getAttribute('oninput').startsWith(`Formda.app.${h}(${i}, '${k}'`)); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}};
const edu=[['2017.03 ~ 2023.02','○○대학교','경영학과 (학사)','졸업'],['','','',''],['','','','']];
edu.forEach((r,i)=>['period','school','major','status'].forEach((k,j)=>put('onEdu',i,k,r[j])));
const car=[['2025.01 ~ 재직중','○○브랜드','마케팅팀 대리','팔로워 1.2만→3.4만, 광고비 월 300만원'],['2024.01 ~ 2024.12','○○브랜드','마케팅팀 사원','콘텐츠 제작·채널 운영'],['','','','']];
car.forEach((r,i)=>['period','company','role','task'].forEach((k,j)=>put('onCareer',i,k,r[j])));
set('etc','GA4 애널리틱스 자격증 (2024)\n컴퓨터활용능력 1급 (2022)'); set('date','2026-12-01');
document.querySelector('#doc').innerText.slice(0,700)
