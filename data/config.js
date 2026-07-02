// 폼다 수익화·측정 설정 (외부 연동 키 단일 원본)
// 비어 있으면 해당 기능은 조용히 비활성화된다(스캐폴딩 단계). 값을 채우고 재빌드하면 켜진다.
//  - GA_ID:        GA4 측정 ID "G-XXXXXXXXXX". 채우면 <head> gtag 로드 + 전 이벤트 전송 시작.
//  - WEB3FORMS_KEY: Web3Forms access key(공개키, 클라이언트 노출 OK). 채우면 이메일/피드백 수집 시작.
// 이벤트: view_pricing / click_single / click_subscribe / submit_email / submit_feedback / create / repeat_create
export const config = {
  GA_ID: '',
  WEB3FORMS_KEY: '',
  PRICE_SINGLE: 1000,   // 단건(워터마크 제거)
  PRICE_SUB: 4900,      // 구독(월, 비즈니스 도구)
  PRICE_SUB_YEAR: 53900, // 구독(연) = 월 11개월치(1개월 할인)
};

// 페이지에 인라인 주입해 브라우저 엔진(track.js·pay.js)이 읽는 공개 설정.
// (모두 클라이언트 노출 가능한 값만 포함)
export function publicConfig() {
  return {
    GA_ID: config.GA_ID,
    WEB3FORMS_KEY: config.WEB3FORMS_KEY,
    PRICE_SINGLE: config.PRICE_SINGLE,
    PRICE_SUB: config.PRICE_SUB,
    PRICE_SUB_YEAR: config.PRICE_SUB_YEAR,
  };
}
