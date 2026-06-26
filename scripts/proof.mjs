// 출력물 검수 페이지 - 실제 PDF가 캡처하는 .doc-page를 1:1로 모아 봄.
// 빨간 선(A4 1123px) 아래로 내용이 넘으면 실제 PDF에서 잘림. 스트레스 케이스 포함.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { tools } from '../data/registry.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
for (const f of ['engine/calc.js', 'engine/doc-render.js']) {
  ctx.module = { exports: {} };
  vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx);
}
const ENGINE = ctx.window.Formda;

function render(tool, override) {
  const s = JSON.parse(JSON.stringify(tool.sample || {}));
  if (s.date === 'today') s.date = '2026-06-24';
  if (override) Object.assign(s, override);
  s.sealImg = null;
  return ENGINE.docRender[tool.docType](s, tool.doc, { single: true });
}

// 스트레스: 문서별 상한만큼 + 긴 텍스트 → 실제 최악 케이스
function stressItems(cap) {
  return Array.from({ length: cap }, (_, i) => ({
    name: '아주 긴 품목명 예시 ' + (i + 1) + ' (상세 옵션·사양 포함 케이스)',
    spec: '규격-' + (i + 1) + '-옵션', qty: 99, price: 12345678,
  }));
}
function stressResume(d) {
  return {
    edu: Array.from({ length: d.maxEdu || 4 }, () => ({ period: '2010.03 ~ 2014.02', school: '아주 긴 학교 이름 예시 대학교', major: '아주 긴 전공명 학과 (학사)', status: '졸업' })),
    career: Array.from({ length: d.maxCareer || 5 }, () => ({ period: '2014.03 ~ 2020.12', company: '아주 긴 회사명 주식회사', role: '아주 긴 직위·부서명 책임', task: '아주 긴 담당업무 설명 예시 케이스' })),
    etc: '컴퓨터활용능력 1급\nTOEIC 990\nOPIc AL\n정보처리기사\n운전면허 1종 보통\n한국사능력검정 1급\nGTQ 1급 (자격 7줄 초과 테스트)',
  };
}

const live = tools.filter((t) => !t.stub && t.toolType !== 'text'); // 텍스트 유틸은 A4 문서 아님
const blocks = live.flatMap((t) => {
  if (t.docType === 'resume') {
    return [
      sheet(`${t.navTitle} — 기본 샘플`, render(t)),
      sheet(`${t.navTitle} — 학력 ${t.doc.maxEdu}·경력 ${t.doc.maxCareer} 최대 + 긴 텍스트 (최악 케이스)`, render(t, stressResume(t.doc))),
    ];
  }
  const cap = (t.doc && t.doc.maxItems) || 10;
  return [
    sheet(`${t.navTitle} — 기본 샘플`, render(t)),
    sheet(`${t.navTitle} — 최대 ${cap}개 + 긴 이름·큰 금액 (최악 케이스)`, render(t, { items: stressItems(cap) })),
  ];
}).join('\n');

function sheet(title, docHtml) {
  return `<div class="pf-block"><h2>${title}</h2>
    <div class="pf-sheet">${docHtml}<div class="pf-cut">↑ A4 한 장 끝 — 이 선 아래로 넘으면 잘림(=상한 낮춰야 함)</div></div></div>`;
}

const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>폼다 출력물 검수</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link rel="stylesheet" href="/styles/tokens.css">
<style>
  body{background:#5b6470;padding:30px 16px;font-family:Pretendard,sans-serif}
  .pf-intro{color:#fff;max-width:794px;margin:0 auto 26px;line-height:1.6;font-size:14px}
  .pf-block{width:794px;margin:0 auto 48px}
  .pf-block h2{color:#fff;font-size:15px;font-weight:700;margin-bottom:10px}
  .pf-sheet{position:relative;width:794px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.35)}
  .pf-sheet .doc-page{height:auto !important;min-height:1123px;overflow:visible !important;box-shadow:none}
  .pf-cut{position:absolute;top:1123px;left:0;right:0;border-top:2px dashed #e11d48;color:#e11d48;font-size:11px;font-weight:700;padding-top:3px;background:rgba(255,0,60,.04)}
</style></head><body>
<div class="pf-intro"><b>출력물 검수</b> - 흰 종이 한 장 = 실제 PDF 1장(A4 고정, 축소 없음). 빨간 점선 = A4 끝(1123px). <b>각 도구의 최대 품목 수로 채운 최악 케이스가 점선 안에 들어오는지</b> 확인하세요. 넘으면 상한을 더 낮춰야 합니다. Ctrl+P로 인쇄 미리보기도 가능.</div>
${blocks}
</body></html>`;

writeFileSync(join(ROOT, 'proof.html'), html);
console.log('생성: proof.html (도구 ' + live.length + '종 × 기본/스트레스)');
