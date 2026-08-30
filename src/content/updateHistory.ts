export interface UpdateHistoryEntry {
  date: `${number}-${number}-${number}`;
  category: '설계' | '개발' | '개선' | '배포';
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateHistoryEntry[] = [
  { date: '2026-08-30', category: '개선', summary: '빈 트레이 장식 이미지와 DOM 수량 오버레이 보강' },
  { date: '2026-08-30', category: '개선', summary: '교실 측정 노트 작업표 시각 세계와 3열 학습 작업대 적용' },
  { date: '2026-08-29', category: '개선', summary: '학습 화면 계층과 모바일 행동 흐름 개선' },
  { date: '2026-08-28', category: '개선', summary: '배포 환경의 단계 초점 인계 보완' },
  { date: '2026-08-28', category: '개선', summary: '학습 단계 안내와 입력·모바일 화면 개선' },
  { date: '2026-08-27', category: '배포', summary: 'GitHub Pages 공개 배포 경로 정리' },
  { date: '2026-08-26', category: '개발', summary: '평균 균형 조정실 MVP 구현' },
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
];
