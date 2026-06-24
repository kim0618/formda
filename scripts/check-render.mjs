// 렌더 스모크 테스트 - calc+doc-render+form-engine을 실제 로드해 견적서 마크업 검증
// (브라우저 없이 순수 문자열 렌더 파이프라인을 확인)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { tools } = await import('../data/registry.js');

const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
for (const f of ['engine/calc.js', 'engine/doc-render.js', 'engine/form-engine.js']) {
  ctx.module = { exports: {} };
  vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx);
}
const F = ctx.window.Formda;

let pass = 0, fail = 0;
function ok(name, cond) {
  console.log((cond ? '  ✓' : '  ✗') + ' ' + name);
  cond ? pass++ : fail++;
}

const tool = tools[0];
const state = JSON.parse(JSON.stringify(tool.sample));
state.date = '2026-06-24';
state.sealImg = null;

const docHTML = F.docRender[tool.docType](state, tool.doc);
ok('A4 페이지 래퍼', docHTML.includes('doc-pages') && docHTML.includes('doc-page'));
ok('문서 제목 출력', docHTML.includes('견 적 서'));
ok('공급자 상호', docHTML.includes('폼다상사'));
ok('공급자 라벨 박스', docHTML.includes('공급자') && docHTML.includes('qt-supplier'));
ok('표준 항목(대표자·업태/종목)', docHTML.includes('대표자') && docHTML.includes('업태/종목') && docHTML.includes('김폼다'));
ok('품목표 규격 열', docHTML.includes('<th>규격</th>') && docHTML.includes('반응형'));
ok('수신처 + 귀하', docHTML.includes('○○ 주식회사') && docHTML.includes('귀하'));
ok('합계 자동계산 (3,630,000)', docHTML.includes('3,630,000'));
ok('한글금액(一金 ...원整)', docHTML.includes('一金 삼백육십삼만원整'));
ok('도장칸 (인)', docHTML.includes('(인)'));
ok('비고 줄바꿈 유지', docHTML.includes('입금계좌'));

// 무료: 항상 1페이지
const onePage = (docHTML.match(/class="doc-page"/g) || []).length === 1;
ok('품목 2개 → 1페이지', onePage);

// 품목 많아도 1페이지 (멀티페이지 없음)
const many = JSON.parse(JSON.stringify(tool.sample));
many.date = '2026-06-24';
many.items = Array.from({ length: 14 }, (_, i) => ({ name: '품목' + (i + 1), qty: 1, price: 1000 }));
const manyHtml = F.docRender[tool.docType](many, tool.doc);
ok('품목 14개도 1페이지', (manyHtml.match(/class="doc-page"/g) || []).length === 1);

// 썸네일 single 모드: 정확히 1페이지
const thumb = F.docRender[tool.docType](state, tool.doc, { single: true });
ok('썸네일 single = 1페이지', (thumb.match(/doc-page/g) || []).length === 1 && !thumb.includes('doc-pages'));

// 도장 이미지 적용 시
state.sealImg = 'data:image/png;base64,XXX';
const sealed = F.docRender[tool.docType](state, tool.doc);
ok('도장 이미지 교체', sealed.includes('qt-seal-img') && !sealed.includes('(인)'));

// XSS/마크업 깨짐 방지
const evil = JSON.parse(JSON.stringify(tool.sample));
evil.from = '<script>x</script>';
evil.date = '2026-06-24';
const escaped = F.docRender[tool.docType](evil, tool.doc);
ok('사용자 입력 이스케이프', escaped.includes('&lt;script&gt;') && !escaped.includes('<script>x'));

// 입력폼 생성
const formHTML = F.formEngine[tool.docType](tool.doc);
ok('입력폼 - 견적일자 라벨', formHTML.includes('견적일자'));
ok('입력폼 - 도장 업로드', formHTML.includes('이미지 업로드'));
ok('입력폼 - 품목 추가 버튼', formHTML.includes('+ 품목 추가'));
ok('입력폼 - 부가세 셀렉트', formHTML.includes('10% 별도'));

const rows = F.formEngine.itemRows(state.items);
ok('품목행 단가 콤마', rows.includes('3,000,000'));

console.log(`\n렌더 스모크: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
