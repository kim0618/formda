// 글이 설명하는 폼다 도구 동작을 배포된 formda.kr에서 다시 잰다(도구가 바뀌면 글이 틀려지는 걸 막는 검사).
// 사용: LD_LIBRARY_PATH=$HOME/.local/emulib node claims.mjs            # 전체
//       LD_LIBRARY_PATH=$HOME/.local/emulib node claims.mjs t009 t010  # 해당 글만
// 실패가 하나라도 있으면 종료 코드 1. publish.sh가 예약 전에 돌린다.
// 새 글이 도구 동작(칸 이름, 자동 처리, 파일명, 비웠을 때 표시 등)을 본문에 쓰면 여기에 그 주장을 추가한다.
import fs from 'fs';
import crypto from 'crypto';
const { chromium } = await import('/home/tjd618/.claude/tools/calc-runner/node_modules/playwright/index.mjs');
const FX = new URL('./claims/fixtures/', import.meta.url).pathname;
const SIG = new URL('./claims/engine-signature.txt', import.meta.url).pathname;

const helper = `function set(id, v){ const e=document.getElementById(id.startsWith('f-')?id:'f-'+id); if(!e) throw new Error('입력칸 없음: '+id);
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms)); const doc=()=>document.querySelector('#doc').innerText;`;

// post: 글 번호, claim: 글이 주장하는 것(한글), slug, js: 페이지 안에서 실행해 true/false 반환
const CHECKS = [
  { post: 't001', claim: '수신 칸에 받는 사람만 넣으면 끝에 "귀하"가 한 번 붙는다', slug: 'resignation',
    js: `set('recipient','○○주식회사 대표이사'); await sleep(300); const t=doc(); return t.includes('○○주식회사 대표이사 귀하') && !t.includes('귀하 귀하');` },
  { post: 't021', claim: '휴게시간을 비우면 4번 항목에 근로시간만 찍힌다', slug: 'employment-contract',
    js: `set('workTime','09:00 ~ 13:00'); set('breakTime',''); await sleep(300); const t=doc(); const i=t.indexOf('4. 소정근로시간'); const s=t.slice(i,t.indexOf('5.',i)); return i>=0 && !/휴게/.test(s);` },
  { post: 't007', claim: '담당 업무가 길면 줄이 바뀌며 잘리지 않는다', slug: 'resume',
    js: `const e=[...document.querySelectorAll('input[oninput]')].find(x=>x.getAttribute('oninput').startsWith("Formda.app.onCareer(0, 'task'")); e.value='브랜드 SNS 운영, 팔로워 1.2만→3.4만, 월 광고비 300만원 집행'; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(400);
      const c=[...document.querySelectorAll('#doc td')].find(x=>x.innerText.includes('집행')); return !!c && c.scrollWidth<=c.clientWidth+1 && c.offsetHeight>40;` },
  { post: 't007', claim: '경력은 6개까지 늘릴 수 있다', slug: 'resume',
    js: `for(let k=0;k<8;k++){ const b=[...document.querySelectorAll('button')].find(x=>/addCareer/.test(x.getAttribute('onclick')||'')); if(b&&!b.disabled) b.click(); await sleep(80);} return document.querySelectorAll('input[oninput^="Formda.app.onCareer"][oninput*="\\'task\\'"]').length===6;` },
  { post: 't009', claim: '전잔액·입금액을 비우면 빈칸으로 남고, 처음 열면 예시 500,000/1,000,000이 들어 있다', slug: 'statement',
    js: `const a=document.getElementById('f-prevBalance').value, b=document.getElementById('f-paidAmount').value; set('prevBalance',''); set('paidAmount',''); await sleep(300); const t=doc(); return a==='500,000' && b==='1,000,000' && /전잔액\\t\\s*\\t당월/.test(t);` },
  { post: 't010', claim: '번호 칸에 "제2026-1호"를 넣어도 "제 2026-1 호"로 정리된다', slug: 'award',
    js: `set('docNo','제2026-1호'); await sleep(300); return doc().includes('제 2026-1 호');` },
  { post: 't010', claim: '파일 이름은 "제목_이름"(제목 비우면 상장_이름, 이름 띄어쓰기 빠짐)', slug: 'award',
    js: `set('docTitle',''); set('name','박 서 준'); await sleep(200); const a=Formda.app.dlName(); set('docTitle','우수사원상'); set('name','김 하 늘'); await sleep(200); return a==='상장_박서준' && Formda.app.dlName()==='우수사원상_김하늘';` },
  { post: 't011', claim: '인수인계일이 맨 아래 서명 날짜로 찍히고, 확인자를 비우면 확인 서명 자리가 빠진다', slug: 'handover',
    js: `set('hoDate','2026-12-29'); set('hoConfirm',''); await sleep(300); const t=doc(); return t.includes('2026년 12월 29일') && !/확인\\s/.test(t.slice(t.indexOf('2026년 12월 29일')));` },
  { post: 't011', claim: '업무 항목은 12개까지, 문서 표는 기본 12행', slug: 'handover',
    js: `return document.querySelectorAll('#doc tbody tr').length>=12;` },
  { post: 't012', claim: '답변 칸 아래 "공백 포함 N자 · 제외 M자", 줄바꿈은 공백 포함에 1자', slug: 'cover-letter',
    js: `const q=document.querySelector('textarea.q-body'); q.value='가 나\\n다'; q.dispatchEvent(new Event('input',{bubbles:true})); await sleep(200); return document.querySelector('#qc-0').innerText.trim()==='공백 포함 5자 · 제외 3자';` },
  { post: 't013', claim: '입력칸 "위임할 사항"이 문서에 "위임 내용"으로, 끝에 "일체의 권한" 문장이 고정', slug: 'mandate',
    js: `return [...document.querySelectorAll('#formPanel label')].some(l=>l.innerText.includes('위임할 사항')) && doc().includes('위임 내용') && doc().includes('위 위임 내용에 관한 일체의 권한을 위임합니다');` },
  { post: 't014', claim: '합계와 "一金 …원整" 한글 금액이 자동으로 붙는다', slug: 'expense-report',
    js: `await sleep(200); return /합\\s*계\\s*[\\d,]+ 원/.test(doc()) && /一金 .+원整/.test(doc());` },
  { post: 't002', claim: '알바 이력서에 보건증·자격 칸이 있고, 문서 희망 근무 조건 표에 그 줄이 찍힌다', slug: 'alba-resume',
    js: `set('etc','보건증 있음 (2026년 10월 검진, 유효기간 1년)'); await sleep(300); return [...document.querySelectorAll('#formPanel label, #formPanel h2, #formPanel h3')].some(l=>l.innerText.includes('보건증·자격')) && /보건증·자격\\s+보건증 있음 \\(2026년 10월 검진/.test(doc());` },
  { post: 't003', claim: '차용증 문서에 "위 금액을 채권자로부터 틀림없이 차용하고 영수하였으며" 문장이 들어간다', slug: 'loan',
    js: `return doc().includes('위 금액을 채권자로부터 틀림없이 차용하고 영수하였으며');` },
  { post: 't004', claim: '견적서 유효기간 칸 기본값이 "발행일로부터 30일"', slug: 'estimate',
    js: `return document.getElementById('f-validity').value==='발행일로부터 30일';` },
  { post: 't005', claim: '이서윤을 넣으면 Lee·Yi·Rhee, Seoyun·Seo-yun·Seo Yun이 나온다', slug: 'name-roman',
    js: `const s=document.getElementById('ttSur'), g=document.getElementById('ttGiv'); s.value='이'; g.value='서윤'; s.dispatchEvent(new Event('input',{bubbles:true})); g.dispatchEvent(new Event('input',{bubbles:true})); await sleep(400); const t=document.getElementById('ttOut').innerText; return ['Lee','Yi','Rhee','Seoyun','Seo-yun','Seo Yun'].every(x=>t.includes(x));` },
  { post: 't006', claim: '재직증명서 용도 칸 문구가 증명 문구 바로 아래 줄에 찍힌다', slug: 'employment',
    js: `set('purpose','○○은행 전세자금대출 제출용'); await sleep(300); const L=doc().split('\\n').map(x=>x.trim()).filter(Boolean); const i=L.findIndex(x=>x.includes('재직하고 있음을')); return i>=0 && L[i+1] && L[i+1].includes('○○은행 전세자금대출 제출용');` },
  { post: 't008', claim: '합의 내용은 적은 그대로 줄이 나뉘어 들어가고 번호를 자동으로 매기지 않는다', slug: 'agreement',
    js: `set('content','가나다 첫 줄\\n라마바 둘째 줄'); await sleep(300); const t=doc(); return t.includes('가나다 첫 줄\\n라마바 둘째 줄') && !/\\d\\.\\s*가나다 첫 줄/.test(t);` },
  { post: 't022', claim: 'QR 저장 PNG 둘레에 흰 여백(quiet zone)이 들어간다', slug: 'qr',
    js: `const e=document.getElementById('ttIn'); e.value='WIFI:S:cafe_guest;T:WPA;P:coffee2026;;'; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(600);
      let href=''; const orig=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download==='qrcode.png') href=this.href; else orig.call(this); };
      [...document.querySelectorAll('button')].find(b=>/저장|PNG|다운/.test(b.innerText)).click(); HTMLAnchorElement.prototype.click=orig; if(!href) return false;
      const im=new Image(); await new Promise(r=>{im.onload=r; im.src=href;}); const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d'); g.drawImage(im,0,0);
      const d=g.getImageData(0,0,c.width,Math.max(1,Math.floor(c.height*0.05))).data; for(let k=0;k<d.length;k+=4){ if(d[k]<240||d[k+1]<240||d[k+2]<240) return false; } return true;` },
  { post: 't016', claim: '경력증명서 발급번호를 비우면 맨 위 "제 … 호" 줄이 빠진다', slug: 'career-certificate',
    js: `set('docNo',''); await sleep(300); return !/^제 .* 호/m.test(doc()) && doc().trim().startsWith('경 력 증 명 서');` },
  { post: 't016', claim: '경력증명서 재직기간은 적은 글자를 그대로 찍고 끝날을 채우지 않는다', slug: 'career-certificate',
    js: `set('period','2021년 4월 ~ 2026년 2월'); await sleep(300); return /재직기간\\t2021년 4월 ~ 2026년 2월\\n/.test(doc());` },
  { post: 't017', claim: '알바 이력서에서 경력을 비우면 문서 아르바이트 경력 표가 빈 줄 네 개로 남는다', slug: 'alba-resume',
    js: `const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='전체 비우기'); b.click(); await sleep(400); const t=doc(); const s=t.slice(t.indexOf('아르바이트 경력'), t.indexOf('자기소개')); return (s.match(/\\n\\t\\t\\t/g)||[]).length===4;` },
  { post: 't017', claim: '경력 칸 아래 안내: 경력이 없으면 비워 두라고 한다', slug: 'alba-resume',
    js: `return document.body.innerText.includes('경력이 없으면 비워 두세요');` },
  { post: 't017', claim: '자기소개 칸 내용이 문서 맨 아래 자기소개 칸에 들어간다', slug: 'alba-resume',
    js: `set('selfIntro','처음 지원하는 아르바이트입니다.'); await sleep(300); const t=doc(); return t.indexOf('자기소개')>t.indexOf('아르바이트 경력') && t.slice(t.indexOf('자기소개')).includes('처음 지원하는 아르바이트입니다.');` },
  { post: 't018', claim: '내용증명 청구 금액 5,000,000이 "일금 오백만원정"과 "₩ 5,000,000" 두 줄로, 이행기한이 "2026년 12월 31일 까지"로 찍힌다', slug: 'content-proof',
    js: `set('amount','5,000,000'); set('deadline','2026-12-31'); await sleep(300); const t=doc(); return t.includes('일금 오백만원정') && t.includes('₩ 5,000,000') && /이 행 기 한\\t2026년 12월 31일 까지/.test(t);` },
  { post: 't019', claim: '발주서에 검수 칸은 없고, 결제조건·비고는 적은 그대로 찍히며 합계·한글 금액이 자동 계산된다', slug: 'order',
    js: `set('paymentTerms','납품 후 7일 이내 검수, 검수 완료일로부터 30일 이내 계좌이체'); set('note','검수 기간 안에 이메일로 통지'); await sleep(300); const t=doc(); const labels=[...document.querySelectorAll('#formPanel label,#formPanel h2')].map(l=>l.innerText); return !labels.some(l=>/검수/.test(l)) && /결제조건\\t납품 후 7일 이내 검수, 검수 완료일로부터 30일 이내 계좌이체/.test(t) && t.includes('검수 기간 안에 이메일로 통지') && /一金 .+원整/.test(t);` },
  { post: 't020', claim: '영문주소: 101동 1203호 → 101-dong 1203-ho 맨 앞 + 다른 표기 #101-1203, 3층 302호 → 3F 302-ho, 괄호 건물 종류는 번역·이름은 음역((잠실동, 리오그린)→(Jamsil-dong, Riogeurin), 빌라→Villa, 오피스텔→Officetel), 지하 B01호→B01-ho, 지하1층 B01호→B1F B01-ho, 쉼표 없이 써도 동·호를 떼어 냄', slug: 'address-roman',
    js: `const e=document.getElementById('ttIn'); const o=()=>document.getElementById('ttOut').innerText; const go=async(v)=>{e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(250); return o();};
      const a=await go('서울특별시 송파구 새봄로 12, 101동 1203호'); const b=await go('경기도 성남시 분당구 햇살로 95, 3층 302호'); const c=await go('서울특별시 송파구 새봄로 12, 101동 1203호 (잠실동, 리오그린)'); const c2=await go('서울특별시 강서구 별빛로 30, 201호 (화곡동, 행복빌라)'); const c3=await go('경기도 성남시 분당구 햇살로 95, 3층 302호 (정자동, 행복오피스텔)'); const f=await go('서울특별시 강서구 별빛로 30, B01호'); const g=await go('서울특별시 강서구 별빛로 30, 지하1층 B01호'); const d=await go('서울특별시 송파구 새봄로 12 101동 1203호');
      return a.includes('101-dong 1203-ho, 12 Saebom-ro, Songpa-gu, Seoul') && a.includes('#101-1203') && b.includes('3F 302-ho, 95 Haetsal-ro') && c.includes('(Jamsil-dong, Riogeurin)') && c2.includes('Villa)') && c3.includes('Officetel)') && f.includes('B01-ho, 30 Byeolbit-ro') && g.includes('B1F B01-ho, 30 Byeolbit-ro') && d.includes('101-dong 1203-ho, 12 Saebom-ro');` },
  { post: 't016', claim: '경력증명서 문서 표에는 담당 업무 칸이 없고 담당 업무는 표 아래 증명 문구로 들어간다', slug: 'career-certificate',
    js: `set('body','위 사람은 담당 업무는 화물 배차 계획 수립이었음을 증명합니다.'); await sleep(300); const d=document.querySelector('#doc'); const th=[...d.querySelectorAll('th,td')].map(x=>x.innerText.trim()); return !th.some(x=>x==='담당 업무'||x==='담당업무') && d.innerText.includes('화물 배차 계획 수립');` },
  { post: 't020', claim: '영문주소 복사 버튼은 기본 표기에만 붙고 다른 표기(#101-1203)에는 없다', slug: 'address-roman',
    js: `const e=document.getElementById('ttIn'); e.value='서울특별시 송파구 새봄로 12, 101동 1203호'; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(300); const b=[...document.getElementById('ttOut').querySelectorAll('button')]; return b.length===1 && !b[0].parentElement.innerText.includes('#101-1203') && document.getElementById('ttOut').innerText.includes('#101-1203');` },
  { post: 't020', claim: '괄호 건물명에 빌라가 붙으면 영어 낱말로(리오그린빌라→Rio Green Villa), 지하 B01호→B01-ho', slug: 'address-roman',
    js: `const e=document.getElementById('ttIn'); const go=async(v)=>{e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(300); return document.getElementById('ttOut').innerText;}; const a=await go('서울특별시 송파구 새봄로 12, 101동 1203호 (잠실동, 리오그린빌라)'); return a.includes('(Jamsil-dong, Rio Green Villa)');` },
  { post: 't019', claim: '발주서 합계 1,243,000원이 한글 금액 一金 백이십사만삼천원整으로 찍힌다', slug: 'order',
    js: `set('date','2026-12-17'); set('no','2026-1217'); set('from','○○베이커리 주식회사'); set('fromReg','000-00-00000'); set('fromCeo','문○○'); set('fromBiz','제조 / 제과'); set('fromTel','02-000-0000'); set('fromAddr','서울특별시 ○○구 ○○로 30');
set('to','○○패키지'); set('toReg','000-00-00000'); set('toCeo','오○○'); set('toTel','031-000-0000'); set('toAddr','경기도 ○○시 산단로 9');
const q=(h,i)=>[...document.querySelectorAll('input[oninput]')].find(x=>x.getAttribute('oninput').startsWith(\`Formda.app.\${h}(\${i},\`));
for (let k=0;k<2;k++){ const del=[...document.querySelectorAll('button')].filter(b=>/delRow|delItem/.test(b.getAttribute('onclick')||'')); if(document.querySelectorAll('input[oninput^="Formda.app.onName"]').length>3 && del.length){ del[del.length-1].click(); await sleep(200);} }
const rows=[['쇼핑백 (소)','로고 1도 인쇄','2000','180'],['쇼핑백 (대)','로고 1도 인쇄','3000','240'],['인쇄 동판','1식','1','50000']];
rows.forEach((r,i)=>[['onName',r[0]],['onSpec',r[1]],['onQty',r[2]],['onPrice',r[3]]].forEach(([h,v])=>{const e=q(h,i); if(e){e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}}));
set('deliveryDate','2026-12-28'); set('deliveryPlace','발주자 본사 1층 창고');
set('paymentTerms','납품 후 7일 이내 검수, 검수 완료일로부터 30일 이내 계좌이체');
set('note','수량 부족과 인쇄 불량은 검수 기간 안에 이메일로 통지합니다. 검수 기간이 지난 뒤 발견한 인쇄 불량은 발견 즉시 통지합니다.');
await sleep(400);
return document.querySelector('#doc').innerText.includes('一金 백이십사만삼천원整');` },
  { post: 't007', claim: '이력서 자격·기타 칸은 짧은 줄 다섯 줄까지 들어가고 여섯째 줄부터 입력이 되돌려진다', slug: 'resume',
    js: `const e=document.getElementById('f-etc'); const put=async(n)=>{e.value=Array.from({length:n},(_,k)=>'a'+k).join('\\n'); e.dispatchEvent(new Event('input',{bubbles:true})); await sleep(250); return e.value.split('\\n').length;}; const a=await put(5); const b=await put(6); return a===5 && b===5;` },
  { post: 't021', claim: '근로계약서 입력 칸 이름이 "소정근로시간"이다', slug: 'employment-contract',
    js: `return [...document.querySelectorAll('#formPanel label')].some(l=>l.innerText.trim().startsWith('소정근로시간'));` },
  { post: 't002', claim: '보건증·자격 칸에 줄을 바꿔 넣으면 문서에는 가운뎃점으로 이어 찍힌다', slug: 'alba-resume',
    js: `set('etc','보건증 있음\\n바리스타 2급'); await sleep(300); return document.querySelector('#doc').innerText.includes('보건증 있음 · 바리스타 2급');` },
  { post: 't015', kind: 'pdfmerge', claim: '열기 암호 PDF는 빠지고, 인쇄·편집만 막힌 PDF와 같은 파일 두 번은 들어가며, 파일명은 formda-merged.pdf' },
];

const want = process.argv.slice(2);
const list = want.length ? CHECKS.filter(c => want.includes(c.post)) : CHECKS;
// 11/24: t016부터는 글마다 도구 주장 검사가 최소 1건 있어야 한다(도구 주장이 정말 없으면 meta에 "CLAIMS: 없음")
let missing = 0;
for (const w of want) {
  const n = +w.slice(1); if (n < 16 || n >= 21 && n <= 22) continue;
  const meta = fs.existsSync(new URL(`./meta/${w}.txt`, import.meta.url).pathname) ? fs.readFileSync(new URL(`./meta/${w}.txt`, import.meta.url).pathname, 'utf8') : '';
  if (!CHECKS.some(c => c.post === w) && !/^CLAIMS:\s*없음/m.test(meta)) { console.log(`FAIL ${w} 도구 동작 검사 없음: 본문의 도구 주장을 CHECKS에 추가하거나 meta에 "CLAIMS: 없음"`); missing++; }
}
const pwDir = process.env.HOME + '/.cache/ms-playwright';
const cd = fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const b = await chromium.launch({ executablePath: `${pwDir}/${cd}/chrome-linux64/chrome` });
let fail = 0;
for (const c of list) {
  let ok = false, note = '';
  try {
    const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
    if (c.kind === 'pdfmerge') {
      const msgs = []; p.on('dialog', async d => { msgs.push(d.message()); await d.accept(); });
      await p.goto('https://formda.kr/tools/pdf-merge', { waitUntil: 'networkidle' });
      await p.setInputFiles('#pmFile', ['a4.pdf', 'owner_locked.pdf', 'open_locked.pdf', 'a4.pdf'].map(f => FX + f)); await p.waitForTimeout(1500);
      const n = await p.$$eval('.pdf-item', e => e.length);
      await p.setInputFiles('#pmFile', [FX + 'photo.jpg']); await p.waitForTimeout(800);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#pmMake')]);
      ok = n === 3 && msgs.some(m => m.includes('열기 암호')) && msgs.some(m => m.includes('PDF 파일만')) && dl.suggestedFilename() === 'formda-merged.pdf';
      note = `목록 ${n}개, 안내 ${msgs.length}건, 파일명 ${dl.suggestedFilename()}`;
    } else {
      await p.goto(`https://formda.kr/tools/${c.slug}`, { waitUntil: 'networkidle' });
      ok = await p.evaluate(`(async () => { ${helper} ${c.js} })()`);
    }
    await ctx.close();
  } catch (e) { note = String(e.message || e).slice(0, 120); }
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.post} ${c.claim}${note && !ok ? ' / ' + note : ''}`);
}
// 배포된 엔진 파일 지문: 바뀌면 전체 검사를 돌리라고 알린다
if (!want.length) {
  const page = await b.newPage(); await page.goto('https://formda.kr/tools/resume', { waitUntil: 'networkidle' });
  const srcs = await page.$$eval('script[src]', s => s.map(x => x.src).filter(u => u.includes('/engine/')));
  const h = crypto.createHash('sha256');
  for (const u of srcs.sort()) h.update(await (await fetch(u)).text());
  const sig = h.digest('hex').slice(0, 16);
  const old = fs.existsSync(SIG) ? fs.readFileSync(SIG, 'utf8').trim() : '';
  if (!fail) fs.writeFileSync(SIG, sig + '\n');
  console.log(`엔진 지문 ${sig}${old && old !== sig ? ` (직전 ${old}에서 바뀜)` : ''}`);
}
await b.close();
console.log(fail || missing ? `실패 ${fail + missing}건: 원고를 지금 도구 동작에 맞게 고치거나(예약 글이면 --update) 검사를 추가` : `전부 통과 ${list.length}건`);
process.exit(fail || missing ? 1 : 0);
