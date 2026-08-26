export interface UpdateHistoryEntry {
  date: `${number}-${number}-${number}`;
  category: '설계' | '개발' | '개선';
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateHistoryEntry[] = [
  { date: '2026-08-26', category: '개발', summary: '평균 균형 조정실 MVP 구현' },
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
];
