# Task 15 검증 보고서

## 범위

- 공개 한국어 role/label만 사용하는 학습 흐름 helper와 두 브라우저 스펙을 추가했습니다.
- 네 필수 A 자료를 UI로 순서대로 완료하고, 각 미션 결과의 `내가 사용한 근거`, 모델 경계 문구, 드래그 부재, 외부 HTTP 요청 부재를 확인합니다.
- 네 선택 B 자료는 난이도 라디오와 정상 진행으로 접근해 고정 자료값을 확인하고, 해당 자료의 상황 화면에 둡니다.
- 새로 고침 시 오답 계산 피드백은 제거되고 예측·확정 재배분 산출물은 남는지, 잠긴 deep link/back navigation이 canonical stage를 벗어나지 않는지 확인합니다.
- `PredictionPanel`은 outlier만 방향 선택지를 사용하고, 나머지는 `expectedMean - 1`, `expectedMean`, `expectedMean + 1`의 자연수 선택지를 사용하도록 수정했습니다. 그룹 접근성 이름도 자료형에 맞췄습니다.

## RED

- `npm test -- --run` 초기 기준선: 19개 파일, 200개 테스트 통과.
- 첫 신규 focused E2E 실행에서 5개 중 1개만 통과했습니다. 첫 공개-flow gap은 오답 안내가 `자료는 몇 개인가요?` 단독 노드가 아니라 `다음 행동: 자료는 몇 개인가요?`로 렌더되는 점이었습니다.
- 같은 RED 실행에서 반복 B 도전 helper가 이미 완료한 선행 A를 다시 기대하던 문제와 HashRouter의 실제 back history에 맞지 않는 기대도 확인했습니다.
- `CI=1` Chromium 실행은 macOS sandbox의 `MachPortRendezvous ... Permission denied`로 브라우저가 시작되지 않았습니다. 승인된 escalated 실행으로 전환했습니다.

## GREEN 및 명령 결과

- `npm test -- --run src/components/mission/PredictionPanel.test.tsx`: 2개 통과.
- focused E2E (비CI): 4개 통과.
- `CI=1 npm run test:e2e -- tests/e2e/learner-flow.spec.ts tests/e2e/history-and-restore.spec.ts` (승인된 escalated 실행): 4개 통과.
- `npm test -- --run`: 20개 파일, 202개 테스트 통과.
- `CI=1 npm run test:e2e` (승인된 escalated 실행): 13개 통과.
- `npm run typecheck`: 통과.
- `npm run build`: 통과.
- `git diff --check`: 통과.

## 변경 파일

- `src/components/mission/PredictionPanel.tsx`
- `src/components/mission/PredictionPanel.test.tsx`
- `src/app/router.test.tsx`
- `tests/e2e/helpers/learner.ts`
- `tests/e2e/learner-flow.spec.ts`
- `tests/e2e/history-and-restore.spec.ts`

## 제약 확인

- `page.evaluate` 상태 주입, storage seed, fixture query parameter, hidden route, test-only application API를 새 helper/spec에 사용하지 않았습니다.
- 드래그·중앙값·최빈값·그래프 편집·실제 입력/계정/대시보드/리더보드/AI 채점은 추가하지 않았습니다.
- 변경한 소스와 테스트 파일은 모두 500줄 미만입니다.
- `progress.md`는 존재하지 않았고 생성·수정하지 않았습니다.
- 패키지 설치, git init, push, deploy는 실행하지 않았습니다.
