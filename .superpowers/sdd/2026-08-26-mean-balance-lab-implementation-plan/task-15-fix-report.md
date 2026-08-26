# Task 15 finding 수정 보고서

## 범위

- 자료 종류별 예측 선택지와 검증을 `src/domain/prediction.ts`로 분리하고 UI, reducer, 저장 복원 검증이 같은 계약을 사용하도록 했습니다.
- 오답 피드백은 실제 화면 문구를 exact role/text로 확인하고, reload 뒤 read-only `sessionStorage` payload의 `transientFeedback: null`을 검증합니다.
- 정답 계산도 공개 UI로 만든 뒤 reload하여 방정식·성공 문구가 사라지고 입력 폼이 다시 나타나며 payload의 `verified: false`가 되는지 확인합니다.
- 선택 B 자료 검증을 4개의 독립 Playwright test로 나누고, 각 helper가 대상 미션 전 필수 A 미션을 순서대로 완료하며 `다음 미션`을 assert하도록 했습니다.
- 전체 결과의 `내가 사용한 근거` 4개를 개별 `nth` locator로 각각 visible인지 확인하고, balance active calculation 단계에서 `/explain` 직접 이동·browser back 모두 canonical `/calculate`로 돌아오는지 추가했습니다.

## TDD 기록

- RED 기준: 기존 Task 15 리뷰가 cross-kind prediction 수용, sanitize 미증명, optional prerequisite silent skip, 근거 heading visibility 미검증, active-run history 미검증을 확인했습니다. 기존 오답 locator는 실제 렌더 문구(`다음 행동: ...`)와 불일치했습니다.
- RED 실행 중 비-CI E2E는 포트 4173의 다른 앱 재사용으로 잘못된 화면을 읽었고, `CI=1` Chromium은 macOS sandbox의 MachPort 권한 오류가 났습니다. stale 서버를 확인·종료한 뒤 승인된 escalated Chromium으로 전환했습니다.
- GREEN 구현 후 새 prediction/unit 경계 테스트와 UI 테스트가 통과했고, focused learner/history 및 전체 검증을 재실행했습니다.

## 검증 결과

- `CI=1 npm run test:e2e -- tests/e2e/learner-flow.spec.ts tests/e2e/history-and-restore.spec.ts` — 9 passed (승인된 escalated 실행)
- `CI=1 npm run test:e2e` — 18 passed (승인된 escalated 실행)
- `npm test -- --run` — 22 files, 206 tests passed
- `npm run typecheck` — passed
- `npm run build` — passed
- `git diff --check` — passed
- TS/TSX/CSS source and test line-count gate — all files under 500 lines
- 앱 소스의 placeholder 문자열 없음(테스트에서 HTML placeholder 부재를 검사하는 의도된 문자열만 존재)

## 변경 파일

- `src/domain/prediction.ts`
- `src/domain/prediction.test.ts`
- `src/domain/prediction-boundaries.test.ts`
- `src/domain/session.ts`
- `src/state/persistence.ts`
- `src/components/mission/PredictionPanel.tsx`
- `tests/e2e/helpers/learner.ts`
- `tests/e2e/learner-flow.spec.ts`
- `tests/e2e/history-and-restore.spec.ts`
- 본 보고서

## 제약 확인

- `page.evaluate`는 reload 후 `sessionStorage` payload를 읽는 용도로만 사용했으며 상태 주입·seed·수정은 하지 않았습니다.
- 설치, push, deploy, 외부 API 호출, `progress.md` 수정은 하지 않았습니다.
- Task 15 수정 범위 밖의 기능(중앙값·최빈값·그래프 편집·실제 자료 입력·계정·AI 채점)은 추가하지 않았습니다.
