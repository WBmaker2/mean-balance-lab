# Task 11 Implementation Report

## Result

Task 11 구현을 완료했습니다. 구현 커밋은 `17a2d85bf563df39e6d1eecd91464c8f47b282ed` (`feat: add evidence-first summaries`)입니다.

## TDD 증거

처음 추가한 reducer RED 테스트는 `UPDATE_EVIDENCE_ATTEMPT` action과 reducer 분기가 없어 두 테스트가 실패했습니다. 실패 증거는 `src/domain/session.test.ts`의 두 테스트가 `undefined.attempts`를 읽으려다 실패한 것입니다. 최소 구현으로 canonical 기존 attempt 검증, 동일 revision 유지, active run 동일 evidence 동기화를 추가한 뒤 해당 테스트가 통과했습니다.

이후 결과 화면·교사용 요약·미션 결과 진입·순차 미션 선택·직접 결과 잠금·인쇄·리셋·편집을 테스트로 고정하고 구현했습니다. 기존 router 테스트의 Task 7 임시 `/results` redirect 기대는 Task 11의 실제 `mission-result` 화면 계약에 맞춰 갱신했습니다.

## 변경 파일과 책임

- `src/components/mission/MissionSummary.tsx`: 단일 미션의 근거 문장, 중립적 수정 기록, 근거 단계, 편집·재시도·대체 자료·활동 종료 행동을 렌더링합니다.
- `src/components/result/ResultScreen.tsx`: 네 필수 A 자료의 canonical attempt와 완료 미션 ID를 함께 검사하고, 전체 학생 결과·안내 문구·전역 리셋·활동 종료를 제공합니다.
- `src/components/result/TeacherSummary.tsx`: 개인정보 없는 미션·자료 라벨·근거·단계 설명·수정 기록 표와 `window.print()` 행동을 제공합니다.
- `src/components/mission/EvidenceBuilder.tsx`: canonical 근거 저장 후 `미션 결과 보기`를 노출합니다.
- `src/components/mission/MissionScreen.tsx`: `mission-result` 라우트와 MissionSummary를 연결하고 편집 가능한 결과 행동을 연결합니다.
- `src/app/router.tsx`: `mission-result`를 구현 단계로 등록하고 임시 `/results` redirect를 제거합니다.
- `src/components/start/StartScreen.tsx`: registry 순서의 다음 미완료 required mission과 해당 미션의 A/B 자료를 선택합니다.
- `src/domain/session.ts`: 기존 canonical attempt만 같은 revision으로 수정하는 `UPDATE_EVIDENCE_ATTEMPT` action을 추가합니다.
- `src/test/fixtures.tsx`: 전체 결과 테스트가 네 required A canonical attempt를 사용하도록 보강합니다.
- `src/components/result/ResultScreen.test.tsx`, `src/components/result/TeacherSummary.test.tsx`, `src/components/mission/EvidenceBuilder.test.tsx`, `src/domain/session.test.ts`, `src/app/router.test.tsx`: 결과 잠금·순서·편집·도달성·인쇄·리셋·개인정보·집계 금지와 reducer 계약을 검증합니다.

## 주요 인터페이스와 결정

- `LabAction['UPDATE_EVIDENCE_ATTEMPT']`는 `state.attempts[record.datasetId]`가 canonical이고 동일 revision일 때만 적용합니다. revision은 거절 제출 횟수이므로 편집 시 증가시키지 않습니다.
- active run이 같은 미션·자료의 canonical evidence를 가지고 같은 revision이면 해당 evidence만 함께 갱신합니다. prediction, calculation, comparison artifact를 생성하거나 재구성하지 않습니다.
- `/results`는 네 `completedRequiredMissions` ID와 네 required dataset canonical attempt를 모두 요구합니다. 잠금 문구는 `대표값 심의 필수 자료를 마치면 전체 결과를 볼 수 있어요.`입니다.
- 카드 DOM 순서는 `내가 사용한 근거` → `고쳐 생각한 과정` → `근거 단계` → 행동입니다.
- 결과에는 다음 정확한 교육적 경계 문구를 포함합니다: `이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.`, `평균 하나가 공정성이나 개인의 가치를 결정하지 않습니다.`
- 결과 카드 보조 행동과 인쇄·리셋은 normal이며, 미션 결과의 `활동 마치기`와 전체 결과의 전역 `활동 마치기`만 현재 단계 CTA 강조를 사용할 수 있게 했습니다.
- 교사용 표는 이름·학번·식별자·총점·순위·백분율·학급 비교를 표시하지 않습니다. 실제 인쇄 CSS는 Task 14 범위로 남기고 semantic class와 region hook만 추가했습니다.

## 검증 결과

- `npm test -- --run`: 17개 파일, 166개 테스트 통과
- `npm run typecheck`: 통과
- `npm run build`: 통과, Vite production bundle 생성
- `git diff --check`: 통과
- production source 최대 줄 수: `src/domain/session.ts` 349줄; 모든 production TS/TSX 파일 500줄 미만

## 미해결 사항

Task 11 범위에서 남은 구현 미해결 사항은 없습니다. 모바일·키보드·스크린 리더 최종 검증과 인쇄 스타일은 계획대로 Task 14·15에서 수행합니다. 로컬 저장소 키 정리의 최종 보강은 계획대로 Task 12에서 수행합니다.

## Fix Round 1

### RED 증거

- `src/app/router.test.tsx`에 explain 단계의 실제 저장 근거 화면에서 `미션 결과 보기`를 클릭하고 URL이 `#/mission/balance-delivery/balance-20-a/mission-result`로 이동한 뒤 미션 결과와 다음 미션이 표시되는 통합 테스트를 추가했습니다. 수정 전 `MissionScreen.nextStage()`가 `mission-result`를 거부하여 URL이 explain에 남았습니다.
- 같은 테스트 파일에 완료 미션 ID 네 개와 달리 필수 A canonical attempt 하나가 누락된 복원 상태가 누락 미션을 다시 제시하는 통합 테스트를 추가했습니다. 수정 전 StartScreen이 `전체 결과 보기`만 표시하여 결과 잠금과 교착했습니다.
- `src/components/result/ResultScreen.test.tsx`에 네 결과 카드의 고유 ID, 카드 region의 실제 `aria-labelledby` 대상, 카드 내부 heading ID 고유성, h3→h4 계층을 검증하는 테스트를 추가했습니다. 수정 전 카드 region은 전달받은 `headingId`가 아닌 `mission-summary-heading`을 참조했고 내부 ID가 반복되었습니다.

### 수정 내용

1. `src/components/mission/MissionScreen.tsx`의 `nextStage()` 허용 목록에 `mission-result`를 추가하여 canonical evidence 저장 후 실제 미션 결과 화면으로 이동하도록 했습니다.
2. `src/components/mission/MissionSummary.tsx`가 전달받은 `headingId`를 root `aria-labelledby`와 heading ID에 함께 사용하도록 수정했습니다. `headingId` 기반의 `-evidence`, `-revisions`, `-level` ID를 생성하고 전체 결과 카드에서는 내부 heading을 h4로 렌더링하여 h1→h2→h3→h4 계층과 카드별 ID 유일성을 보장했습니다.
3. `src/components/start/StartScreen.tsx`의 다음 미션 판정을 `completedRequiredMissions` ID와 해당 미션 required dataset의 canonical attempt가 모두 있을 때만 완료로 인정하도록 수정했습니다. 따라서 불일치 복원 상태는 누락 미션으로 복귀하고 잠긴 전체 결과 sole action을 표시하지 않습니다.

### 검증 결과

- Focused: `npm test -- --run src/app/router.test.tsx src/components/result/ResultScreen.test.tsx` — 2개 파일, 32개 테스트 통과.
- Full: `npm test -- --run` — 17개 파일, 168개 테스트 통과.
- Type/build: `npm run typecheck` 통과, `npm run build` 통과.
- Formatting: `git diff --check` 통과.
- 줄 수: production TS/TSX 최대 `src/domain/session.ts` 349줄이며 production 파일은 모두 500줄 미만입니다. 전체 TS/TSX에는 `src/app/router.test.tsx` 480줄이 포함되지만 500줄 미만입니다.
- 새 커밋: `fix: connect mission result flow` (`3fc075c2657b2835b520ec37aa78ba84b30a1f2b`).

미해결 사항은 없습니다. 인쇄 CSS, 모바일, 키보드, 스크린 리더 최종 검증은 계획된 Task 14·15 범위입니다.

## Fix Round 2

### RED 증거

- `src/components/result/ResultScreen.test.tsx`에 전체 결과 카드에서 `근거 수정`을 연 뒤 카드 제목 h3 아래 편집기 제목이 h4, 편집기 내부 `완성된 근거 문장` 제목이 h5가 되는지, 두 제목과 카드 제목의 ID가 서로 다르고 각 section의 `aria-labelledby`가 해당 제목을 가리키는지 검증하는 테스트를 추가했습니다. 수정 전 고정 h1/h2가 렌더링되어 h4/h5 기대를 만족하지 못했습니다.
- `src/components/mission/EvidenceBuilder.test.tsx`에 정상 미션 설명 화면의 기본 h1/h2 계층, `evidence-heading` 및 `evidence-sentence-heading` ID, 문장 section의 labelled-by 연결을 고정하는 회귀 테스트를 추가했습니다. 수정 전 문장 h2에 ID와 labelled-by 연결이 없었습니다.

### 수정 내용

1. `src/components/mission/EvidenceBuilder.tsx`에 `EvidenceHeadingLevel` 타입과 `headingLevel`, `headingId` props를 추가했습니다. 기본값은 기존 미션 화면의 h1 및 `evidence-heading`이며, 전달된 단계에 따라 내부 문장 제목은 다음 단계(h2~h6)로 렌더링됩니다. 기본 및 전달 ID에서 문장 제목 ID를 파생하고 section의 `aria-labelledby`와 연결했습니다.
2. `src/components/mission/MissionSummary.tsx`가 자신의 h1/h2/h3 단계에 맞춰 편집기 단계를 h2/h3/h4로 전달하고, 카드 제목 ID에서 파생한 고유 편집기 제목 ID를 전달하도록 수정했습니다. 따라서 전체 결과 카드의 계층은 h1→h2→h3→h4→h5로 유지됩니다.

### 검증 결과

- RED focused: `npm test -- --run src/components/result/ResultScreen.test.tsx src/components/mission/EvidenceBuilder.test.tsx` — 수정 전 새 테스트 2개 실패.
- Focused: 같은 명령 — 2개 파일, 30개 테스트 통과.
- Full: `npm test -- --run` — 17개 파일, 170개 테스트 통과.
- Type/build: `npm run typecheck` 통과, `npm run build` 통과.
- Formatting: `git diff --check` 통과.
- 줄 수: production TS/TSX 최대 `src/domain/session.ts` 및 `src/domain/evaluation.ts` 각 349줄이며 모든 production 파일이 500줄 미만입니다.
- 새 커밋: `fix: preserve evidence editor heading order` (`422dfcbc7223b14b0e3d90f69e48829fc954e9d4`).

### 미해결 사항

이 Fix Round 2에서 남은 구현 미해결 사항은 없습니다. 인쇄 CSS, 모바일, 키보드, 스크린 리더 최종 검증은 계획된 Task 14·15 범위입니다.
