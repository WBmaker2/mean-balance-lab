# Task 15 경계 보강 2차 보고서

## 범위

Task 15 재검토에서 남은 P2 concern인 prediction 경계의 자료별 회귀 공백을 보강했습니다.

- 8개 dataset ID의 mission/dataset kind/expectedMean을 독립적인 명시 표에 고정했습니다.
- 비-outlier 6개 자료는 `expectedMean - 1`, `expectedMean`, `expectedMean + 1`의 정확한 3개 숫자 선택지를 검사했습니다.
- outlier 2개 자료는 `increase`, `decrease`, `same`의 정확한 3개 방향 선택지를 검사했습니다.
- 각 자료에서 허용값은 validator가 모두 허용하고, cross-kind 값과 kind 내 임의값은 거부하는지 검사했습니다.
- 각 자료의 prediction 단계에서 reducer가 canonical 값을 저장하고, 잘못된 값은 상태 identity를 유지하는 no-op인지 검사했습니다.
- 각 자료의 forged prediction payload에 대해 `isLabSessionState`와 `loadSession`이 모두 거부하는지 검사했습니다.

## TDD 기록

기존 기준선 focused 실행은 prediction 관련 2개 파일, 4개 테스트가 통과했습니다. 이미 구현된 `predictionOptions`, `isAllowedPrediction`, reducer, persistence guard가 현재 규칙을 올바르게 구현하고 있어 production 코드를 임의로 깨뜨려 RED를 만들지는 않았습니다. 따라서 이번 보강은 기존 coverage gap을 명시하는 characterization test로 작성했으며, 새 테스트 GREEN 결과를 기록합니다.

독립 기대표는 `MISSIONS` 순회나 production 매핑 함수에서 파생하지 않았습니다. 테스트가 잘못된 mission/dataset 매핑을 그대로 복제해 통과하지 않도록 8개 매핑과 기대 선택지를 직접 고정하고, 실제 dataset kind/평균과 별도 대조합니다.

## 변경 파일

- `src/test/predictionCases.ts`: 8개 자료의 독립 typed expectation table 추가
- `src/domain/prediction.test.ts`: 8개 자료의 정확한 옵션 3개, validator 허용/거부 전수화
- `src/domain/prediction-boundaries.test.ts`: 8개 자료의 reducer 저장/no-op 및 persistence 복원 거부 전수화
- 본 보고서

production source와 `.superpowers/sdd/.../progress.md`는 수정하지 않았습니다.

## 검증 결과

| 명령 | 결과 |
|---|---|
| `npm test -- --run src/domain/prediction.test.ts src/domain/prediction-boundaries.test.ts` (기준선) | 2 files, 4 tests passed |
| `npm test -- --run src/domain/prediction.test.ts src/domain/prediction-boundaries.test.ts` (보강 후) | 2 files, 24 tests passed |
| `npm test -- --run` | 22 files, 226 tests passed |
| `CI=1 npm run test:e2e` | 18 passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `git diff --check` | passed |
| TS/TSX/CSS line-count gate | `ALL_SRC_TS_TSX_CSS_UNDER_500` |

첫 CI=1 시도는 잔류 4173 포트 프로세스 때문에 시작되지 않았고, 해당 프로젝트 테스트 서버를 확인·종료한 뒤 재실행하여 18개 전체 E2E를 통과했습니다.

## 제약 확인

- 패키지 설치, push, deploy를 실행하지 않았습니다.
- `progress.md`를 생성·수정하지 않았습니다.
- prediction 계약 외 production 변경은 없습니다.
- commit은 요청된 메시지 `test: cover all dataset prediction boundaries`로 테스트·필요 최소 fixture·보고서만 포함할 예정입니다.
