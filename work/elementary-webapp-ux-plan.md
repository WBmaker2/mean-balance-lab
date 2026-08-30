# Elementary Web App UX Improvement Plan

## Goal

초등학교 5~6학년 학습자가 평균 균형 조정실을 처음 열었을 때 학습 목표와 첫 행동을 빠르게 찾고, 미션으로 이동한 뒤 현재 단계·시각 자료·오답 회복 방법을 잃지 않도록 개선합니다. 기존 평균 학습 모델, 네 미션, 여덟 고정 자료, 버튼 기반 재배분, 익명 로컬 저장, DOM이 소유하는 수학 값은 유지합니다.

이번 실행 모드는 `full`이며 대상은 `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`입니다. 커밋·푸시·배포·HVC 등록·갤러리 동기화·의존성 설치는 이 실행에 포함하지 않습니다.

## Architecture

- `HashRouter`와 `LabSessionContext` reducer의 계산·판정·라우팅·저장 계약을 유지합니다.
- `useStageFocus`가 미션 단계 진입 때 `#main-content`를 보이는 초점 대상으로 만들고, 브라우저가 시작 버튼을 보기 위해 자동으로 내린 스크롤도 새 단계의 상단으로 되돌립니다.
- `StartScreen`은 질문·목표·다음 미션·난이도·CTA의 기존 의미 순서를 유지하면서 CTA를 찾는 짧은 다음 행동 안내를 추가합니다.
- `RedistributionPanel`의 오류 설명은 `FeedbackPrompt`의 하나의 `role="alert"`로 제공하고, 성공적인 이동·취소만 `LiveRegion`으로 알립니다. 같은 문장을 alert와 status가 동시에 반복하지 않게 합니다.
- `LiveRegion`은 메시지가 비어 있을 때 DOM에 렌더링하지 않습니다. 수학 값·현재 수량·평균·균형 판정은 기존 semantic DOM과 도메인 상태가 계속 소유합니다.
- 예측 버튼과 출발 상자는 선택 상태를 `aria-pressed`·`data-selected`·지속적인 색/테두리로 보여 줍니다. 선택한 출발 상자와 다음 목적지를 짧은 문장으로 알려 주되, 성공 이동용 status와 겹치지 않게 합니다.
- outlier와 대표값 미션에도 기존 `DotPlot`을 재사용해 변경 전·후와 대표 자료의 모양을 시각화합니다. 숫자와 판정은 계속 DOM 텍스트가 소유하며 새 이미지나 외부 의존성은 추가하지 않습니다.
- 기록 앵커는 실제 focusable target으로 이동하고, `prefers-reduced-motion: reduce`에서는 `scrollIntoView`에 `behavior: auto`를 전달합니다. 재배분 stage wrapper는 SectionIntro와 고유한 landmark 이름을 사용합니다.

## Tech Stack

- React 19.2, TypeScript strict mode, Vite 8, React Router DOM 7 `HashRouter`
- CSS custom properties와 기존 light-mode 토큰
- Vitest 4, React Testing Library, `@testing-library/user-event`
- Playwright 브라우저 MCP와 저장소의 Chromium E2E 설정, `@axe-core/playwright`가 제공하는 자동 접근성 검사
- 현재 `package-lock.json`과 `node_modules`를 사용하며 새 패키지를 추가하지 않습니다.

## Spec

### 학습 목표와 흐름 연결

1. 평균을 전체 양을 고르게 나눈 값으로 설명하는 흐름은 `SituationPanel → PredictionPanel → RedistributionPanel`과 현재 수량 DOM으로 보존합니다.
2. 합계와 자료 개수로 평균을 계산하는 흐름은 `CalculationCheck`의 기존 입력·검증·근거 문장을 보존합니다.
3. 평균이 같아도 자료의 퍼짐과 모양이 다를 수 있다는 흐름은 `ComparisonPanel`과 `DotPlot`을 변경하지 않습니다.
4. 한 값 변화가 합계·평균에 미치는 영향은 `OutlierDeltaPanel`과 기존 비교 근거를 변경하지 않습니다.
5. 평균의 도움과 한계는 결과 화면의 안전 문구와 근거 선택을 유지합니다.
6. 교육용 가상 자료, 익명 결과, 로컬 저장 경계, `업데이트 내역`, `gi-pulse`, `prefers-reduced-motion` 대체 표현을 유지합니다.

### 기준선 플레이테스트 기록

실제 학생 표본이 아닌 시뮬레이션 패널로 초5~6 주 페르소나 `서윤`과 인접 가드레일 `준호`의 행동을 점검했습니다. 실제 학생 승인이나 사용자 연구 결과로 표현하지 않습니다.

| 페르소나 / 화면 | 보이는 단서 | 행동 | 관찰 결과 | 증거 |
|---|---|---|---|---|
| 서윤 / 375×812 시작 | 제목과 오늘의 목표만 첫 viewport에 보임 | 아래로 스크롤해 다음 미션을 찾음 | `미션 시작`이 첫 viewport 밖(`y=1162`, viewport 높이 812) | `output/playwright/elementary-baseline-start-375.png`, Playwright snapshot `page-2026-08-30T11-50-38-270Z.yml` |
| 서윤 / 320×800 시작 | 목표 목록과 안전 문구가 길게 이어짐 | 여러 번 스크롤 후 CTA 탐색 | `미션 시작`이 `y=1188`에 있어 첫 행동 위치를 추측해야 함 | `output/playwright/elementary-baseline-320-viewport.png`, snapshot `page-2026-08-30T11-49-08-321Z.yml` |
| 준호 / 375×812 시작→상황 | 시작 버튼을 누름 | CTA를 누른 뒤 미션 진입 | 브라우저가 버튼을 보기 위해 `scrollY=778.5`로 내린 상태가 유지되어 `#main-content` 상단과 미션 제목이 viewport 위로 사라짐 | Playwright evaluate 결과 `scrollAfterStart=778.5`, snapshot `page-2026-08-30T11-50-45-191Z.yml` |
| 준호 / 375×812 재배분 오답 | `고르게 나누기 확인` 버튼과 현재 수량 | 균형 전 확인 버튼을 누름 | 같은 문장이 `role="alert"`와 `role="status"`에 각각 나타남 | Playwright 결과 `alertCount=1`, `statusCount=1`, 두 텍스트 동일; snapshot `page-2026-08-30T11-51-38-218Z.yml` |
| 서윤 / 1280×900 완료 | 작업대와 근거 버튼 | A 세트 한 미션 완료 | 결과에 사용한 근거·수정 기록·`활동 마치기`가 표시되고 가로 넘침 없음 | Playwright run 결과 URL `.../mission-result`, `overflow=false` |

### 이슈 원장

#### EDU-UX-001 — 모바일 미션 진입 시 이전 스크롤 위치가 유지됨

- Severity: P1
- Path/state: 시작 화면에서 `미션 시작` 클릭 → `/mission/balance-delivery/balance-20-a/situation`
- Persona/viewport: 초3~4 준호 / 375×812, 초5~6 서윤 / 320×800
- Observed action/result: CTA를 보기 위해 브라우저가 `scrollY=778.5` 또는 약 810으로 이동한 뒤, `useStageFocus`의 `preventScroll: true`가 그 위치를 유지합니다. 새 미션의 상단 제목과 맥락이 viewport 밖에 있고 단계 내용 중간부터 보입니다.
- Learner impact: 학습자가 새 단계의 질문과 자료를 다시 찾아야 하며, 다음 행동의 맥락을 잃을 수 있습니다.
- Root-cause hypothesis: 단계 초점 훅이 초점을 이동하지만 새 route의 문서 스크롤을 상단으로 정규화하지 않습니다.
- Proposed change: `src/hooks/useStageFocus.ts`에서 `window.scrollY > 0`일 때 `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })`를 먼저 호출하고 `main.focus({ preventScroll: true })`를 유지합니다.
- Verification: 375×812와 320×800에서 새 탭 → 시작 → `미션 시작` 뒤 `scrollY === 0`, `상황을 살펴볼까요?` heading visible, `#main-content` focused.
- Status: resolved 2026-08-30; unit and browser MCP revalidation passed

#### EDU-UX-002 — 오답 안내가 alert와 status로 중복됨

- Severity: P2
- Path/state: `/mission/balance-delivery/balance-20-a/redistribute`, `[2,4,6,8]` 상태에서 `고르게 나누기 확인`
- Persona/viewport: 초3~4 준호 / 375×812
- Observed action/result: `아직 상자 수가 같지 않아요. 다음 행동: 더 많은 상자에서 적은 상자로 1개를 옮겨 보세요.`가 `FeedbackPrompt`의 alert와 `LiveRegion`의 status에 동시에 표시됩니다.
- Learner impact: 같은 오류 설명이 두 위치에 반복되어 시각적 밀도와 보조공학 알림 중복이 생기며, 다음 행동이 하나의 문장으로 수렴하지 않습니다.
- Root-cause hypothesis: 오류에도 `announce()`를 호출하면서 성공 이동 전용 status와 오류용 alert가 함께 렌더링됩니다.
- Proposed change: 오류 시 `LiveRegion` 메시지를 비우고, 빈 메시지인 `LiveRegion`은 렌더링하지 않습니다. 성공 이동·취소 알림은 기존 status를 유지합니다. 오류를 닫은 뒤 이전 메시지가 다시 나타나지 않도록 source 선택 시에도 메시지를 비웁니다.
- Verification: 오답 확인 뒤 `role="alert"` 1개, 동일 텍스트의 `role="status"` 0개, 다른 상자 source 선택 뒤 이전 오류 status 0개, 다음 이동 뒤 성공 status 1개.
- Status: resolved 2026-08-30; unit and browser MCP revalidation passed

#### EDU-UX-003 — 시작 화면의 첫 행동 단서가 긴 목표 목록 아래에 있음

- Severity: P2
- Path/state: `/#/` cold start
- Persona/viewport: 초5~6 서윤 / 375×812, 초1~2 민서 가드레일 / 320×800
- Observed action/result: 질문·목표를 읽은 뒤 다음 미션과 `미션 시작`을 찾으려면 스크롤해야 합니다. 320px과 375px에서 CTA가 첫 viewport 밖입니다.
- Learner impact: 학습 목표를 이해해도 바로 무엇을 눌러야 하는지 한 번 더 탐색해야 합니다.
- Root-cause hypothesis: 시작 화면은 학습 목표 네 줄을 먼저 보여 주고 CTA를 정상 문서 흐름의 마지막에 배치합니다.
- Proposed change: 질문 아래에 `다음 행동: 자료 난이도를 고르고 미션 시작을 눌러요.`라는 짧은 learner-facing 안내를 추가해 스크롤 전에도 행동 순서를 알려 줍니다. CTA 수와 `data-current-action="true"` 수는 1개로 유지합니다.
- Verification: 320/375px 첫 viewport의 안내 문구 노출, `미션 시작`의 accessible name 유지, current action 정확히 1개, 기존 네 목표 문장과 순서 유지.
- Status: resolved 2026-08-30; cue visible in first viewport, CTA remains normal document flow

#### EDU-UX-004 — detector가 측정 상자 무늬를 장식 grid로 보고함

- Severity: P3 advisory
- Path/state: 균형 배송 작업대의 네 상자
- Observed action/result: `detect.mjs --json src`가 `src/styles/components.css:66`의 `.box-pattern-grid` two-axis gradient를 1건 보고했습니다.
- Learner impact: 현재 상자 구분을 위한 무늬이며 값·수식·판정은 DOM에 있어 학습 흐름을 막지 않습니다.
- Root-cause hypothesis: 정적 detector가 측정 surface와 일반 배경을 구분하지 못합니다.
- Proposed change: 코드 변경 없이 false positive로 기록합니다. 네 상자는 번호·텍스트·무늬를 함께 사용하고 `design-system/MASTER.md`가 측정 작업대 무늬를 허용합니다.
- Verification: detector 결과 1건을 재확인하고, 시각 검토에서 무늬가 값·버튼보다 앞서지 않는지 확인합니다.
- Status: accepted advisory 2026-08-30; independent detector review confirmed the intentional measurement pattern

#### EDU-UX-005 — 예측 선택 상태가 포커스를 잃으면 눈에 남지 않음

- Severity: P1
- Path/state: `/mission/*/*/predict`에서 평균 또는 변화 방향 선택 후 다음 단계 전
- Persona/viewport: 초5~6 서윤 / 375×812, 1280×900
- Observed action/result: `aria-pressed="true"`는 남지만 선택 버튼의 배경·테두리가 일반 버튼과 같아져 선택 여부를 기억해야 합니다.
- Learner impact: 이미 고른 예측을 잃어버린 것처럼 느끼거나 다른 답을 다시 고를 수 있습니다.
- Root-cause hypothesis: `ActionButton`의 공통 hover/current-action 스타일만 있고 `aria-pressed` 선택용 지속 스타일이 없습니다.
- Proposed change: `PredictionPanel`에서 선택 버튼에 `choice-selected`와 `data-selected="true"`를 부여하고 전용 CSS로 배경·테두리·내부 선택 표시를 유지합니다. 기존 `data-current-action`은 다음 단계 버튼 하나만 소유합니다.
- Verification: 예측 선택 뒤 버튼 accessible name·`aria-pressed="true"`·`data-selected="true"`·`choice-selected`가 유지되고 current action은 1개입니다.
- Status: resolved 2026-08-30; selected class/data and aria-pressed revalidated

#### EDU-UX-006 — 재배분 출발 상자 선택이 보이지 않음

- Severity: P1
- Path/state: `/mission/balance-delivery/*/redistribute`에서 `1개 꺼내기` 후 목적지 선택 전
- Persona/viewport: 초5~6 서윤 / 320×800, 375×812
- Observed action/result: `selectedSource` 내부 상태는 있으나 카드·버튼에 선택 표시가 없어 두 단계 조작을 기억해야 합니다.
- Learner impact: 어느 상자에서 꺼낼지 잊고 같은 상자에 넣거나 잘못된 상자를 다시 누를 수 있습니다.
- Root-cause hypothesis: source 버튼이 `onClick`만 제공하고 `aria-pressed`·선택 문장·카드 상태를 렌더링하지 않습니다.
- Proposed change: 현재 작업대에 `먼저 꺼낼 상자를 골라요. 다음으로 넣을 상자를 골라요.` 안내와 `선택한 상자: N번` 문장을 추가합니다. 선택 카드에는 `data-selected="true"`, source 버튼에는 `aria-pressed="true"`를 제공하고 기존 목적지 추천 pulse는 하나만 유지합니다.
- Verification: source 선택 뒤 선택 문장과 카드/버튼 상태가 보이고, 오류 회복·성공 이동·current action 1개가 유지됩니다.
- Status: resolved 2026-08-30; selected card/button and instruction revalidated

#### EDU-UX-007 — reduced-motion 기록 이동이 smooth로 실행됨

- Severity: P2
- Path/state: 모든 화면의 도구 모음 `기록` 링크
- Persona/viewport: 모션 감소를 요청한 키보드 학습자 / 375×812
- Observed action/result: CSS의 `scroll-behavior: auto`와 무관하게 JS가 `behavior: smooth`를 직접 전달합니다.
- Learner impact: 모션 감소 설정을 선택한 학습자에게 불필요한 스크롤 애니메이션이 발생합니다.
- Root-cause hypothesis: `UtilityToolbar`가 `matchMedia`를 확인하지 않고 smooth를 고정합니다.
- Proposed change: `prefers-reduced-motion: reduce`일 때 `behavior: auto`, 그 외에는 `smooth`를 선택하는 작은 함수와 단위 테스트를 추가합니다.
- Verification: 두 모드에서 `scrollIntoView` 인자가 각각 `auto`/`smooth`이고 route·focus가 유지됩니다.
- Status: resolved 2026-08-30; unit and browser MCP behavior auto revalidated

#### EDU-UX-008 — outlier·대표값 자료의 시각 단서가 약함

- Severity: P2
- Path/state: `/mission/outlier-alert/*/compare`, `/mission/representative-review/*/compare`
- Persona/viewport: 초5~6 서윤 / 375×812
- Observed action/result: 값·합계·평균이 문장으로만 쌓이고 균형 미션처럼 점의 분포를 한눈에 비교할 수 없습니다.
- Learner impact: 한 값이 튀어 평균이 움직이는 모습과 평균이 같아도 모양이 다른 사실을 직접 보기 어렵습니다.
- Root-cause hypothesis: `OutlierDeltaPanel`과 `RepresentativeComparisonPanel`이 `DotPlot`을 사용하지 않습니다.
- Proposed change: `DotPlot`을 변경 전/후와 대표 자료에 삽입하고, 기존 문장·수식·accessible label을 보존합니다.
- Verification: 각 compare 화면에 자료별 `role="img"` 점도표가 있고 숫자 텍스트·판정·current action이 유지됩니다.
- Status: resolved 2026-08-30; dot plot DOM labels and unit tests passed

#### EDU-UX-009 — 기록 앵커가 실제 focus target이 아님

- Severity: P2
- Path/state: 도구 모음 `기록` 링크 클릭
- Persona/viewport: 키보드·스크린 리더 DOM 사용 학습자 / 320×800, 1280×900
- Observed action/result: 시작 화면은 `aria-hidden` clipped span, 미션 화면은 `tabIndex` 없는 aside라 스크롤 후 focus가 링크에 남습니다.
- Learner impact: 기록 영역으로 이동했는지 인식하지 못하고 다음 조작 위치를 잃습니다.
- Root-cause hypothesis: 앵커 target의 focusability와 accessible name이 화면별로 통일되어 있지 않습니다.
- Proposed change: `#artifact-records` target에 `tabIndex={-1}`과 이름을 제공하고 toolbar helper가 해당 요소를 직접 focus합니다. details target만 summary를 사용합니다.
- Verification: 기록 클릭 후 hash route가 바뀌지 않고 target이 `document.activeElement`, details open, scroll target이 됩니다.
- Status: resolved 2026-08-30; start/mission record targets receive focus

#### EDU-UX-010 — 재배분 stage wrapper와 intro가 같은 landmark 이름을 가짐

- Severity: P2 accessibility advisory
- Path/state: `/mission/balance-delivery/*/redistribute`
- Persona/viewport: landmark 탐색을 사용하는 키보드·스크린 리더 DOM 사용자
- Observed action/result: outer stage section과 SectionIntro가 같은 `aria-labelledby="redistribution-heading"`을 사용해 landmark 이름이 중복됩니다.
- Learner impact: landmark 목록에서 두 영역을 구분하기 어렵습니다.
- Root-cause hypothesis: stage wrapper가 intro heading을 재사용합니다.
- Proposed change: outer wrapper에 `aria-label="재배분 활동"`을 부여해 intro region과 고유 이름을 갖게 합니다.
- Verification: axe `landmark-unique` 위반이 없고 `구슬을 고르게 옮겨 볼까요?`와 `재배분 활동`이 각각 한 번씩 노출됩니다.
- Status: resolved 2026-08-30; outer label is `재배분 활동`, axe CLI remains not run

## Global Constraints

- 기존 `src/domain`, `src/state`, `src/content/missions.ts`의 수학·판정·라우팅·저장 계약을 변경하지 않습니다.
- 네 미션·여덟 고정 자료·자연수 평균·버튼 기반 재배분·읽기 전용 점도표를 유지합니다.
- 이름·학번·성적·신체 자료·실제 학급 자료·계정·순위·AI·센서·마이크·음성·외부 통신을 추가하지 않습니다.
- 교육용 핵심 버튼은 현재 행동 하나에만 `gi-pulse`를 사용하고, `prefers-reduced-motion: reduce`에서는 정적 outline과 `다음 행동` 문구를 유지합니다.
- 모든 버튼·링크·입력·summary는 44×44px 이상, 320/375px에서 가로 overflow 없음, light mode만 사용합니다.
- 단일 TS/TSX/CSS 파일은 500줄 미만으로 유지합니다. 새 책임을 기존 대형 파일에 합치지 않습니다.
- 업데이트 내역 버튼과 2026-08-30 실제 날짜 기록을 유지합니다.
- VoiceOver와 실제 보조공학 사용자 승인은 이 실행의 검증 범위가 아닙니다. DOM 이름·axe·키보드·모바일 결과와 분리해 보고합니다.
- 브라우저 설치가 필요한 명령은 실행하지 않습니다. Playwright CLI wrapper는 npm 캐시 권한 오류로 사용할 수 없어, 런타임 브라우저 MCP를 기준선·회귀 증거에 사용합니다.

## Expected File Structure and Responsibilities

```text
mean-balance-lab/
├── work/elementary-webapp-ux-bootstrap.md       # Stage 0 ready 보고서
├── work/elementary-webapp-ux-plan.md             # 이번 실행의 기준선·범위·TDD 계획
├── work/elementary-webapp-ux-audit.md            # 초기·최종 관찰과 detector 결과
├── work/elementary-webapp-ux-report.md           # 최종 수용 게이트·점수·미실행 범위
├── src/hooks/useStageFocus.ts                    # route stage scroll/focus handoff
├── src/hooks/useStageFocus.test.tsx              # focus와 scroll 호출 계약
├── src/components/start/StartScreen.tsx          # 다음 행동 learner cue
├── src/components/start/StartScreen.test.tsx     # cue와 current action 계약
├── src/components/shared/LiveRegion.tsx          # 비어 있지 않은 status만 렌더링
├── src/components/shared/LiveRegion.test.tsx     # 빈/성공 announcement 계약
├── src/components/mission/RedistributionPanel.tsx # 오류/성공 announcement 분리
├── src/components/mission/RedistributionPanel.test.tsx # 중복 feedback 회귀
├── src/styles/learner-cues.css                   # 시작 화면 다음 행동 안내 스타일
├── tests/e2e/education-redesign.spec.ts          # mobile route scroll와 learner cue
└── src/content/updateHistory.ts                  # 개선 날짜·짧은 내역
```

## Work Items and TDD Order

각 작업은 `실패 테스트 작성 → 실패 확인 → 최소 구현 → 같은 테스트 통과 → 관련 회귀 테스트` 순서로 실행합니다.

### Task 1 — 시작 행동 단서와 stage scroll handoff

**Files**

- Modify: `src/hooks/useStageFocus.ts`
- Modify: `src/hooks/useStageFocus.test.tsx`
- Modify: `src/components/start/StartScreen.tsx`
- Modify: `src/components/start/StartScreen.test.tsx`
- Add: `src/styles/learner-cues.css`
- Modify: `src/main.tsx`
- Modify: `tests/e2e/education-redesign.spec.ts`
- Modify: `src/content/updateHistory.ts`

**Interfaces**

- `useStageFocus(focusKey: string): void`는 기존 API를 유지하고, `window.scrollY > 0`에서 상단 정규화 후 `#main-content`에 초점을 줍니다.
- `StartScreen`은 기존 `SectionIntroProps`, `ActionButtonProps`, `data-current-action` 계약을 유지하며 learner cue `<p className="start-next-action">`를 한 개 제공합니다.

**TDD**

- [x] 실패 테스트: `useStageFocus.test.tsx`에서 `window.scrollY`를 240으로 설정하고 `window.scrollTo` spy가 `{ top: 0, left: 0, behavior: 'auto' }`로 호출되며 main이 focused인지 검증하도록 작성했습니다. `StartScreen.test.tsx`에서 `다음 행동: 자료 난이도를 고르고 미션 시작을 눌러요.`가 보이고 current action이 1개인지 검증하도록 작성했습니다. E2E에서 375px 시작→미션 시작 후 `scrollY === 0`과 상황 heading visible을 검증하도록 작성했습니다.
- [x] 실패 확인: 구현 전 targeted Vitest 실행에서 4개 assertion이 실패하고 9개가 통과했습니다. Playwright CLI는 포트 충돌 후 재사용 모드에서 Chromium 실행 파일 부재로 막혔으며, 같은 시나리오는 브라우저 MCP로 회귀 검증했습니다.
- [x] 최소 구현: `useStageFocus`에서 `window.scrollY > 0`일 때 `window.scrollTo`를 호출하고, `StartScreen`의 SectionIntro 바로 뒤에 짧은 cue를 추가했습니다. 모바일·desktop에서 cue가 기존 목표 문장을 대체하지 않으며 `updateHistory.ts`에 `2026-08-30 / 개선 / 모바일 단계 진입 스크롤과 첫 행동 안내 보강`을 추가했습니다.
- [x] 통과 테스트: 두 Vitest 파일과 관련 browser MCP 시나리오가 통과하고, `#main-content` focus, `상황을 살펴볼까요?` heading, current action 1개가 유지됩니다.
- [x] 관련 회귀: 320/375px overflow, reduced motion, toolbar anchor, start resume/restart, update dialog focus 복귀를 다시 확인했습니다.

### Task 2 — 오류 announcement 중복 제거

**Files**

- Modify: `src/components/shared/LiveRegion.tsx`
- Add: `src/components/shared/LiveRegion.test.tsx`
- Modify: `src/components/mission/RedistributionPanel.tsx`
- Modify: `src/components/mission/RedistributionPanel.test.tsx`
- Modify: `tests/e2e/education-redesign.spec.ts`
- Modify: `src/content/updateHistory.ts`

**Interfaces**

- `LiveRegionProps`는 `{ message: string }`를 유지하며 `message.trim()`이 빈 문자열이면 `null`, 비어 있지 않으면 기존 `p[role="status"][aria-live="polite"][aria-atomic="true"]`를 반환합니다.
- `RedistributionPanel`의 `showFeedback(messageText: string, nextAction: string)`는 `FeedbackPrompt`만 화면에 남기고 announcement message를 비웁니다. 성공 이동·취소의 `announce` 호출은 유지합니다.

**TDD**

- [x] 실패 테스트: `LiveRegion.test.tsx`에서 빈 메시지의 status가 0개이고 성공 메시지의 status가 1개인지 검증하도록 작성했습니다. `RedistributionPanel.test.tsx`에서 균형 전 확인 뒤 alert는 보이지만 status는 없고, source를 다시 고른 뒤 이전 오류가 status로 남지 않으며, 성공 이동 뒤 status가 새 성공 문장을 갖는지 검증하도록 작성했습니다. E2E에서 alert와 status의 동일 텍스트 중복을 검증하도록 작성했습니다.
- [x] 실패 확인: 구현 전 targeted Vitest 실행에서 오류 announcement 관련 assertion이 실패했으며, 구현 후 같은 대상이 통과했습니다. Playwright CLI의 Chromium 실행 파일 부재로 E2E는 브라우저 MCP 대체 증거를 사용했습니다.
- [x] 최소 구현: `LiveRegion`의 조건부 반환, `showFeedback`와 source 선택 시 `announce('')`를 적용했습니다. 오류의 `FeedbackPrompt` 문구와 다음 행동은 변경하지 않았으며 `updateHistory.ts`에 `2026-08-30 / 개선 / 오답 알림 중복 제거`를 추가했습니다.
- [x] 통과 테스트: 두 Vitest 파일과 education-redesign 오답 회복 browser MCP 시나리오가 통과했습니다. 성공 이동·undo status와 current action 1개는 유지됩니다.
- [x] 관련 회귀: 전체 `RedistributionPanel` 테스트, 키보드-only balance flow, reduced motion, 새로 고침 transient feedback 제거를 다시 확인했습니다.

### Task 3 — 선택 상태·시각 자료·모션/landmark 보강

**Files**

- Modify: `src/components/mission/PredictionPanel.tsx`
- Modify: `src/components/mission/PredictionPanel.test.tsx`
- Modify: `src/components/mission/RedistributionPanel.tsx`
- Modify: `src/components/mission/RedistributionPanel.test.tsx`
- Modify: `src/components/mission/OutlierDeltaPanel.tsx`
- Modify: `src/components/mission/OutlierDeltaPanel.test.tsx`
- Modify: `src/components/mission/ComparisonPanel.tsx`
- Modify: `src/components/mission/ComparisonPanel.test.tsx`
- Modify: `src/components/layout/UtilityToolbar.tsx`
- Modify: `src/components/layout/UtilityToolbar.test.tsx`
- Modify: `src/components/mission/MissionScreen.tsx`
- Modify: `src/components/start/StartScreen.tsx`
- Modify: `src/styles/learner-cues.css`
- Modify: `src/content/updateHistory.ts`
- Modify: `README.md`

**Interfaces**

- `PredictionPanel`은 선택된 `ActionButton`에 `choice-selected`와 `data-selected="true"`를 부여하고 `aria-pressed`를 유지합니다.
- `RedistributionPanel`은 `selectedSource: number | null` API를 변경하지 않고 카드 `data-selected`와 source `aria-pressed`, `.selected-source` 문장을 제공합니다.
- `UtilityToolbar`의 same-page scroll helper는 `prefers-reduced-motion`에 따라 `ScrollBehavior`를 선택하고 focus 가능한 target을 직접 사용합니다.
- `DotPlotProps` `{ values: readonly number[]; label: string }`는 변경하지 않고 outlier/대표값 패널에서 재사용합니다.

**TDD**

- [x] 실패 테스트: 선택 예측 class/data, source 선택 상태 문장/aria-pressed, outlier 변경 전·후 점도표, representative 점도표, reduced-motion scroll behavior, 기록 target focus, `재배분 활동` 고유 landmark를 먼저 assertion으로 추가했습니다.
- [x] 실패 확인: Task 3 assertion을 구현 직전에 추가했으며, 별도 red 실행 로그는 남아 있지 않습니다. 구현 후 targeted 6개 파일 31개 테스트와 전체 회귀가 통과했고, 동일 브라우저 시나리오는 MCP로 검증했습니다.
- [x] 최소 구현: 선택용 class/속성·짧은 문장·DotPlot 삽입·모션 감지 helper·focusable anchor·고유 outer label을 기존 컴포넌트에 추가했습니다. `data-current-action`은 단계당 하나를 유지합니다.
- [x] 통과 테스트: 위 Vitest 파일이 통과하고, 점도표의 실제 값·수량은 DOM accessible label과 기존 domain 값과 일치합니다.
- [x] 관련 회귀: 320/375/1280px에서 선택→오류→회복, reduced motion, 키보드 Tab/Enter, toolbar route 보존을 재확인했습니다. axe CLI는 bundled Chromium 부재로 별도 not run입니다.

### Task 4 — 전체 회귀·최종 보고

**Files**

- Add: `work/elementary-webapp-ux-audit.md`
- Add: `work/elementary-webapp-ux-report.md`
- Modify: `work/elementary-webapp-ux-plan.md`

**TDD and acceptance**

- [x] 실패 테스트 기록: Task 1과 Task 2의 구현 전 targeted Vitest는 4개 파일 중 4개가 실패 assertion을 보였고(4 failed, 9 passed), 원인과 최소 수정은 이 보고서에 기록했습니다. Task 3 assertions는 구현 직전에 작성했습니다.
- [x] 최소 구현 기록: 변경 파일·인터페이스·오류 회복·첫 행동 cue·스크롤 handoff를 정확한 경로와 함께 기록했습니다.
- [x] 통과 테스트 기록: `npm run check`, browser MCP 시나리오, detector 1건 advisory, `git diff --check`, scoped placeholder 검색, 500줄 파일 검사 결과를 분리해 기록했습니다.
- [x] 동일 시나리오 재검증: 320/375/1280px에서 cold start → start → situation → prediction → redistribute → 자연스러운 오답 → 회복 → balance completion → mission result → next learning action을 다시 실행했습니다. `scrollY`, overflow, focus, alert/status count, 선택 상태, 점도표 label, console errors, failed requests를 결과에 남겼습니다.
- [x] 최종 acceptance gate: P0 0개, 해결되지 않은 P1 0개, 주 페르소나 핵심 경로 시작·완료·오답 회복, 320px CTA 가림 없음, 키보드 핵심 조작, reduced motion, 최종 takeaway 또는 다음 행동을 확인했습니다. VoiceOver는 `not run`으로 기록합니다.

## Future Commands and Expected Results

아래 명령은 이후 구현·검증 시 실행할 항목이며 지금 실행하지 않습니다.

```bash
npm test -- --run src/hooks/useStageFocus.test.tsx src/components/start/StartScreen.test.tsx src/components/shared/LiveRegion.test.tsx src/components/mission/RedistributionPanel.test.tsx
npm run typecheck
npm run check
PLAYWRIGHT_PORT=4201 PLAYWRIGHT_REUSE_SERVER=true npx --no-install playwright test tests/e2e/education-redesign.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/responsive-motion.spec.ts --project=chromium
git diff --check
node /Users/kimhongnyeon/.agents/skills/impeccable/scripts/detect.mjs --json src
rg -n 'T[D]B|TO[D]O|FIXME|적절히 처리|나중에 작성|Task [0-9]+과 동일' src tests work/elementary-webapp-ux-bootstrap.md work/elementary-webapp-ux-audit.md
find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 awk 'length($0) > 500 { print FILENAME ":" FNR; exit 1 }'
```

예상 결과:

- 신규 단위 테스트는 최소 구현 전 실패하고 최소 구현 후 모두 통과합니다.
- `npm run typecheck`, `npm run check`는 exit 0입니다.
- Playwright는 320/375/1280px에서 route scroll top, cue, alert/status 단일화, mobile overflow, keyboard, reduced motion을 통과합니다. Playwright CLI wrapper 대신 브라우저 MCP를 사용해야 하면 그 차이를 보고서에 기록합니다.
- detector는 `.box-pattern-grid`의 의도적인 advisory 1건만 남기고, 이를 제품 무결성 실패로 판정하지 않습니다.
- `git diff --check`와 소스·테스트·현재 감사 문서의 placeholder 검색은 0건이며, 소스 한 줄 500자 초과 검사도 exit 0입니다.

## Rollback

- EDU-UX-001 변경을 되돌릴 때 `src/hooks/useStageFocus.ts`의 `scrollTo` 블록과 해당 unit/E2E assertion만 제거하고 기존 `main.focus({ preventScroll: true })`를 유지합니다.
- EDU-UX-002 변경을 되돌릴 때 `LiveRegion.tsx` 조건부 반환과 `RedistributionPanel.tsx`의 빈 announcement 호출만 되돌립니다. 성공 이동·취소 도메인 이벤트는 건드리지 않습니다.
- EDU-UX-003 cue가 읽기 부담을 늘리면 `StartScreen.tsx`의 `.start-next-action` 문단과 전용 CSS만 제거합니다. 목표 네 문장·CTA·`gi-pulse`는 유지합니다.
- EDU-UX-005 선택 표시가 시각적 부담을 늘리면 `PredictionPanel.tsx`의 `choice-selected` class/data와 `learner-cues.css` 선택 규칙만 제거하고 `aria-pressed`는 유지합니다.
- EDU-UX-006 두 단계 안내가 길어지면 `RedistributionPanel.tsx`의 instruction/selected-source 문장과 선택 CSS만 되돌리고 source/destination 동작은 유지합니다.
- EDU-UX-007 모션 감지에 문제가 생기면 `UtilityToolbar.tsx`의 `scrollBehavior` helper만 이전 `smooth` 호출로 되돌리되 reduced-motion CSS는 유지합니다.
- EDU-UX-008 점도표가 정보 밀도를 높이면 outlier/대표값 패널에 추가한 `DotPlot` section만 제거하고 기존 수치·판정 문장은 유지합니다.
- EDU-UX-009 앵커 focus가 부작용을 만들면 `tabIndex={-1}`과 focus helper 변경만 되돌리고 hash href와 scroll target은 유지합니다.
- EDU-UX-010 axe landmark 이름이 회귀하면 outer wrapper의 `aria-label="재배분 활동"`만 이전 labelledby 계약으로 되돌립니다.
- 각 rollback은 `work/elementary-webapp-ux-audit.md`에 이유·검증 상태를 기록하고, 생성된 브라우저 증거 PNG는 다음 감사에 재사용합니다.

## Future Commit Steps

커밋은 검증이 모두 통과하고 사용자가 별도로 승인한 뒤에만 실행합니다. 이 계획에는 명령만 기록합니다.

1. `git status --short --branch`로 이번 UX 문서·소스·테스트만 확인합니다.
2. `git add src/hooks/useStageFocus.ts src/hooks/useStageFocus.test.tsx src/components/start/StartScreen.tsx src/components/start/StartScreen.test.tsx src/styles/learner-cues.css src/main.tsx tests/e2e/education-redesign.spec.ts src/content/updateHistory.ts README.md` 후 `git commit -m "fix: restore mobile learning stage context"`를 실행합니다.
3. `git add src/components/shared/LiveRegion.tsx src/components/shared/LiveRegion.test.tsx src/components/mission/RedistributionPanel.tsx src/components/mission/RedistributionPanel.test.tsx tests/e2e/education-redesign.spec.ts src/content/updateHistory.ts` 후 `git commit -m "fix: avoid duplicate learner feedback"`를 실행합니다.
4. `git add src/components/mission/PredictionPanel.tsx src/components/mission/PredictionPanel.test.tsx src/components/mission/RedistributionPanel.tsx src/components/mission/RedistributionPanel.test.tsx src/components/mission/OutlierDeltaPanel.tsx src/components/mission/OutlierDeltaPanel.test.tsx src/components/mission/ComparisonPanel.tsx src/components/mission/ComparisonPanel.test.tsx src/components/layout/UtilityToolbar.tsx src/components/layout/UtilityToolbar.test.tsx src/components/mission/MissionScreen.tsx src/components/start/StartScreen.tsx src/styles/learner-cues.css src/content/updateHistory.ts README.md` 후 `git commit -m "fix: clarify visual learner selections"`를 실행합니다.
5. `git add work/elementary-webapp-ux-plan.md work/elementary-webapp-ux-audit.md work/elementary-webapp-ux-report.md` 후 `git commit -m "docs: record elementary learner UX audit"`를 실행합니다.
6. 각 커밋 뒤 `git show --stat --oneline HEAD`와 `git status --short --branch`로 범위를 확인합니다. 푸시·배포는 별도 승인 전 실행하지 않습니다.

## Plan Review Checklist

- [x] 설계 문서의 학습 목표·차별성·핵심 흐름·콘텐츠/판정 모델·접근성·개인정보/안전·MVP·완료 기준을 구현 연결 표와 전역 제약으로 대조했습니다.
- [x] 기준선 브라우저 증거와 detector 결과를 이슈별 경로·상태·심각도·검증으로 연결했습니다.
- [x] Task 1~4에 정확한 파일·타입·인터페이스·실패 테스트·최소 구현·통과 조건이 있습니다.
- [x] `gi-pulse`, reduced motion, 업데이트 날짜 기록, 320/375/1280px, 키보드, 스크린 리더용 DOM/알림, VoiceOver 제외 범위를 별도로 적었습니다.
- [x] 새 이미지·외부 의존성·개인정보 입력·도메인 계산 변경 계획이 없습니다.
- [x] 자리표시자 표현을 사용하지 않았고, 파일 분리 책임과 롤백 경계를 명시했습니다.
