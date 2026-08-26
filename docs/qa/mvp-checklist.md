# 평균 균형 조정실 MVP 검증 체크리스트

검증일: 2026-08-26 (Asia/Seoul)
검증 기준 커밋: `8657f1d`
검증 범위: 로컬 소스, `dist/` preview, Vitest, Playwright Chromium. 원격 저장소·push·배포·HVC 등록은 확인 범위가 아닙니다.

## Specification and Traceability

| 요구사항 | 자동 검증 | 수동 확인 | 결과 |
|---|---|---|---|
| 평균을 고른 재배분으로 이해 | `src/domain/math.test.ts`, `src/components/mission/RedistributionPanel.test.tsx`, `tests/e2e/accessibility.spec.ts`의 `completes the balance step at 375px without horizontal overflow` | `node /private/tmp/mean-preview-check.mjs`, Chromium 1280×800에서 실제 균형 배송 상황 경로와 `원자료: 2, 4, 6, 8` 관찰 | 통과 — Vitest 포함 23 files/227 tests, E2E 18 passed, preview 상황 URL `/mission/balance-delivery/balance-20-a/situation` |
| 합과 개수로 평균 계산 | `src/domain/math.test.ts`, `src/components/mission/CalculationCheck.test.tsx`, `tests/e2e/accessibility.spec.ts`의 keyboard flow | 별도 수동 계산 입력은 수행하지 않음. Chromium E2E가 `20 ÷ 4 = 5` 계산 확인과 결과 이동을 수행 | 통과 — `npm test` 227 passed, `CI=1 npm run test:e2e` 18 passed |
| 같은 평균·다른 분포 분석 | `src/domain/evaluation.test.ts`, `src/components/mission/ComparisonPanel.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 required missions와 twins challenge | 별도 수동 비교 조작은 수행하지 않음. Chromium 자동 경로가 평균 쌍둥이 A/B 자료와 결과 근거를 확인 | 통과 — `npm test` 227 passed, `CI=1 npm run test:e2e` 18 passed |
| 한 값이 평균에 미치는 영향 | `src/domain/evaluation.test.ts`, `src/components/mission/OutlierDeltaPanel.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 outlier challenge | 별도 수동 조작은 수행하지 않음. Chromium 자동 경로가 outlier A/B 고정값과 합계·평균 변화 경로를 확인 | 통과 — `CI=1 npm run test:e2e` 18 passed |
| 평균의 유용성과 한계 판단 | `src/domain/evaluation.test.ts`, `src/components/mission/EvidenceBuilder.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 evidence-first results | 별도 수동 근거 선택은 수행하지 않음. Chromium 자동 경로가 대표값 결과와 안전 문구를 확인 | 통과 — `npm test` 227 passed, Chromium 결과에 `내가 사용한 근거` 4개와 안전 문구 표시 |
| 기존 앱과 차별화 | `src/content/missions.test.ts`, `tests/e2e/learner-flow.spec.ts`의 no-drag assertion, production-network scan | 별도 수동 UI 탐색은 수행하지 않음. preview Chromium에서 `[draggable="true"]` 0개, 외부 요청 0개 관찰 | 통과 — `rg -n "fetch\(|axios|analytics|gtag|firebase|openai|gemini" src` 무출력 |
| 이전 단계 결과를 계속 표시 | `src/components/layout/ArtifactTrail.test.tsx`, `src/app/router.test.tsx`, `tests/e2e/history-and-restore.spec.ts`의 reload tests | 별도 수동 뒤로 가기 탐색은 수행하지 않음. Chromium E2E가 reload 후 예측·재배분 artifact를 확인 | 통과 — `CI=1 npm run test:e2e` 18 passed |
| 근거 중심 3단계 평가 | `src/domain/evaluation.test.ts`, `src/components/result/ResultScreen.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 evidence-first results | 별도 수동 결과 DOM 검사는 수행하지 않음. Chromium 자동 결과에서 근거 heading 4개가 노출됨 | 통과 — `내가 사용한 근거`가 결과에 4개 표시되고 점수·순위 UI 없음 |
| 접근성·모바일·모션 감소 | `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive-motion.spec.ts` (375×812, reduced-motion, axe, keyboard, 44px) | 별도 실제 기기·스크린리더 수동 검사는 수행하지 않음 | 통과 — Chromium E2E 18 passed, serious/critical axe violation 0 |
| 개인정보·안전·교육적 한계 | `src/content/documentation.test.ts`, `src/components/result/ResultScreen.test.tsx`, personal-data/network scans | `node /private/tmp/mean-preview-check.mjs`, Chromium 1280×800 preview에서 교육용 이산 모형 문구와 외부 요청 0개 관찰 | 통과 — 문서 계약 1 passed, 결과 안전 문구 표시, scan hit는 부정 테스트/주석만 해당 |
| MVP 4개 미션×2세트 | `src/content/missions.test.ts`, `tests/e2e/learner-flow.spec.ts`의 4 optional challenge tests | 별도 수동 8세트 탐색은 수행하지 않음. Chromium E2E가 A 필수 경로와 B 도전값 4개를 확인 | 통과 — 고정 콘텐츠 스키마 테스트 통과, `CI=1 npm run test:e2e` 18 passed |
| 새로 고침·뒤로 가기 안전 | `src/state/persistence.test.ts`, `src/app/router.test.tsx`, `tests/e2e/history-and-restore.spec.ts` | 별도 수동 브라우저 기록 조작은 수행하지 않음. Chromium E2E가 wrong feedback/calculation reset과 guarded deep link를 확인 | 통과 — `CI=1 npm run test:e2e` 18 passed |
| 업데이트 내역 | `src/components/update/UpdateHistoryDialog.test.tsx`, `tests/e2e/accessibility.spec.ts`의 focus test | 별도 수동 대화상자 조작은 수행하지 않음. Chromium E2E가 닫기 초점·Escape 복귀를 확인 | 통과 — `CI=1 npm run test:e2e` 18 passed, 두 literal 날짜는 `src/content/updateHistory.ts`에 존재 |

## Completion Gate

| # | 기준 | 구체적 증거 | 결과 |
|---:|---|---|---|
| 1 | Four missions and eight fixed datasets pass schema and mathematical invariant tests. | `npm test`: 23 test files, 227 tests passed. `src/content/missions.test.ts`의 4 mission·8 dataset contract와 `src/domain/math.test.ts` invariants 통과. | 통과 |
| 2 | A learner completes all four required datasets using only buttons and keyboard. | `CI=1 npm run test:e2e`: 18 passed. `tests/e2e/learner-flow.spec.ts`의 `completes all required missions without drag...` 및 `tests/e2e/accessibility.spec.ts` keyboard flow 통과. | 통과 |
| 3 | Every redistribution preserves total and item count, and undo restores the exact previous array. | `src/domain/math.test.ts`, `src/domain/session.test.ts`, `src/components/mission/RedistributionPanel.test.tsx` 통과; `npm test` 227 passed. | 통과 |
| 4 | Calculation display and correctness both use the same `mean(values)` output. | `src/domain/math.test.ts`, `src/components/mission/CalculationCheck.test.tsx`, `tests/e2e/accessibility.spec.ts`가 `20 ÷ 4 = 5`를 확인; `npm test` 227 passed. | 통과 |
| 5 | At least one same-mean/different-spread explanation and one outlier-change explanation appear in final evidence. | `tests/e2e/learner-flow.spec.ts`에서 `twins-4-a`, `outlier-5-a`를 포함한 4개 A 미션을 완료하고 `내가 사용한 근거` 4개를 visible assertion; E2E 18 passed. | 통과 |
| 6 | Representative review uses range or individual values and displays both educational-safety notices. | `src/domain/evaluation.test.ts`, `src/components/result/ResultScreen.test.tsx`, learner-flow result assertion이 범위/각 값 근거와 두 안전 문구 확인; E2E 18 passed. | 통과 |
| 7 | Result DOM orders evidence and revision process before level and contains no aggregate score or rank. | `src/components/result/ResultScreen.test.tsx`, `src/components/result/TeacherSummary.test.tsx`, `tests/e2e/learner-flow.spec.ts` evidence-first assertions; E2E 18 passed. | 통과 |
| 8 | Reload removes transient wrong/success judgment while retaining allowed completed artifacts; deep links cannot bypass stage gates. | `tests/e2e/history-and-restore.spec.ts`의 wrong judgment/calculation reset/active history/direct navigation tests; E2E 18 passed. | 통과 |
| 9 | Default tab storage, explicit device opt-in, local-only disclosure, and total clearing all pass. | `src/state/persistence.test.ts`, `src/state/LabSessionContext.test.tsx`, `src/components/settings/StoragePreference.test.tsx`, `src/components/result/ResultScreen.test.tsx`; `npm test` 227 passed. | 통과 |
| 10 | Exactly one enabled current-action button carries `data-current-action="true"` in every stage. | `tests/e2e/accessibility.spec.ts` current-action assertion과 `src/components/shared/ActionButton.test.tsx`; E2E 18 passed. | 통과 |
| 11 | Reduced motion removes animation and shows a 4px border plus visible `다음 행동` text. | `tests/e2e/accessibility.spec.ts` reduced-motion test, Chromium `reducedMotion: reduce`, animation `none`, visible `.reduced-motion-next`, outline 4px; E2E 18 passed. | 통과 |
| 12 | 375×812 and 32px root-font flows have no horizontal overflow. | `tests/e2e/accessibility.spec.ts` 375×812 overflow test와 `tests/e2e/responsive-motion.spec.ts` large-text test; Chromium E2E 18 passed. | 통과 |
| 13 | Keyboard-only flow, live-region announcements, dialog focus handling, and zero serious/critical axe violations pass. | `tests/e2e/accessibility.spec.ts` keyboard/live update/dialog focus tests와 AxeBuilder test; Chromium E2E 18 passed, serious/critical 0. 실제 스크린리더·기기 수동 검사는 수행하지 않았습니다. | 통과 |
| 14 | Update history contains two literal dated entries and its trigger remains keyboard accessible at the bottom-right. | `src/content/updateHistory.ts`에 `2026-08-26` 설계·개발 두 항목, `src/components/update/UpdateHistoryDialog.test.tsx`, accessibility E2E focus test; E2E 18 passed. | 통과 |
| 15 | Production source contains no personal-data input, external network API, analytics SDK, account, leaderboard, or graph-editing control. | `rg -n "이름|학번|성적|키|몸무게|학생.*순위" src` hit 3건: `src/domain/evaluation.ts`의 단어 일부가 포함된 주석 1건과 금지 label 부재를 확인하는 부정 테스트 2건. `rg -n "fetch\(|axios|analytics|gtag|firebase|openai|gemini" src` 무출력. E2E 외부 요청 0개. | 통과 |
| 16 | Every source file is under 500 lines, all tests pass, the static build succeeds, and the worktree is clean. | `find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l`: 최대 480줄(`src/app/router.test.tsx`); `npm test` 227 passed; `npm run build` 성공, `dist/index.html` 및 hashed `index-qWhS_shg.js`·`index-CW3jMkM3.css` 생성. 문서 커밋 후 `git status --short` 무출력으로 확인. | 통과 |

## Reproducibility evidence

| 단계 | 명령과 결과 |
|---|---|
| lockfile 전 | `shasum -a 256 package-lock.json` → `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력 |
| 의존성 재현 | `npm ci` 성공, 128 packages added, 0 vulnerabilities |
| lockfile 후 | 동일 SHA-256 `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력 |
| 타입·단위 | `npm run typecheck` 성공; `npm test` 23 files/227 tests passed |
| 브라우저 | 샌드박스 첫 시도는 Chromium macOS 권한 오류였고, 승인된 권한으로 `CI=1 npm run test:e2e` 재실행 후 18 passed |
| 빌드 | `npm run build` 성공; `dist/index.html`, hashed local JS/CSS 생성 |
| preview | `npm run preview -- --host 127.0.0.1` 후 `node /private/tmp/mean-preview-check.mjs`, Chromium viewport 1280×800. 제목 `평균 균형 조정실`, 시작 heading, valid situation route, fresh-context guarded `/explain` → `/predict`, console/page errors 0, non-loopback requests `[]`, hashed local assets 2개를 관찰하고 preview를 종료 |
