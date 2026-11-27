// 엔진 검산 - calc.js를 실제로 로드해 부가세/한글금액/콤마 검증 (vm 샌드박스)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(ROOT, 'engine/calc.js'), 'utf8');
const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const calc = ctx.window.Formda.calc;

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = got === want;
  console.log((ok ? '  ✓' : '  ✗') + ' ' + name + (ok ? '' : ` (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`));
  ok ? pass++ : fail++;
}

const items = [
  { name: '웹사이트 제작', qty: 1, price: 3000000 },
  { name: '유지보수 (월)', qty: 3, price: 100000 },
]; // 공급가 3,300,000

const sep = calc.totals(items, '0.1');
eq('VAT 별도 공급가', sep.supply, 3300000);
eq('VAT 별도 세액', sep.vat, 330000);
eq('VAT 별도 합계', sep.total, 3630000);

const incl = calc.totals(items, 'incl');
eq('VAT 포함 합계', incl.total, 3300000);
eq('VAT 포함 공급가', Math.round(incl.supply), 3000000);
eq('VAT 포함 세액', Math.round(incl.vat), 300000);

const none = calc.totals(items, '0');
eq('VAT 없음 합계', none.total, 3300000);

eq('한글금액 3,630,000', calc.korAmount(3630000), '삼백육십삼만');
eq('한글금액 0', calc.korAmount(0), '영');
eq('한글금액 1억2천', calc.korAmount(120000000), '일억이천만');
eq('한글금액 10001', calc.korAmount(10001), '일만일');
eq('한글금액 1천만', calc.korAmount(10000000), '일천만');
eq('한글금액 111,110,000', calc.korAmount(111110000), '일억일천일백일십일만');

eq('won 포맷', calc.won(3630000), '3,630,000 원');
eq('cleanInt 자릿수제한', calc.cleanInt('12,345,678,901,234', 10).value, 1234567890);
eq('esc', calc.esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');

// 예시값 → 입력칸 채우기 누락 검사 (11/27 프리랜서·내용증명·해외여행 동의서에서 입력칸은 비고 PDF엔 예시가 찍히던 버그 재발 방지)
// 예시값에 문자열 키가 있고 그 키의 입력칸(f-키)이 폼에 있는데, app.js applyState가 그 키를 채우지 않으면 FAIL
{
  const app = readFileSync(join(ROOT, 'engine/app.js'), 'utf8');
  const a = app.slice(app.indexOf('applyState: function'));
  const body = a.slice(0, a.indexOf('\n    },\n'));
  const form = readFileSync(join(ROOT, 'engine/form-engine.js'), 'utf8');
  const { tools } = await import('../data/registry.js');
  const miss = [];
  for (const t of tools) {
    for (const [k, v] of Object.entries(t.sample || {})) {
      if (typeof v !== 'string' || k === 'date') continue;
      const hasInput = form.includes("lf('" + k + "'") || form.includes('id="f-' + k + '"');
      if (hasInput && !body.includes("'" + k + "'") && !app.includes("'f-" + k + "'")) miss.push(t.slug + '.' + k);
    }
  }
  eq('예시값 입력칸 채우기 누락 0' + (miss.length ? ' (' + miss.join(', ') + ')' : ''), miss.length, 0);
}

console.log(`\n검산: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
