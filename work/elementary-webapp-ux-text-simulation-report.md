# Elementary Learner UX Report — Text and Simulation

## Scope and decision

- 대상: 초등학교 5~6학년 학습자의 **단어·문장 표현**과 **재배분 시뮬레이션** 두 기능만 검토하고 개선했습니다.
- 제외: 전면 UI 감사, 교사용 문서, VoiceOver 실행, HVC 등록. 릴리스는 검토 완료 뒤 별도 사용자 요청으로 진행했습니다.
- 결정: 두 기능은 구현 완료 상태로 `scoped pass`입니다. 제품 전체 100점 게이트는 이번 요청 범위 밖 영역을 실행하지 않았으므로 릴리스 승인 점수로 사용하지 않습니다.
- 실행일: 2026-08-30 (Asia/Seoul)

## Stage 0 and evidence

- Stage 0: `ready` — [bootstrap report](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/elementary-webapp-ux-bootstrap-text-simulation.md)
- 사용 런타임: Playwright MCP 브라우저, design-system 의존성 확인
- 주 페르소나: 수학 용어를 막 배우는 초등학교 5~6학년 학습자
- 검증 viewport: `320×812`, `360×812`, `375×812`, `1280×800`
- 기준 자료: `balance-20-a`, `[2,4,6,8]`, 전체 `20`, 목표 평균 `5`
- 구현 계획: [text and simulation plan](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/elementary-webapp-ux-text-simulation-plan.md)
- 언어 원장: [language audit](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/elementary-webapp-ux-language-audit.md)
- 시뮬레이션 원장: [simulation test ledger](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/elementary-webapp-ux-simulation-test.md)

## Baseline findings and priority

| issue-id | priority | baseline evidence | change | result |
| --- | --- | --- | --- | --- |
| EDU-LANG-001~008 | P2 | 시작·상황·예측·비교·근거·결과 문장에 `-합니다`, `이산 모형`, 긴 부정형, 내부 자료 코드가 섞여 있었습니다. | 학생용 문장을 `-해요/-해 봐요`로 정리하고, 첫 화면의 가상 모형·평균의 도움과 한계를 짧게 풀이했습니다. 내부 판정 id와 canonical 저장 문장은 유지했습니다. | 핵심 문장 테스트와 360px snapshot PASS |
| SIM-RESET-001 | P2 | 이동과 undo는 있었지만, 학습자가 언제든 처음 상태로 돌아가는 이름 있는 행동이 없었습니다. | `RESET_REDISTRIBUTION` reducer 액션과 `처음 상태로 되돌리기` 버튼을 추가했습니다. | 이동 전·오류 후·균형 후 reset, 키보드 Enter PASS |
| SIM-DOTS-001 | P2 | 점도표가 현재 수량과 함께 바뀌는지 같은 상태에서 검증할 공개 계약이 약했습니다. | `currentValues`를 카드·현재 수량 문장·`data-current-values`·`data-dot-count`의 단일 원천으로 고정했습니다. | 한 개 이동·균형·reset에서 점 총수 20 불변 PASS |

P0와 해결되지 않은 P1은 이번 범위에서 확인되지 않았습니다. 남은 P3는 canonical 저장 문장이 기존 말투를 유지하는 호환성 선택이며, 화면 선택지에는 학습자용 `learnerEvidenceLabel`을 사용합니다.

## Implemented changes

| 영역 | 파일 | 구현 내용 |
| --- | --- | --- |
| 학생용 카피 | `src/components/start/StartScreen.tsx`, `src/content/missions.ts`, `src/content/copy.ts` | 목표·제목·자료 선택·미션 문맥·예측 힌트를 짧은 해요체와 한 행동 문장으로 정리 |
| 모델·안전 설명 | `src/components/mission/SituationPanel.tsx`, `src/components/result/ResultScreen.tsx`, `src/components/mission/EvidenceBuilder.tsx`, `src/app/AppShell.tsx` | 가상 자료·평균의 도움과 한계·개인 가치 판단 금지를 학생용 문장으로 제공 |
| 비교·근거 선택 | `src/components/mission/ComparisonPanel.tsx`, `src/components/mission/EvidenceBuilder.tsx` | 평균·흩어진 정도·범위·각 값을 보이는 선택지에서 쉽게 읽도록 변경하고 canonical 기록 계약은 보존 |
| 실시간 시뮬레이션 | `src/domain/session.ts`, `src/components/mission/BalanceIllustration.tsx`, `src/components/mission/QuantityDots.tsx`, `src/components/mission/RedistributionPanel.tsx` | 한 개 이동, 합계 보존, 현재 값과 점 개수 동기화, 균형 판정, 오류 회복, reset |
| 업데이트 기록 | `src/content/updateHistory.ts` | 2026-08-30 학생용 문장 정리와 점 시뮬레이션 reset 보강 기록 추가 |
| 회귀 계약 | `src/**/*.test.ts`, `src/**/*.test.tsx`, `tests/e2e/helpers/learner.ts`, `tests/e2e/*.spec.ts` | 새 접근성 이름·문장·reducer·점 수량·라우팅 계약을 검증 |

### Changed file inventory

- 앱·라우팅: `src/app/AppShell.tsx`, `src/app/router.learner-handoff.test.tsx`, `src/app/router.route-guards.test.tsx`
- 시작·결과·설정·업데이트: `src/components/start/StartScreen.tsx`, `src/components/start/StartScreen.test.tsx`, `src/components/result/ResultScreen.tsx`, `src/components/result/ResultScreen.test.tsx`, `src/components/settings/StoragePreference.test.tsx`, `src/components/update/UpdateHistoryDialog.test.tsx`
- 미션 UI: `src/components/mission/SituationPanel.tsx`, `src/components/mission/SituationPanel.test.tsx`, `src/components/mission/PredictionPanel.tsx`, `src/components/mission/PredictionPanel.test.tsx`, `src/components/mission/ComparisonPanel.tsx`, `src/components/mission/ComparisonPanel.test.tsx`, `src/components/mission/OutlierDeltaPanel.test.tsx`, `src/components/mission/EvidenceBuilder.tsx`, `src/components/mission/EvidenceBuilder.test.tsx`, `src/components/mission/RedistributionPanel.tsx`, `src/components/mission/RedistributionPanel.test.tsx`, `src/components/mission/BalanceIllustration.test.tsx`
- 콘텐츠·도메인: `src/content/copy.ts`, `src/content/missions.ts`, `src/content/missions.test.ts`, `src/content/updateHistory.ts`, `src/domain/session.ts`, `src/domain/session.test.ts`
- E2E 계약: `tests/e2e/helpers/learner.ts`, `tests/e2e/education-redesign.spec.ts`, `tests/e2e/history-and-restore.spec.ts`
- 범위 문서: `work/elementary-webapp-ux-text-simulation-plan.md`, `work/elementary-webapp-ux-language-audit.md`, `work/elementary-webapp-ux-simulation-decision.md`, `work/elementary-webapp-ux-simulation-test.md`, `work/elementary-webapp-ux-text-simulation-report.md`

## TDD and regression evidence

1. 구현 전 새 학생용 문장·reset 계약 테스트를 먼저 실행해 의도한 실패 13건을 확인했습니다.
2. 최소 변경으로 카피 상수, reducer 액션, 패널 버튼, 테스트 픽스처를 적용했습니다.
3. 관련 테스트 102건을 통과시킨 뒤 전체 회귀를 실행했습니다.
4. 최종 `npm run check` 결과:
   - TypeScript `tsc -b`: 오류 0건
   - Vitest: `34 files / 276 tests` PASS
   - Vite production build: PASS, `dist/` 생성
5. `git diff --check`: 오류 없음
6. 계획·원장·보고서의 자리표시자 표현 수동 검색: 발견 없음

## Browser scenario results

| check | actual evidence |
| --- | --- |
| 초기 상태 | DOM `data-current-values="2,4,6,8"`, 바구니 점 `2/4/6/8`, 총 점 `20`, `data-balanced="false"`, reset 활성·undo 비활성 |
| 한 개 이동 | `4→1` 후 `[3,4,6,7]`; 카드·현재 수량 문장·점도표가 모두 같은 값; LiveRegion이 전체 `20개` 보존을 알림 |
| 잘못된 이동 | 같은 상자 선택 후 값·점 `20` 불변; alert가 원인과 `다른 상자의 +1` 다음 행동을 함께 표시 |
| 균형 완성 | 네 번 이동 후 `[5,5,5,5]`, 평균 `5`, 점 `20`, `data-balanced="true"`, `고르게 나뉘었어요.`; 확인 버튼만 다음 행동 강조 |
| reset | 오류 상태와 균형 상태 모두 `[2,4,6,8]`, 점 `20`, `data-balanced="false"`, 선택 해제, undo 비활성; LiveRegion reset 문장 표시 |
| 키보드 | reset 버튼에 포커스한 뒤 Enter를 눌러 마우스와 같은 초기화; 포커스 유지 |
| 반응형 | 320/375/1280px에서 `scrollWidth === clientWidth`; 주요 버튼 높이 모두 `44px` 이상 |
| 안정성 | 최종 `browser_console_messages(level:error)` 오류 0; 동적 네트워크 요청 없음 |

시각 결과:

- [360px 재배분 화면](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/output/playwright/elementary-text-simulation-redistribution-360.png)
- [1280px 재배분 화면](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/output/playwright/elementary-text-simulation-redistribution-1280.png)

## Design traceability

| 설계 요구 | 이번 구현과 증거 |
| --- | --- |
| 학습 목표: 평균을 고르게 나눈 값으로 이해 | 시작 목표 문장, `RedistributionPanel`의 `전체 양`·평균 식, 균형 상태 캡션 |
| 학습 목표: 합계와 개수로 평균 연결 | `평균 {initialTotal} ÷ {dataset.values.length} = ...` 힌트와 이동 후 합계 보존 LiveRegion |
| 학습 목표: 같은 평균과 다른 모양 구분 | `ComparisonPanel`의 평균·흩어진 정도 선택지와 `EvidenceBuilder`의 범위·각 값 근거 |
| 학습 목표: 평균의 도움과 한계 판단 | `SAFETY_COPY.learnerUsefulness`, `learnerFairness`와 결과·근거 화면 |
| 콘텐츠·판정 모델 | dataset 숫자·평균·균형 판정 id는 변경하지 않고 보이는 문장만 단순화 |
| 접근성 | 의미 있는 버튼 이름, `aria-pressed`, LiveRegion, 44px 조작 영역, 보이는 `gi-pulse`, 키보드 Enter |
| 개인정보·안전 | 실제 자료·이름·로그인 없이 고정 합성 자료만 사용; 실제 측정이 아닌 가상 모형임을 안내 |
| MVP 완료 기준 | 예측→한 개 조작→관찰→설명→재시도/reset 루프를 같은 자료에서 재검증; 모바일·reduced-motion·점 단일 원천 확인 |

## Acceptance status and score boundary

- 이번 범위의 핵심 게이트: **통과** — 학생용 문장과 재배분 시뮬레이션의 P0/P1 없음, 동일 시나리오 회귀 통과, 320px·키보드·점 수량 불변식 통과
- 제품 전체 100점 점수: **실행하지 않음** — 이번 요청에서 전면 화면 구조·교사용 맥락·배포를 제외했으므로 근거 없는 총점은 산출하지 않았습니다.
- 이번 범위 보조 판정: 언어 원장 `EDU-LANG-001~008` 8/8 완료, 시뮬레이션 원장 `SIM-001~008` 8/8 PASS

## Learning comprehension probes

- 시작: “오늘 평균을 무엇과 연결해 살펴보나요?” → 여러 값과 값 하나의 변화를 말하도록 제목과 목표를 구성했습니다.
- 상황: “왜 진짜 물건을 넣지 않았나요?” → 수를 세어 보는 교육용 가상 모형이라는 문장으로 답할 수 있습니다.
- 예측: “지금 숫자를 계산하나요, 방향을 살펴보나요?” → 바뀐 값의 커졌는지·작아졌는지를 먼저 살피고 계산은 뒤에 하도록 힌트를 배치했습니다.
- 재배분: “수량이 바뀌어도 전체는 어떻게 되나요?” → 매 이동·reset LiveRegion과 DOM 합계가 20을 반복 확인합니다.
- 설명: “어떤 근거를 골라야 문장이 완성되나요?” → 살펴본 근거, 범위·각 값, 평균의 도움과 한계가 보이는 선택지로 읽힙니다.

## Motion, assets, and not-run items

- `gi-pulse`는 미션 시작과 균형 확인 같은 현재 행동에만 유지했습니다. `prefers-reduced-motion: reduce`에서는 전환·애니메이션을 끄고 균형 윤곽선으로 대체합니다(`src/styles/illustrations.css:158-163`).
- 장식 `bench-illustration-v2.png`에는 학습 숫자·점이 없고, 수량은 DOM `QuantityDots`에서 생성됩니다. 생성 이미지를 수치·정답·판정의 근거로 사용하지 않았습니다.
- VoiceOver는 프로젝트 규칙에 따라 실행하지 않았습니다. reduced-motion은 CSS 규칙·컴포넌트 계약을 확인했으며 OS 미디어 에뮬레이션은 실행하지 않았습니다.
- 릴리스: 사용자 요청에 따라 기능 브랜치 커밋(`efb8219`, `95711d6`, `ab57f1c`)을 PR #1로 푸시하고 원격 `main`에 병합했습니다. 병합 커밋은 `c0f9c90557c958d1aae6fe2d8dc3dd0ffeedf80e`입니다.
- GitHub Actions [Deploy to GitHub Pages run 33340014676](https://github.com/WBmaker2/mean-balance-lab/actions/runs/33340014676)이 build·Pages deploy 모두 성공했습니다.
- 공개 주소 [https://wbmaker2.github.io/mean-balance-lab/](https://wbmaker2.github.io/mean-balance-lab/)에서 제목 `평균 균형 조정실`, 상대 자산 경로, 상황→예측→재배분 학습 경로, 한 개 이동 후 `[3,4,6,7]`, reset 후 `[2,4,6,8]`, 320px·1280px 오버플로 없음, 콘솔 오류 0을 확인했습니다.

## Learner takeaway and next action

학습자는 전체 양을 그대로 두고 한 개씩 옮겨 보면서, 네 상자의 수가 같아질 때 평균이 5가 된다는 것을 점·숫자·문장으로 함께 확인할 수 있습니다. 평균은 자료를 간단히 살펴보는 데 도움이 되지만, 범위와 각 값도 함께 봐야 한다는 안전한 결론을 남깁니다.

릴리스 후 공개 학습 경로까지 확인했으므로 이번 범위의 구현·문서화·배포 단계가 완료되었습니다. 이후 변경은 새 학생용 문장 또는 시뮬레이션 상태가 추가될 때 같은 원장과 동일 시나리오로 회귀 검증하면 됩니다.
