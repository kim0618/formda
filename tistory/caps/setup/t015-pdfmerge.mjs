// t015 캡처: PDF 합치기는 파일 업로드가 필요해 cap.mjs 대신 이 스크립트로 찍는다.
// 사용: LD_LIBRARY_PATH=$HOME/.local/emulib node caps/setup/t015-pdfmerge.mjs <pdf 폴더> caps/t015-cap.jpg
import fs from 'fs';
const { chromium } = await import('/home/tjd618/.claude/tools/calc-runner/node_modules/playwright/index.mjs');
const [D, out] = process.argv.slice(2);
const pwDir = process.env.HOME + '/.cache/ms-playwright';
const cd = fs.readdirSync(pwDir).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1])[0];
const b = await chromium.launch({ executablePath: `${pwDir}/${cd}/chrome-linux64/chrome` });
const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
p.on('dialog', d => d.accept());
await p.goto('https://formda.kr/tools/pdf-merge', { waitUntil: 'networkidle' });
await p.setInputFiles('#pmFile', ['소득금액증명_스캔.pdf', '주민등록등본.pdf', '재직증명서.pdf'].map(f => D + '/' + f));
await p.waitForTimeout(2000);
await p.click('.pdf-item[data-i="1"] [data-mv="-1"]'); await p.waitForTimeout(400);
const el = await p.$('.tt-wrap');
await el.screenshot({ path: out, type: 'jpeg', quality: 88 });
console.log(await p.$eval('#pmCnt', e => e.innerText), await p.$$eval('.pdf-item', els => els.map(e => e.innerText.replace(/\n/g, ' '))));
await b.close();
