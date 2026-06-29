# 폼다 가이드 스킬 계획 (/formda-guide)

제이퍼 `/blog` 스킬(jptcalc/.claude/commands/blog.md + rules 3종)의 품질·구조를 폼다 가이드 시스템(data/guides.js → templates/guide-page.mjs → /guides/{slug}.html)에 이식한다.

## 0. 위치 (확정 필요)
- **권장: 프로젝트 `formda/.claude/commands/formda-guide.md` + 전역 심링크 노출** (메모리 feedback_skill_location 규칙)
- 보조 규칙은 `formda/.claude/rules/guide-quality.md`, `guide-html.md`로 분리
- 커맨드명 후보: `/formda-guide` (전역에서 사이트 구분되게)

## 1. 편수 원칙 (최우선)
- 사용자가 수를 명시하지 않으면 **1편만** 작성. "5편" 등 명시 시 그 수.
- 자의적으로 편수 늘리지 않는다.

## 2. 주제 선정 (2단계)
### Phase 1 — 런칭 전: 도구 커버리지 우선 (현재 단계)
- **목표: 20개 도구 각 1편(=가이드 20편) 베이스라인** + 허브/비교 가이드 약 5편 → 런칭 ~20~25편
- 우선순위(검색량·범용성 높은 순):
  1. 견적서(✓ 완료) · 거래명세서 · 영수증 · 이력서 · 자기소개서
  2. 사직서 · 차용증 · 위임장 · 명함 · 재직증명서
  3. 발주서 · 청구서 · 경력기술서 · 상장 · 가정통신문
  4. 텍스트 5종(글자수·영문이름·주소·정렬·QR)은 묶음/개별 판단
- **허브·비교 가이드(롱테일·ChatGPT 인용 magnet)**:
  - "견적서 vs 거래명세서 vs 세금계산서 차이"
  - "프리랜서·1인사업자가 챙겨야 할 거래 문서 5가지"
  - "퇴사할 때 필요한 서류 총정리(사직서·재직증명서·경력증명)"
  - "개인 간 돈거래 안전하게 — 차용증·공증·이자제한법"
  - "취업 서류 3종(이력서·자소서·경력기술서) 한 번에 준비하기"
- 스킬 본문에 **체크리스트 큐**를 두고 작성 시 `[완료 날짜]` 표기(누적).

### Phase 2 — 런칭 후: 네이버/GA 데이터 큐 (제이퍼 방식)
- 네이버 서치어드바이저 검색어/웹문서 TOP30 기반 큐 갱신(월 1회, feedback_report_thin_page_false_positive 주의)
- /report·GA로 먹힌 주제 더블다운, 클러스터 운영. (트래픽 쌓인 뒤 활성화)

## 3. 품질 기준 (제이퍼 rule 이식)
- **분량: 순수 텍스트 2,500자 이상** (HTML 제외). 기존 견적서 가이드는 ~26K자 — 과하므로 2,500~6,000자 적정선.
- **구체 예시 3~4개**: 이름·상황 명시 시나리오 → 결과(예: "프리랜서 디자이너 김OO, 시안비 300만 원 견적 시…").
- **FAQ 4~5개**: JSON-LD FAQPage와 Q&A 일치(guide-page가 자동 생성).
- **교차링크**: relatedTools(지원 도구 1 + 형제 2) + 본문 내 도구 CTA. 도구↔가이드 양방향(도구 페이지의 guidesByTool 매핑도 확인).
- **금지**: "안녕하세요 오늘은…" AI 인사 도입부 / 하이픈(-)으로 시작하는 리스트(ul·li 사용) / em dash(—)→하이픈 / "다양한·여러 가지" 남발 → 구체 수치·사례.
- 표준·법령 수치는 **web 검증 후 작성**(추측 금지) — 도구 본문 제작 때와 동일 원칙.

## 4. guides.js 엔트리 스키마 (작성 대상)
`{ slug, category, tool, navTitle, title, seoTitle, seoDescription, keywords[7±], date, readMin, lead, toc[5~7], sections[{h,html} 6~8], faq[{q,a} 4~5], closing{}, relatedTools[3] }`
- guide-page.mjs가 JSON-LD 3종(Article·FAQPage·BreadcrumbList)·TOC·관련 섹션 자동 렌더.

## 5. 작성 절차
1. 주제 선택(큐/사용자 지정) → 중복 확인(`guides` slug)
2. (필요 시) web으로 표준·수치 검증
3. data/guides.js에 엔트리 추가(sections는 g-table·tbl-scroll·예시·li 활용)
4. relatedTools 지정 + 해당 도구 페이지 역링크 노출 확인
5. `node scripts/build.mjs` → `/guides/{slug}.html` + sitemap 자동 생성
6. **검증**: 텍스트 ≥2,500자 · FAQ↔JSON-LD 일치 · relatedTools 유효 · 금지표현 0 · JSON-LD 파싱
7. 1줄 보고(슬러그·분량·연결)

## 6. 신설할 가드 (선택, 권장)
- `scripts/check-guide.mjs`: 가이드별 텍스트 길이·FAQ/JSON-LD 정합·relatedTools 존재·금지어 스캔. (제이퍼 check-post-chrome 대응)

## 7. 배포·git
- 빌드까지만(배포 rsync는 사용자), git은 사용자(메모리 규칙).

---
### 다음 확정 사항
1. 스킬 위치: 프로젝트+심링크(권장) vs 전역
2. 런칭 가이드 편수 목표: 20(도구 1:1) +허브 5 = ~25 (권장)
3. 생산 속도: 런칭 전 배치(예: 1일 2~3편) vs 1일 1편
