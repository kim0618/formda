// 원고 HTML을 휴대폰 폭(본문 340px, 글자 16px)으로 렌더해 표·이미지가 넘치는지 본다: node mobile_check.mjs posts/t00*.html
import fs from 'fs';
const { chromium } = await import('/home/tjd618/.claude/tools/calc-runner/node_modules/playwright/index.mjs');
const pwDir = process.env.HOME + '/.cache/ms-playwright';
const cd = fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const b = await chromium.launch({ executablePath: `${pwDir}/${cd}/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 390, height: 800 } });
let bad = 0;
for (const f of process.argv.slice(2)) {
  const html = fs.readFileSync(f, 'utf8');
  await p.setContent(`<html><head><meta name=viewport content="width=device-width"><style>body{margin:0;font-family:'Noto Sans KR',sans-serif;font-size:16px;line-height:1.8}#c{width:340px;margin:0 25px;overflow:hidden}</style></head><body><div id=c>${html}</div></body></html>`);
  const r = await p.evaluate(() => [...document.querySelectorAll('#c table')].map((t, i) => ({ i, w: Math.round(t.scrollWidth), max: 340 })));
  const over = r.filter(x => x.w > x.max + 1);
  console.log(f.split('/').pop(), over.length ? 'OVER ' + JSON.stringify(over) : 'ok', r.map(x => x.w).join(','));
  bad += over.length;
}
await b.close(); process.exit(bad ? 1 : 0);
