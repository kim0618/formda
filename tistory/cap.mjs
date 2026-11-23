// 폼다 도구 캡처(입력 + 미리보기): node cap.mjs <out.jpg> <도구 slug 예: resignation> <setup.js>
// setup.js = 페이지 안에서 실행할 코드. 입력칸은 id="f-<키>". 값 넣는 함수 set(id, 값)이 미리 정의돼 있다.
// 마지막 식의 값이 콘솔에 찍힌다(미리보기에 들어간 글자 확인용). 실행: LD_LIBRARY_PATH=$HOME/.local/emulib node cap.mjs ...
// MODE=preview 이면 미리보기 문서만, 기본은 입력칸+미리보기 둘 다.
import fs from 'fs';
const { chromium } = await import('/home/tjd618/.claude/tools/calc-runner/node_modules/playwright/index.mjs');
const [out, slug, setupFile] = process.argv.slice(2);
const pwDir = process.env.HOME + '/.cache/ms-playwright';
const cd = fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const b = await chromium.launch({ executablePath: `${pwDir}/${cd}/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: +(process.env.VIEW_W || 1280), height: 1600 }, deviceScaleFactor: 2 });
await p.goto(`https://formda.kr/tools/${slug}`, { waitUntil: 'networkidle' });
const helper = `function set(id, v){ const e=document.getElementById(id.startsWith('f-')?id:'f-'+id); if(!e) throw new Error('입력칸 없음: '+id);
  if(e.type==='checkbox'){ e.checked=!!v; } else { e.value=v; }
  e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }\n`;
const res = await p.evaluate(`(async () => { ${helper} const sleep = (ms) => new Promise(r => setTimeout(r, ms)); return await eval(${JSON.stringify('(async () => {' + fs.readFileSync(setupFile, 'utf8').replace(/([^;\n]+);?\s*$/, 'return ($1);') + '})()')}); })()`);
console.log('setup 결과:', res);
await p.waitForTimeout(1500);
await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e).position; if (s === 'fixed' || s === 'sticky') e.style.display = 'none'; } });
await p.evaluate(() => { for (const b of document.querySelectorAll('button')) for (const n of b.childNodes) if (n.nodeType === 3) n.textContent = n.textContent.replace(/[\u2728\u2726]\s*/g, ''); }); // 헤드리스에 이모지 글꼴이 없어 네모로 찍힌다
await p.evaluate(() => { // 유료 저장 안내 카드 숨김(글에 광고처럼 보이지 않게)
  for (const e of document.querySelectorAll('.pane-preview *')) if (!e.querySelector('#doc') && e.id !== 'doc' && !e.closest('#doc') && /워터마크 없이 저장|더 깔끔하게/.test(e.innerText || '') && e.parentElement && !/워터마크 없이 저장|더 깔끔하게/.test(e.parentElement.innerText.replace(e.innerText, ''))) e.style.visibility = 'hidden'; });
// 기본: 입력칸+미리보기를 문서 아래 끝까지(유료 저장 안내 카드는 잘라 낸다). MODE=preview 이면 문서(#doc)만.
const box = await p.evaluate((mode) => {
  const r = (q) => document.querySelector(q)?.getBoundingClientRect();
  const doc = r('#doc');
  if (mode && mode.includes('|')) { // MODE='#a|.b' = 두 요소를 함께 감싸는 가장 작은 상자 (서류 양식이 아닌 텍스트 도구용)
    const [qa, qb] = mode.split('|'); let e = document.querySelector(qa); const t = document.querySelector(qb);
    while (e.parentElement && !e.contains(t)) e = e.parentElement; const q = e.getBoundingClientRect();
    return { x: q.left, y: q.top + scrollY, width: q.width, height: Math.min(q.height, 1800) }; }
  if (mode === 'preview') return { x: doc.left, y: doc.top + scrollY, width: doc.width, height: doc.height };
  const f = r('#formPanel'), pv = r('.pane-preview'), wrap = r('.preview-wrap') || doc;
  const top = Math.min(f.top, pv.top), bottom = Math.max(wrap.bottom, doc.bottom) + 16;
  return { x: Math.min(f.left, pv.left), y: top + scrollY, width: Math.max(f.right, pv.right) - Math.min(f.left, pv.left), height: Math.min(bottom - top, 1800) };
}, process.env.MODE || '');
const tmp = out + '.full.png';
await p.screenshot({ path: tmp, clip: box, fullPage: true });
console.log('미리보기 글자:', (await p.evaluate(() => (document.querySelector('#doc') || document.querySelector('main'))?.innerText || '')).replace(/\s+/g, ' ').slice(0, 300));
await b.close();
const { execFileSync } = await import('child_process');
execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('${tmp}').convert('RGB')
im=im.resize((1100,int(im.size[1]*1100/im.size[0])),Image.LANCZOS); im.save('${out}',quality=86)
print('저장',im.size)`], { stdio: 'inherit' });
fs.unlinkSync(tmp);
