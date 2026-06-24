// 단색 라인 아이콘 세트 (이모지 대체). currentColor 사용 -> 칩 색이 자동 적용.
// 새 도구/카테고리 아이콘은 여기에 path만 추가하고 registry에서 key로 참조.
const PATHS = {
  // 문서/거래
  estimate: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="M9 11h6M9 14.5h6M9 17.5h4"/>',
  statement: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-1 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  receipt: '<path d="M6 2.5h12v19l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 12h6"/>',
  order: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="m9 13 2 2 4-4"/>',
  invoice: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V6.5h4"/><path d="M12 9v8M9.5 11h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
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
