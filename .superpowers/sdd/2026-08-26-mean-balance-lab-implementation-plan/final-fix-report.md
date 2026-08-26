# Final fix report — 평균 균형 조정실

최종 검증일: 2026-08-26 (Asia/Seoul)
기준 소스 커밋: `e7da7cd style: clean final test whitespace`
기능 구현 기준 커밋: `8e79875 fix: close final mean balance quality gaps`
범위: 로컬 소스·테스트·built preview만 검증. 설치·remote·push·deploy·HVC는 수행하지 않았습니다.

## Required fixes RED → GREEN

| # | 결함 | RED 근거 | GREEN 수정·근거 |
|---:|---|---|---|
| 1 | Prediction current action | `PredictionPanel.test.tsx`에서 초기 enabled/current action 0개와 무선택 진행 실패를 재현했습니다. | `PredictionPanel.tsx`가 choices를 중립으로 유지하고, 초기부터 enabled `다음 단계` 하나를 current로 표시합니다. 미선택 클릭은 route/state를 바꾸지 않고 `role=alert`로 `먼저 평균을 예측해 보세요.`를 표시·announce하며, 선택 후 같은 버튼으로 진행합니다. Unit 및 `accessibility.spec.ts`가 initial/feedback/selected 각 정확히 1개를 확인합니다. |
| 2 | Public-flow print and mobile fit | 기존 `responsive-motion.spec.ts`의 completed state/localStorage 주입을 결함으로 확인했습니다. | 테스트가 `completeRequiredDataset`으로 네 A 미션을 공개 UI에서 완료하고 `전체 결과 보기`로 진입합니다. print CSS가 42rem min-width를 해제하고 fixed/wrapping table을 사용합니다. 375×812, 375×3000, 1440×900에서 TeacherSummary 단독·content-driven height·overflow·table right clipping을 확인했습니다. 실제 screenshot: `/private/tmp/mean-balance-mobile-print-summary.png`. |
| 3 | Natural quantity boundary | `math.test.ts`에서 negative/fraction/NaN/Infinity source·destination 및 배열 내 invalid 값이 이동되는 RED를 확인했습니다. | `moveOne`이 mutation 전에 전체 배열의 finite non-negative integer를 검증하고 invalid domain을 `out-of-range`로 반환합니다. 원 배열 identity/content를 보존하고 source zero는 `source-empty`로 유지합니다. 9개 immutable tests GREEN. |
| 4 | Restore bypass | forged former `RESTORE` action이 state와 transient feedback을 주입하는 RED를 확인했습니다. | `LabAction`과 reducer에서 `RESTORE`를 삭제하고 default identity no-op을 추가했습니다. `session-action-boundary.test.ts` GREEN; 복원은 검증된 `loadSession` 경로만 사용합니다. |
| 5 | Router test split | `src/app/router.test.tsx`가 480줄로 plan의 450줄 threshold를 넘었습니다. | 모든 assertion을 보존해 `router.route-guards.test.tsx` 241줄, `router.learner-handoff.test.tsx` 249줄로 분리했습니다. `session.test.ts`도 boundary test 분리 후 447줄입니다. |
| 6 | Evidence provenance | checklist/report가 이전 source SHA·23/227·old assets·max480을 가리켰습니다. | checklist와 Task 16 report를 기능 구현 SHA `8e79875` 및 최종 검증 소스 SHA `e7da7cd`로 갱신했습니다. 25 files/239 tests, E2E 19, max447, assets `index-B9QVr0ob.js`·`index-aUwCFU65.css`를 기록하고, 이후 docs-only commit은 검증 소스를 바꾸지 않는다는 문구를 기록했습니다. |

## Full gate evidence at source commit

- lockfile diff: `git diff --exit-code -- package-lock.json` 통과, 변경 없음.
- `npm run typecheck`: 통과.
- `npm test -- --run`: 25 files / 239 tests passed.
- `CI=1 npx playwright test --config=/private/tmp/mean-balance-playwright-4189.config.ts --workers=1`: 19 passed on safe port 4189; 기존 4173 프로세스는 건드리지 않았습니다. 첫 sandbox Chromium MachPort 권한 오류 뒤 승인 권한으로 재실행했습니다.
- `npm run build`: 통과.
- Privacy scan: 5 matches across 4 files; `시키는`/`키보드` substring-comment 2건, README safety-copy positive contract 1건, prohibited-label absence negative tests 2건. Production personal-data input/storage 없음.
- Network SDK scan: `fetch|axios|analytics|gtag|firebase|openai|gemini` 무출력.
- Source line count: 모든 TS/TSX/CSS 450줄 미만, 최대 447줄 `src/domain/session.test.ts`.
- Built preview on temporary port 4187 to keep preview evidence unambiguous: title `평균 균형 조정실`, valid situation route, guarded `/predict`, console/page errors 0, non-loopback requests `[]`, local assets 2개.
- Public print screenshot: 네 A 미션을 공개 UI로 완료하고 `#/results`에 진입한 뒤 375×812 print 요약 element를 캡처했습니다. `TeacherSummary` 표만 보이며 5열이 안전하게 줄바꿈되고 우측 clipping이 없습니다.

## Changed files

`src/components/mission/PredictionPanel.tsx`, `src/components/mission/PredictionPanel.test.tsx`, `src/domain/math.ts`, `src/domain/math.test.ts`, `src/domain/session.ts`, `src/domain/session.test.ts`, `src/domain/session-action-boundary.test.ts`, `src/app/router.route-guards.test.tsx`, `src/app/router.learner-handoff.test.tsx`, `src/styles/global.css`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive-motion.spec.ts`.
