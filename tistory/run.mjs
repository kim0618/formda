// 폼다 도구 페이지에서 값 뽑기: node run.mjs <도구 slug> <expr.js>  (expr 마지막 식 = JSON 가능한 값)
// 예: 견적서에 수량·단가를 넣고 미리보기 문서(#doc)의 합계 글자를 읽는다. 입력칸은 id="f-<키>", set(id, 값) 함수 제공.
import fs from 'fs';
const { chromium } = await import('/home/tjd618/.claude/tools/calc-runner/node_modules/playwright/index.mjs');
const [slug, f] = process.argv.slice(2);
const pwDir = process.env.HOME + '/.cache/ms-playwright';
const cd = fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const b = await chromium.launch({ executablePath: `${pwDir}/${cd}/chrome-linux64/chrome` });
const p = await b.newPage();
await p.goto(`https://formda.kr/tools/${slug}`, { waitUntil: 'networkidle' });
const helper = `function set(id, v){ const e=document.getElementById(id.startsWith('f-')?id:'f-'+id); if(!e) throw new Error('입력칸 없음: '+id);
  if(e.type==='checkbox'){ e.checked=!!v; } else { e.value=v; }
  e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); }
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));\n`;
console.log(JSON.stringify(await p.evaluate(`(async () => { ${helper} return await eval(${JSON.stringify('(async () => {' + fs.readFileSync(f, 'utf8').replace(/([^;\n]+);?\s*$/, 'return ($1);') + '})()')}); })()`), null, 0));
await b.close();
