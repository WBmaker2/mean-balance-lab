# 평균 균형 조정실 MVP 검증 체크리스트

검증일: 2026-08-28 (Asia/Seoul) — 개선 작업 및 공개 릴리스 검증 기록
검증 기준 소스 커밋: `08b525f fix: keep production stage focus handoff`
검증 범위: 로컬 소스, `dist/` preview, Vitest, Playwright Chromium, 공개 GitHub Pages. HVC 등록은 확인 범위가 아닙니다.

기능 구현은 `8e79875`에서 완료했고, `e7da7cd`는 테스트 EOF whitespace-only 정리 커밋, `f2b769f`는 공개 배포를 위한 favicon·운영 메타데이터·업데이트 내역 커밋입니다. 이번 개선은 `55e6e48`에서 학습자 UX·접근성·모바일·검증을 반영하고, `08b525f`에서 production 단계 초점 회귀를 수정한 뒤 `main`에 푸시했습니다. 공개 Pages가 같은 origin의 HTML·JS·CSS를 외부 요청으로 오인하지 않도록 `tests/e2e/learner-flow.spec.ts`의 네트워크 판정도 origin 기준으로 보완했습니다.

## Public release evidence

이번 개선 턴은 `main`에 커밋·푸시했고 GitHub Pages 배포까지 완료했습니다. 공개 검증은 로컬 검증과 별도로 실행했습니다.

이번 개선의 구현 계획은 [`2026-08-28-mean-balance-lab-improvement-plan.md`](../../2026-08-28-mean-balance-lab-improvement-plan.md)에서 확인할 수 있습니다.

| 항목 | 증거 |
|---|---|
| 공개 저장소 | [`WBmaker2/mean-balance-lab`](https://github.com/WBmaker2/mean-balance-lab), `main`에 학습자 개선·production 단계 초점 수정·검증 기록 반영 |
| GitHub Actions | [Deploy to GitHub Pages workflow](https://github.com/WBmaker2/mean-balance-lab/actions/workflows/deploy-pages.yml) — latest main deployment succeeded; checkout, `npm ci`, build, Pages configure/upload/deploy 모두 통과 |
| 공개 앱 | [`https://wbmaker2.github.io/mean-balance-lab/`](https://wbmaker2.github.io/mean-balance-lab/) — HTTP 200, title `평균 균형 조정실`, HTML 참조 JS/CSS assets 200 |
| 공개 학습자 smoke | 공개 URL에서 전체 Chromium 학습 흐름 21개(단계 초점·문구, 4개 필수 미션, 키보드·모바일·새로고침·인쇄, 업데이트 내역)를 확인; console/page errors 0, 실제 아동 참가자·VoiceOver 승인은 수행하지 않음 |

## Specification and Traceability

| 요구사항 | 자동 검증 | 수동 확인 | 결과 |
|---|---|---|---|
| 평균을 고른 재배분으로 이해 | `src/domain/math.test.ts`, `src/components/mission/RedistributionPanel.test.tsx`, `tests/e2e/accessibility.spec.ts`의 `completes the balance step at 375px without horizontal overflow` | `node /private/tmp/mean-preview-check.mjs`, Chromium 1280×800에서 실제 균형 배송 상황 경로와 `원자료: 2, 4, 6, 8` 관찰 | 통과 — Vitest 28 files/249 tests, E2E 21 passed, preview 상황 URL `/mission/balance-delivery/balance-20-a/situation` |
| 합과 개수로 평균 계산 | `src/domain/math.test.ts`, `src/components/mission/CalculationCheck.test.tsx`, `tests/e2e/accessibility.spec.ts`의 keyboard flow | 별도 수동 계산 입력은 수행하지 않음. Chromium E2E가 `20 ÷ 4 = 5` 계산 확인과 결과 이동을 수행 | 통과 — `npm test -- --run` 249 passed, `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 같은 평균·다른 분포 분석 | `src/domain/evaluation.test.ts`, `src/components/mission/ComparisonPanel.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 required missions와 twins challenge | 별도 수동 비교 조작은 수행하지 않음. Chromium 자동 경로가 평균 쌍둥이 A/B 자료와 결과 근거를 확인 | 통과 — `npm test -- --run` 249 passed, `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 한 값이 평균에 미치는 영향 | `src/domain/evaluation.test.ts`, `src/components/mission/OutlierDeltaPanel.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 outlier challenge | 별도 수동 조작은 수행하지 않음. Chromium 자동 경로가 outlier A/B 고정값과 합계·평균 변화 경로를 확인 | 통과 — `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 평균의 유용성과 한계 판단 | `src/domain/evaluation.test.ts`, `src/components/mission/EvidenceBuilder.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 evidence-first results | 별도 수동 근거 선택은 수행하지 않음. Chromium 자동 경로가 대표값 결과와 안전 문구를 확인 | 통과 — `npm test -- --run` 249 passed, Chromium 결과에 `내가 사용한 근거` 4개와 안전 문구 표시 |
| 기존 앱과 차별화 | `src/content/missions.test.ts`, `tests/e2e/learner-flow.spec.ts`의 no-drag assertion, production-network scan | 별도 수동 UI 탐색은 수행하지 않음. preview Chromium에서 `[draggable="true"]` 0개, 외부 요청 0개 관찰 | 통과 — `rg -n "fetch\(|axios|analytics|gtag|firebase|openai|gemini" src` 무출력 |
| 이전 단계 결과를 계속 표시 | `src/components/layout/ArtifactTrail.test.tsx`, `src/app/router.route-guards.test.tsx`, `src/app/router.learner-handoff.test.tsx`, `tests/e2e/history-and-restore.spec.ts`의 reload tests | 별도 수동 뒤로 가기 탐색은 수행하지 않음. Chromium E2E가 reload 후 예측·재배분 artifact를 확인 | 통과 — `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 근거 중심 3단계 평가 | `src/domain/evaluation.test.ts`, `src/components/result/ResultScreen.test.tsx`, `tests/e2e/learner-flow.spec.ts`의 evidence-first results | 별도 수동 결과 DOM 검사는 수행하지 않음. Chromium 자동 결과에서 근거 heading 4개가 노출됨 | 통과 — `내가 사용한 근거`가 결과에 4개 표시되고 점수·순위 UI 없음 |
| 접근성·모바일·모션 감소 | `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive-motion.spec.ts` (375×812, reduced-motion, axe, keyboard, 44px) | 별도 실제 기기·스크린리더 수동 검사는 수행하지 않음 | 통과 — Chromium E2E 21 passed, serious/critical axe violation 0 |
| 개인정보·안전·교육적 한계 | `src/content/documentation.test.ts`, `src/components/result/ResultScreen.test.tsx`, personal-data/network scans | Chromium 1280×800 preview에서 교육용 이산 모형 문구와 외부 요청 0개 관찰 | 통과 — 문서 계약과 결과 안전 문구 표시, 이번 Chromium E2E 외부 요청 0개 |
| MVP 4개 미션×2세트 | `src/content/missions.test.ts`, `tests/e2e/learner-flow.spec.ts`의 4 optional challenge tests | 별도 수동 8세트 탐색은 수행하지 않음. Chromium E2E가 A 필수 경로와 B 도전값 4개를 확인 | 통과 — 고정 콘텐츠 스키마 테스트 통과, `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 새로 고침·뒤로 가기 안전 | `src/state/persistence.test.ts`, `src/app/router.route-guards.test.tsx`, `src/app/router.learner-handoff.test.tsx`, `tests/e2e/history-and-restore.spec.ts` | 별도 수동 브라우저 기록 조작은 수행하지 않음. Chromium E2E가 wrong feedback/calculation reset과 guarded deep link를 확인 | 통과 — `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed |
| 업데이트 내역 | `src/components/update/UpdateHistoryDialog.test.tsx`, `tests/e2e/accessibility.spec.ts`의 focus test | 별도 수동 대화상자 조작은 수행하지 않음. Chromium E2E가 닫기 초점·Escape 복귀를 확인 | 통과 — `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed, 다섯 항목·세 날짜는 `src/content/updateHistory.ts`에 존재 |

## Completion Gate

| # | 기준 | 구체적 증거 | 결과 |
|---:|---|---|---|
| 1 | Four missions and eight fixed datasets pass schema and mathematical invariant tests. | `npm test -- --run`: 28 test files, 249 tests passed. `src/content/missions.test.ts`의 4 mission·8 dataset contract와 `src/domain/math.test.ts` invariants 통과. | 통과 |
| 2 | A learner completes all four required datasets using only buttons and keyboard. | `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium`: 21 passed. `tests/e2e/learner-flow.spec.ts`의 `completes all required missions without drag...` 및 `tests/e2e/accessibility.spec.ts` keyboard flow 통과. | 통과 |
| 3 | Every redistribution preserves total and item count, and undo restores the exact previous array. | `src/domain/math.test.ts`, `src/domain/session.test.ts`, `src/components/mission/RedistributionPanel.test.tsx` 통과; `npm test -- --run` 249 passed. | 통과 |
| 4 | Calculation display and correctness both use the same `mean(values)` output. | `src/domain/math.test.ts`, `src/components/mission/CalculationCheck.test.tsx`, `tests/e2e/accessibility.spec.ts`가 `20 ÷ 4 = 5`를 확인; `npm test -- --run` 249 passed. | 통과 |
| 5 | At least one same-mean/different-spread explanation and one outlier-change explanation appear in final evidence. | `tests/e2e/learner-flow.spec.ts`에서 `twins-4-a`, `outlier-5-a`를 포함한 4개 A 미션을 완료하고 `내가 사용한 근거` 4개를 visible assertion; E2E 21 passed. | 통과 |
| 6 | Representative review uses range or individual values and displays both educational-safety notices. | `src/domain/evaluation.test.ts`, `src/components/result/ResultScreen.test.tsx`, learner-flow result assertion이 범위/각 값 근거와 두 안전 문구 확인; E2E 21 passed. | 통과 |
| 7 | Result DOM orders evidence and revision process before level and contains no aggregate score or rank. | `src/components/result/ResultScreen.test.tsx`, `src/components/result/TeacherSummary.test.tsx`, `tests/e2e/learner-flow.spec.ts` evidence-first assertions; E2E 21 passed. | 통과 |
| 8 | Reload removes transient wrong/success judgment while retaining allowed completed artifacts; deep links cannot bypass stage gates. | `tests/e2e/history-and-restore.spec.ts`의 wrong judgment/calculation reset/active history/direct navigation tests; E2E 21 passed. | 통과 |
| 9 | Default tab storage, explicit device opt-in, local-only disclosure, and total clearing all pass. | `src/state/persistence.test.ts`, `src/state/LabSessionContext.test.tsx`, `src/components/settings/StoragePreference.test.tsx`, `src/components/result/ResultScreen.test.tsx`; `npm test -- --run` 249 passed. | 통과 |
| 10 | Exactly one enabled current-action button carries `data-current-action="true"` in every stage. | `tests/e2e/accessibility.spec.ts` current-action assertion과 `src/components/shared/ActionButton.test.tsx`; E2E 21 passed. | 통과 |
| 11 | Reduced motion removes animation and shows a 4px border plus visible `다음 행동` text. | `tests/e2e/accessibility.spec.ts` reduced-motion test, Chromium `reducedMotion: reduce`, animation `none`, visible `.reduced-motion-next`, outline 4px; E2E 21 passed. | 통과 |
| 12 | 375×812 and 32px root-font flows have no horizontal overflow. | `tests/e2e/accessibility.spec.ts` 375×812 overflow test와 `tests/e2e/responsive-motion.spec.ts` large-text test; Chromium E2E 21 passed. | 통과 |
| 13 | Keyboard-only flow, live-region announcements, dialog focus handling, and zero serious/critical axe violations pass. | `tests/e2e/accessibility.spec.ts` keyboard/live update/dialog focus tests와 AxeBuilder test; Chromium E2E 21 passed, serious/critical 0. 실제 스크린리더·기기 수동 검사는 수행하지 않았습니다. | 통과 |
| 14 | Update history contains literal dated entries and its trigger remains keyboard accessible at the bottom-right. | `src/content/updateHistory.ts`에 `2026-08-28` 개선 두 항목, `2026-08-27` 배포, `2026-08-26` 설계·개발 다섯 항목, `src/components/update/UpdateHistoryDialog.test.tsx`, accessibility E2E focus test; E2E 21 passed. | 통과 |
| 15 | Production source contains no personal-data input, external network API, analytics SDK, account, leaderboard, or graph-editing control. | `rg -n "이름|학번|성적|키|몸무게|학생.*순위" src`는 4개 파일 5줄입니다: `src/domain/evaluation.ts:63`의 `시키는` 중 `키` 부분 문자열 주석 오탐 1건, `src/content/documentation.test.ts:15`의 `키보드` heading 부분 문자열 오탐 1건, `src/content/documentation.test.ts:29`의 README 안전 문구 검증 1건, `src/components/result/TeacherSummary.test.tsx:19`와 `src/components/mission/EvidenceBuilder.test.tsx:120`의 금지 label 부재 부정 테스트 각 1건. 실제 개인정보 입력·저장·real-person fixture는 없음. `rg -n "fetch\(|axios|analytics|gtag|firebase|openai|gemini" src` 무출력. E2E 외부 요청 0개. | 통과 |
| 16 | Every source file is under 500 lines, all tests pass, the static build succeeds, and the released worktree is clean. | `find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l`: 최대 447줄(`src/domain/session.test.ts`); `npm run check`와 공개·로컬 Chromium 검증 통과, `dist/index.html` 및 해시가 붙은 JS/CSS 자산 생성. `git status --short` 무출력으로 확인. | 통과 |

## Reproducibility evidence

개선 검증에서 Playwright 서버는 기본 로컬 4174, CI 4173으로 분리하며 `PLAYWRIGHT_PORT`와 `PLAYWRIGHT_REUSE_SERVER`로 명시적으로 제어합니다. 모바일 교사용 요약은 640px 이하 카드 목록을 사용하고, 단계 전환 main 초점·입력 ARIA 피드백·학습자 문구를 별도 테스트합니다. VoiceOver는 이번 범위에서 실행하지 않습니다.

| 단계 | 명령과 결과 |
|---|---|
| lockfile 전 | `shasum -a 256 package-lock.json` → `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력 |
| 의존성 재현 | `npm ci` 성공, 128 packages added, 0 vulnerabilities |
| lockfile 후 | 동일 SHA-256 `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력 |
| 타입·단위 | `npm run typecheck` 성공; `npm test -- --run` 28 files/249 tests passed |
| 브라우저 | 로컬 `PLAYWRIGHT_PORT=4193 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium` 21 passed; 공개 Pages `PLAYWRIGHT_BASE_URL=https://wbmaker2.github.io/mean-balance-lab/ PLAYWRIGHT_PORT=4197 PLAYWRIGHT_REUSE_SERVER=true npx playwright test --project=chromium` 21 passed |
| 빌드 | `npm run build` 성공; `dist/index.html`, hashed local JS/CSS 생성 |
| preview | `npm run preview -- --host 127.0.0.1 --port 4187` 후 built preview Chromium check, viewport 1280×800. 제목 `평균 균형 조정실`, valid situation route, guarded `/predict`, console/page errors 0, non-loopback requests `[]`, 해시가 붙은 JS/CSS 자산을 확인 |
