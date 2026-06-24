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

eq('won 포맷', calc.won(3630000), '3,630,000 원');
eq('cleanInt 자릿수제한', calc.cleanInt('12,345,678,901,234', 10).value, 1234567890);
eq('esc', calc.esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');

console.log(`\n검산: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
