export interface UpdateHistoryEntry {
  date: `${number}-${number}-${number}`;
  category: '설계' | '개발' | '개선' | '배포';
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateHistoryEntry[] = [
  { date: '2026-08-28', category: '개선', summary: '학습 단계 안내와 입력·모바일 화면 개선' },
  { date: '2026-08-27', category: '배포', summary: 'GitHub Pages 공개 배포 경로 정리' },
  { date: '2026-08-26', category: '개발', summary: '평균 균형 조정실 MVP 구현' },
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
];
