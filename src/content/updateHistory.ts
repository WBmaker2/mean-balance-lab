export interface UpdateHistoryEntry {
  date: `${number}-${number}-${number}`;
  category: '설계' | '개발' | '개선' | '배포';
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateHistoryEntry[] = [
  { date: '2026-08-30', category: '개선', summary: '초등학생용 문장과 가상 모형 안내를 쉽게 정리' },
  { date: '2026-08-30', category: '개선', summary: '재배분 점 시뮬레이션 초기화와 수량 검증 보강' },
  { date: '2026-08-30', category: '개선', summary: '선택 상태와 미션별 점도표·모션 안내 보강' },
  { date: '2026-08-30', category: '개선', summary: '모바일 단계 진입 스크롤과 첫 행동 안내 보강' },
  { date: '2026-08-30', category: '개선', summary: '오답 알림 중복 제거' },
  { date: '2026-08-30', category: '개선', summary: '바구니 동그라미 수량 실시간 시뮬레이션 추가' },
  { date: '2026-08-30', category: '개선', summary: '빈 트레이 장식 이미지와 DOM 수량 오버레이 보강' },
  { date: '2026-08-30', category: '개선', summary: '교실 측정 노트 작업표 시각 세계와 3열 학습 작업대 적용' },
  { date: '2026-08-29', category: '개선', summary: '학습 화면 계층과 모바일 행동 흐름 개선' },
  { date: '2026-08-28', category: '개선', summary: '배포 환경의 단계 초점 인계 보완' },
  { date: '2026-08-28', category: '개선', summary: '학습 단계 안내와 입력·모바일 화면 개선' },
  { date: '2026-08-27', category: '배포', summary: 'GitHub Pages 공개 배포 경로 정리' },
  { date: '2026-08-26', category: '개발', summary: '평균 균형 조정실 MVP 구현' },
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
];
