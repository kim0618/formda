// 단색 라인 아이콘 세트 (이모지 대체). currentColor 사용 -> 칩 색이 자동 적용.
// 새 도구/카테고리 아이콘은 여기에 path만 추가하고 registry에서 key로 참조.
const PATHS = {
  // 문서/거래
  estimate: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="M9 11h6M9 14.5h6M9 17.5h4"/>',
  statement: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-1 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  receipt: '<path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 12h6"/>',
  order: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="m9 13 2 2 4-4"/>',
  invoice: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="M12 9v8M9.5 11h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
  // 취업
  'cover-letter': '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 11h8M8 14h8M8 17h5"/>',
  career: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/><path d="M7 12h4M7 15h10M13 12h4"/>',
  employment: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7.5 8h9M7.5 11h9M7.5 14h4"/><circle cx="15" cy="16.5" r="2.4"/><path d="m13.8 18.2-.6 2.3 1.8-1 1.8 1-.6-2.3"/>',
  resume: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="8.4" r="1.8"/><path d="M6.2 13.4c.4-1.4 1.5-2.2 2.8-2.2s2.4.8 2.8 2.2"/><path d="M13.5 8h3.5M13.5 11h3.5M7 16.4h10M7 18.7h7"/>',
  resignation: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7.5 8h9M7.5 11h5"/><path d="m11.5 18 5.2-5.2a1.6 1.6 0 0 1 2.3 2.3L13.8 20.3l-3 .7.7-3z"/>',
  // 생활
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="11" r="1.8"/><path d="M5.5 15.2c.4-1.2 1.3-1.9 2.5-1.9s2.1.7 2.5 1.9"/><path d="M13.5 10h4.5M13.5 13h4.5"/>',
  notice: '<path d="M4 9.5 12 4l8 5.5"/><path d="M6 11v8.5h12V11"/><path d="M9.5 14.5h5M9.5 17h3"/>',
  award: '<circle cx="12" cy="9" r="5.2"/><path d="m9 13.4-1.6 7.1 4.6-2.4 4.6 2.4-1.6-7.1"/><path d="m12 6.4.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.5l2-.3z"/>',
  loan: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9.5 9.8 13 12 9.5 14.2 13 16 9.5"/><path d="M8.3 13.4h7.4M8.3 15.4h7.4"/>',
  mandate: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7.5 8h9M7.5 11h6"/><circle cx="14.5" cy="16" r="3"/><path d="m13.2 16 1 1 1.8-2"/>',
  // 텍스트 유틸
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M19.5 14h1.5M21 17.5v1.5M14 19.5h3v1.5M19.5 21h1.5"/>',
  count: '<path d="M5 5h14M5 5v3M19 5v3M12 5v14M9 19h6"/>',
  roman: '<path d="M4 18 8 6l4 12"/><path d="M5.5 14h5"/><path d="M14 11h6M17 8v9"/>',
  addr: '<path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z"/><circle cx="12" cy="11" r="2.3"/>',
  align: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  // 카테고리
  business: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/><path d="M3 12.5h18"/>',
  job: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="10" r="2.6"/><path d="M7.5 17.5c.6-2 2.4-3 4.5-3s3.9 1 4.5 3"/>',
  life: '<path d="M4 11 12 4l8 7"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5h4v5"/>',
  text: '<path d="M5 6.5V5h13v1.5"/><path d="M11.5 5v14"/><path d="M9 19h5"/>',
};

export function svg(key) {
  const d = PATHS[key] || PATHS.estimate;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

export function iconChip(key, cls = '') {
  return `<span class="icon-chip ${cls}">${svg(key)}</span>`;
}
