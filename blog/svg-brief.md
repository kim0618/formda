# 폼다 네이버 블로그 SVG 비주얼 제작 지침 (클로드 웹용)

## 출력 방법 (중요)
- **SVG를 HTML 아티팩트로 렌더**해서 화면에 그려줘. 사용자가 그 아티팩트를 **캡처(스크린샷)**해서 네이버에 이미지로 업로드함.
- 한 아티팩트에 비주얼 여러 장을 세로로 쌓아서 한 번에 보여줘도 됨(각각 캡처).
- 캔버스 폭은 네이버 본문 기준 **가로 800~1080px**, 배경 흰색 또는 아래 라이트 그라데이션.

## 브랜드 토큰 (formda styles/tokens.css 실값, 그대로 사용)
- 포인트 인디고 `#4f46e5` / 진한 인디고 `#4338ca` / 잉크(제목) `#1a1a2e`
- 배경 라이트 `#f8fafc` / 인디고 소프트 `#eef2ff` / 회색 텍스트 `#6b7280` / 라인 `#e5e7eb`
- 폰트 `Pretendard, 'Apple SD Gothic Neo', sans-serif`
- 톤: 화이트+인디고 미니멀. 검정 배경·형광색·그림자 남발 금지.

## 핵심 규칙: 완성 문서 목업은 "회색 플레이스홀더 바"
- 문서 안의 실제 텍스트(이름·주소·상세)는 **회색 둥근 사각형 바(`#e5e7f2`·`#d8dcec`)**로 처리 → 완성 문구 노출 0 자동 충족.
- 단 **핵심 값 1~2개(금액·이자율·기일 등)만 실제 숫자로** 강조(가상 데이터). 예: 금액 30,000,000원, 이자율 연 5%.
- 예시 숫자도 법적 유효값 유지(이자 연 20% 이내 등).
- 하단에 작게 `폼다 · formda.kr` 워터마크.

## 글당 비주얼 세트 (2~3장)
1. **문서 목업 1장** — A4 카드(흰 배경, 상단 인디고 바 6px, 가운데 문서 제목 자간 넓게, 회색 플레이스홀더 바 + 핵심값 강조 박스). 문서 종류만 바꿔 재사용.
2. **입력→PDF 플로우 또는 Before/After 1장** — 왼쪽 "손으로/막막함" → 화살표 → 오른쪽 "폼다 완성 PDF". 또는 3단계(입력→미리보기→PDF).
3. **(상식·법률 글) 수치·체크리스트 인포그래픽 1장** — 법조문 수치(이자 20%·소멸시효 10년 등)를 카드/막대/체크리스트로. 표만 반복 금지, 유형 섞기.

## 문서 목업 템플릿 (이걸 복사해서 제목·항목·값만 교체)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1120" viewBox="0 0 900 1120" font-family="Pretendard, 'Apple SD Gothic Neo', sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="26" flood-color="#1a1a2e" flood-opacity="0.15"/></filter>
  </defs>
  <rect width="900" height="1120" fill="url(#bg)"/>
  <circle cx="820" cy="90" r="170" fill="#4f46e5" opacity="0.06"/>
  <circle cx="70" cy="1040" r="140" fill="#4f46e5" opacity="0.05"/>
  <g filter="url(#sh)">
    <rect x="150" y="90" width="600" height="900" rx="14" fill="#ffffff"/>
    <rect x="150" y="90" width="600" height="10" rx="5" fill="#4f46e5"/>
    <text x="450" y="200" font-size="42" font-weight="800" fill="#1a1a2e" text-anchor="middle" letter-spacing="14">문 서 제 목</text>
    <line x1="200" y1="232" x2="700" y2="232" stroke="#1a1a2e" stroke-width="2.5"/>
    <!-- 핵심값 강조 박스 -->
    <rect x="200" y="270" width="500" height="86" rx="10" fill="#eef2ff" stroke="#c7cef5"/>
    <text x="224" y="322" font-size="24" font-weight="700" fill="#4338ca">항목명</text>
    <text x="676" y="324" font-size="30" font-weight="800" fill="#1a1a2e" text-anchor="end">30,000,000 원</text>
    <!-- 당사자 박스 2개 (회색 플레이스홀더) -->
    <rect x="200" y="386" width="240" height="150" rx="8" fill="#f7f8fa" stroke="#e5e7f2"/>
    <text x="220" y="418" font-size="16" font-weight="700" fill="#4b5563">당사자 A</text>
    <rect x="220" y="438" width="150" height="10" rx="5" fill="#d8dcec"/><rect x="220" y="464" width="200" height="10" rx="5" fill="#e5e7f2"/><rect x="220" y="490" width="120" height="10" rx="5" fill="#e5e7f2"/>
    <rect x="460" y="386" width="240" height="150" rx="8" fill="#f7f8fa" stroke="#e5e7f2"/>
    <text x="480" y="418" font-size="16" font-weight="700" fill="#4b5563">당사자 B</text>
    <rect x="480" y="438" width="150" height="10" rx="5" fill="#d8dcec"/><rect x="480" y="464" width="200" height="10" rx="5" fill="#e5e7f2"/><rect x="480" y="490" width="120" height="10" rx="5" fill="#e5e7f2"/>
    <!-- 조건 행 -->
    <text x="200" y="588" font-size="17" font-weight="600" fill="#4b5563">조건 1</text><text x="700" y="588" text-anchor="end" font-size="17" font-weight="800" fill="#1a1a2e">연 5.0 %</text>
    <line x1="200" y1="606" x2="700" y2="606" stroke="#eef0f6" stroke-width="2"/>
    <!-- 본문 라인 (회색) -->
    <rect x="200" y="700" width="500" height="11" rx="4" fill="#eef0f6"/><rect x="200" y="732" width="500" height="11" rx="4" fill="#eef0f6"/><rect x="200" y="764" width="360" height="11" rx="4" fill="#eef0f6"/>
    <!-- 도장 -->
    <circle cx="640" cy="892" r="42" fill="none" stroke="#e07a7a" stroke-width="3" opacity="0.55"/><text x="640" y="900" font-size="17" font-weight="700" fill="#e07a7a" text-anchor="middle" opacity="0.6">인</text>
  </g>
  <text x="450" y="1048" font-size="24" font-weight="800" fill="#4f46e5" text-anchor="middle" letter-spacing="-1">폼다 · formda.kr</text>
</svg>
```

## 인포그래픽/플로우 색 규칙
- 강조=`#4f46e5`, 보조 텍스트=`#6b7280`, 카드 배경=`#eef2ff` 또는 `#f8fafc`, 라인=`#e5e7eb`.
- 데이터는 본문 수치와 100% 일치. 없는 수치 지어내지 말 것.
- 접근성: `role="img"` + `<title>` 포함.

## 금지
- 검정 배경(옛 JAY KIM 톤)·형광 원색·과한 그림자
- 완성 문서에 실제 문장 채우기(회색 바로)
- "워터마크 없음" 뉘앙스(무료지만 흑백 워터마크 있음)
- formda 도구 URL 추측(slug는 브리핑 5번 목록만)
