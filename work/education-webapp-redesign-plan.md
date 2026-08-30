# Mean Balance Lab Implementation Plan

> 안전 리디자인 범위: 기존 평균 학습 모델과 저장 경계를 유지하면서 초등학교 5~6학년 학습자가 첫 화면에서 다음 행동을 이해하고, 각 단계의 근거를 잃지 않으며, 모바일·키보드 환경에서도 끝까지 활동하도록 화면 계층과 문구를 정리합니다. 이 문서의 명령은 이후 구현·검증 때 실행할 항목이며 이 계획 작성 단계에서는 실행하지 않습니다.

## Goal

기존 `mean-balance-lab`의 네 미션과 여덟 고정 자료를 그대로 보존하면서 다음 결과를 만듭니다.

1. 첫 화면에서 `오늘의 질문 → 오늘의 목표 → 다음 미션 → 자료 난이도 → 미션 시작` 순서가 한눈에 읽히고, 학생이 선택해야 할 현재 행동이 하나로 보입니다.
2. 미션 화면에서 `상황 → 예측 → 재배분 또는 계산 → 비교 → 설명 → 미션 결과` 흐름, 현재 단계, 지금까지 만든 근거가 시각·문자·ARIA로 함께 전달됩니다.
3. 평균을 `전체 양 ÷ 자료 개수`로 해석하는 계산, 같은 평균의 다른 분포, 한 값의 변화, 평균의 유용성과 한계라는 네 학습 목표가 화면 문장과 근거 선택으로 연결됩니다.
4. 버튼 기반 조작을 유지하면서 375px 화면, 200%에 해당하는 큰 글자, 키보드만 사용하는 흐름, `prefers-reduced-motion: reduce` 환경에서 핵심 학습 행동을 완료할 수 있습니다.
5. `gi-pulse`는 현재 단계의 활성 다음 행동 하나에만 유지되고, 감소 모션에서는 정적 테두리와 보이는 `다음 행동` 문구로 바뀝니다.
6. 업데이트 내역 버튼은 콘텐츠를 가리지 않는 위치에서 날짜·구분·짧은 변경 요약을 제공하고, 대화상자 초점 복귀 계약을 유지합니다.
7. 이름·학번·성적·신체 자료·실제 학급 자료·로그인·서버·분석·외부 AI·음성 기능을 추가하지 않습니다.

이번 작업은 기존 릴리스의 기능·도메인 계산·라우팅을 대체하는 재작성 작업이 아니라, 안전한 프레젠테이션 계층 리디자인과 회귀 테스트 보강입니다. 커밋·푸시·배포·HVC 등록·갤러리 동기화는 현재 요청 범위에 포함하지 않습니다.

## Architecture

### 유지하는 흐름

`HashRouter`가 시작·미션·결과 경로를 관리하고, `LabSessionContext`의 reducer가 검증된 예측·재배분·계산·비교·근거를 저장합니다. `src/domain/math.ts`, `src/domain/evaluation.ts`, `src/domain/session.ts`의 계산·판정·단계 게이트는 수정하지 않습니다. 화면은 도메인 값을 새로 계산하지 않고 기존 selector와 content factory를 소비합니다.

### 화면 계층

- `AppShell`: 스킵 링크, 앱 제목, 처음으로, `main-content` 초점 대상, 저장 설정, 업데이트 내역, 안전한 푸터를 유지합니다.
- `SectionIntro`: 초등 학습자용 제목·설명을 같은 구조로 렌더링하는 공유 프레젠테이션 컴포넌트입니다. `eyebrow`는 하위 호환용 optional API로 남기고 실제 learner 화면에는 전달하지 않습니다. 모든 `h1`은 기존 테스트가 사용하는 문구와 고유 `id`를 유지합니다.
- `StartScreen`: 질문·목표·진행 중 미션·다음 미션을 카드 계층으로 보여 주고 활성 CTA를 하나만 노출합니다.
- `ProgressRail`: 단계 수와 현재 단계 요약, 완료·현재·예정 상태를 텍스트와 비색 표식으로 제공합니다.
- `ArtifactTrail`: 검증된 학습 산출물을 짧은 행과 설명 문장으로 유지하며, 빈 단계에서는 렌더링하지 않습니다.
- 미션 패널: `SectionIntro`로 제목 계층을 통일하고 기존 버튼·입력·점도표·피드백 컴포넌트와 reducer 이벤트를 그대로 사용합니다.
- 결과 화면: 근거 우선 카드, 안전 문구, 교사용 요약, 처음부터 다시·활동 마치기 행동을 명확한 순서로 유지합니다.

### 상태와 복구

라우트 단계가 바뀌면 `useStageFocus`가 `#main-content`에 `preventScroll: true`로 초점을 옮깁니다. 새 시각 컴포넌트는 이 효과를 우회하지 않습니다. `sessionStorage` 기본 저장과 사용자가 선택한 `localStorage` 저장, `RESET_ALL` 확인 절차, 새로 고침 시 일시 피드백 제거를 보존합니다.

## Tech Stack

- React 19.2, TypeScript strict mode, Vite 8, React Router DOM 7 `HashRouter`
- CSS custom properties와 미디어 쿼리만 사용하는 정적 light-mode UI
- Vitest 4, React Testing Library, `@testing-library/user-event`, jsdom
- Playwright Chromium과 `@axe-core/playwright`를 사용한 자동 브라우저 검증
- `npm ci`로 고정된 `package-lock.json` 의존성만 사용하며 새 런타임 패키지는 추가하지 않습니다.

프로젝트 규칙 확인 결과: 저장소 루트에는 `AGENTS.md`와 `EDUCATION_DESIGN.md`가 없고, 제품·학습 사실은 `README.md`, `2026-08-26-mean-balance-lab-design.md`, `2026-08-28-mean-balance-lab-improvement-plan.md`에 있습니다. 기존 리디자인 변경과 `design-system/MASTER.md`는 현재 작업 트리의 기준으로 보존합니다. `PRODUCT.md`는 `impeccable` 초기화 절차에 따라 2026-08-30에 확인 가능한 제품 사실만 기록했습니다.

## Role availability and execution record

| 역할 | 스킬 경로 | 확인·읽기 시각 | 이번 실행 상태 |
|---|---|---|---|
| 교육용 리디자인 오케스트레이션 | `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/SKILL.md` | 2026-08-30 12:40~12:54 KST | 사용 중 |
| 시각 품질 감사·방향 | `/Users/kimhongnyeon/.agents/skills/impeccable/SKILL.md` | 2026-08-30 12:40~12:54 KST | context, 방향 시드, comp, spec, font-match 실행 |
| 사용자 흐름·디자인 시스템 설계 | 현재 런타임 Skill 목록에 `$ui-ux-pro-max` 항목 없음 | 2026-08-30 12:54 KST | unavailable; 프로젝트의 `design-system/MASTER.md`와 기존 토큰 계약으로 대체 |
| 토큰·컴포넌트 체계 | `/Users/kimhongnyeon/.agents/skills/design-system/SKILL.md` | 2026-08-30 12:40~12:54 KST | 읽고 3계층 토큰·컴포넌트 계약 반영 |
| 기존 앱 리디자인 구현 | `/Users/kimhongnyeon/.agents/skills/redesign-existing-projects/SKILL.md` | 2026-08-30 12:40~12:54 KST | 읽고 기존 Vite/React/CSS 위에서 구현 |
| 이미지 생성·자산 안전 | `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md`, `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/references/asset-safety.md` | 2026-08-30 12:40~14:50 KST | 내부 comp 3종·paper-ground plate와 `bench-illustration-v2.png` 생성·검토·프롬프트 기록; 제품에는 장식 PNG 1개만 정적 import |

### Direction decision

`concept-seed.mjs --scope direction --mode operate` 실행 키는 `93ababc8`, 지정 번호는 6번이었습니다. 우리 목록의 6번 후보인 **교실 측정 노트와 분배 작업표**를 선택했습니다. 제품의 고유 동작을 노트의 한 장에서 증명하기 위해 따뜻한 아이보리 종이, 그래파이트 잉크, 단일 코발트 현재 상태, 작은 안전 오렌지 표시, 자·줄 노트 리듬, 숫자 중심의 비례폭을 사용합니다. 현재 화면을 카드 모음으로 늘리지 않고 질문·작업대·진행·근거·다음 행동이 한 장의 작업표처럼 연결되게 합니다.

시드가 제공한 challenger를 두 축(학습자 식별 가능성, 제품 명료성)으로 검토한 결과는 다음과 같습니다.

| challenger | 판정 | 반영할 규율 또는 보류 이유 |
|---|---|---|
| phosphor terminal | declined | 기록의 시간성을 차용하지 않고, 아이보리 종이의 잔상 없는 정적 근거 장부로 대체합니다. |
| ASCII live scene | declined | 밀도만으로 값을 읽게 하지 않고 실제 숫자·점·무늬를 유지합니다. |
| orizuru fold sequence | competitive | 단계별 접힘 순서를 참고하되, 교육용 숫자 자료가 주인공인 선형 진행 레일로 제한합니다. |
| iridescent cloud edge | declined | 색 변화보다 합계·평균의 관계가 우선이므로 오렌지 안전 표시 한 점만 남깁니다. |
| streaming title wall | declined | 포스터 탐색 대신 한 번에 한 학습 행동을 보여 주는 작업표로 집중합니다. |
| cd-rom chrome navigation | competitive | 눌림·초점의 물리적 피드백을 버튼 상태에만 기부하고, 장식용 베벨·음성은 사용하지 않습니다. |

선택한 comp는 `.impeccable/mocks/mean-balance-notebook-bench.png`이며 `.json` sidecar에 `approved: true`와 “사용자 진행 요청에 따른 위임 선택”을 기록했습니다. 보조 comp는 `mean-balance-notebook-spread.png`, `mean-balance-notebook-rail.png`입니다. comp 해상도는 1586×992이며, spec·regions는 `.impeccable/build/spec.json`, `.impeccable/build/regions.json`에 있습니다. 이 comp는 구현이 따라야 할 구조 기준이지, 한국어 문장을 이미지로 굳히거나 숫자 UI를 rasterize하는 자산이 아닙니다.

## Spec and traceability

| 설계 요구 | 구현 연결 | 합격 조건 |
|---|---|---|
| 평균을 전체 양을 고르게 나눈 값으로 설명 | `SituationPanel`, `RedistributionPanel`, `buildBalanceEvidenceSentence` | `[2,4,6,8]`을 `[5,5,5,5]`로 만든 뒤 합계 20·개수 4·평균 5 근거가 결과 카드에 남습니다. |
| 합계·개수로 평균 계산 | `CalculationCheck`, `ArtifactTrail`, 계산 화면의 대상 제목 | 빈칸은 해당 필드 안내와 초점을 받고, `20 ÷ 4 = 5`가 검증될 때만 다음 단계가 활성화됩니다. |
| 평균이 같아도 퍼짐·모양이 다름 | `ComparisonPanel`, `DotPlot`, 쌍둥이 근거 factory | 자료 A/B 평균과 범위를 이름으로 읽을 수 있고, 점도표가 색 하나에 의존하지 않습니다. |
| 한 값 변화가 합계·평균에 영향 | `OutlierDeltaPanel`, `ComparisonPanel`, outlier 근거 factory | 합계 변화가 먼저, 평균 변화가 다음으로 표시되고 `[4,5,5,6] → [4,5,5,10]`에서 `+4`, `5→6`이 일치합니다. |
| 평균의 도움과 한계 | 대표값 비교·근거 선택·결과 안전 문구 | 평균만으로 충분하다는 선택은 교정 피드백을 받고 범위·각 값 선택은 성공 근거가 됩니다. |
| 기존 앱과의 차별성 | 고정 가상 자료·읽기 전용 점도표·버튼 재배분 | 실제 자료 업로드, 자유 서술 AI 채점, 순위, 계정, 센서·마이크 요청이 없고 외부 네트워크 요청이 없습니다. |
| 접근성 | `SectionIntro`, semantic regions, `useStageFocus`, `ActionButton`, CSS | axe 심각·치명 위반 0, `Tab/Shift+Tab/Enter/Space` 완주, 고유 heading id, 44px 이상 컨트롤입니다. VoiceOver는 검증 범위에서 제외합니다. |
| 개인정보·안전 | `StoragePreference`, `persistence`, 안전 copy | 식별자 입력·저장이 없고 기본 탭 저장, 선택적 기기 저장, 확인 후 전체 삭제가 유지됩니다. |
| MVP·완료 기준 | 기존 네 미션 E2E와 새 시각·반응형 테스트 | 필수 네 미션 완료, 결과 근거 4개, 새로 고침 복구, 320/375px 무가로스크롤, 빌드 성공입니다. |

## Global Constraints

- 학습자 문장은 초등 5~6학년이 한 번에 읽을 수 있는 짧은 존댓말로 씁니다. 내부 용어(`transientFeedback`, route, dataset id, canonical)는 화면에 노출하지 않습니다.
- 기존 미션 id, dataset id, 배열 순서, 자연수 데이터, `LearningStage`, `LabAction`, `StageArtifacts`, `EvaluationResult`의 의미를 바꾸지 않습니다.
- 현재 단계 CTA 하나만 `data-current-action="true"`와 `gi-pulse`를 가집니다. 보조 버튼·선택 버튼·업데이트 내역 버튼에는 pulse를 붙이지 않습니다.
- `prefers-reduced-motion: reduce`에서 애니메이션·부드러운 스크롤을 제거하고 `gi-pulse`에 4px 정적 outline과 보이는 `다음 행동` 텍스트를 제공합니다.
- 모든 버튼·링크·입력·summary의 실제 표시 영역은 44×44px 이상이어야 하며, 본문과 컨트롤은 WCAG AA에 맞는 대비를 유지합니다.
- light mode만 지원합니다. `prefers-color-scheme: dark`에 따른 색상 반전, 음성 재생·녹음·TTS는 추가하지 않습니다.
- 승인된 이미지 중심 보강에서는 일반 장식·개념 자산만 로컬 버전 파일로 추가합니다. 생성 이미지에는 글자·숫자·수식·표·버튼·로고·실존 인물·사실을 넣지 않으며, 모든 학습 값·점·판정·조작은 semantic DOM과 기존 도메인 상태가 소유합니다. 외부 URL·CDN·런타임 원격 요청은 금지하고, 원본·버전·alt·롤백은 `work/education-webapp-redesign-assets.md`에 기록합니다.
- 선택한 시각 세계는 `교실 측정 노트와 분배 작업표`입니다. `--color-paper`, `--color-ink`, `--color-cobalt`, `--color-annotation` primitive를 semantic·component 토큰으로 연결하고, 줄 노트 배경은 측정 기록 맥락 안에서만 사용합니다.
- 승인 comp의 핵심 구조는 top utility bar, 질문·목표 왼쪽, 네 자료 작업대 중앙, 진행·근거 오른쪽, 하나의 하단 다음 행동입니다. 구현은 semantic HTML과 실제 controls로 같은 관계를 재현하며 comp의 글자를 이미지로 사용하지 않습니다.
- `impeccable` comp-led 절차에서 생성한 `.impeccable/mocks`, `.impeccable/build`, `assets/plates`는 방향 검증용 내부 raster 산출물입니다. 앱 화면에는 이 내부 raster를 참조하지 않으며, 각 raster는 `embed-prompt.mjs --scan`에서 provenance가 확인되어야 합니다.
- Task 12 런타임 자산 `src/assets/notebook/bench-illustration-v2.png`는 별도 안전 검토를 마친 장식 underlay이며, `.impeccable` 방향 comp와 혼동하지 않습니다.
- 기능별 파일 분리를 유지하고 수정·생성하는 모든 `.ts`, `.tsx`, `.css` 파일은 500줄 미만입니다.
- 업데이트 내역에는 이번 작업의 실제 Asia/Seoul 날짜 `2026-08-30`, 구분 `개선`, 짧은 요약을 추가합니다. 이전 날짜 기록은 삭제하지 않습니다.
- 소스 변경 전에는 이 계획, 초기 감사, `design-system/MASTER.md`, 자산 감사 문서를 저장합니다. 구현 후에는 최종 보고서와 검증 명령 결과를 저장합니다.

## Task 12 — 승인된 이미지 중심 노트 작업대 보강

### Goal and scope

첨부된 세 참고 이미지의 노트·트레이·증거 장부·하단 행동 막대 분위기를 현재 semantic 학습 화면에 보강합니다. 정적 생성 일러스트는 빈 트레이와 종이 작업대의 질감만 표현하고, 실제 수량·평균·단계·버튼은 기존 컴포넌트가 계속 렌더링합니다. 기존 네 미션, reducer, 저장 경계, 결과 문장, `gi-pulse` 계약을 바꾸지 않습니다.

### Files and responsibilities

- Add: `src/assets/notebook/bench-illustration-v2.png` — 글자·숫자·로고가 없는 생성 장식 이미지; 빈 트레이와 작업대만 표시합니다.
- Add: `src/components/layout/UtilityToolbar.tsx` — 노트·기록·설정 앵커와 학생 맥락을 semantic `nav`로 렌더링하며 inline SVG 아이콘은 `aria-hidden="true"`입니다.
- Add: `src/components/layout/UtilityToolbar.test.tsx` — 도구 모음의 실제 목적지, 표시 레이블, 장식 아이콘 접근성 계약을 검증합니다.
- Add: `src/components/mission/BalanceIllustration.tsx` — 생성 이미지를 장식 레이어로 배치하고 초기·현재 수량을 DOM 오버레이로 제공합니다.
- Add: `src/components/mission/BalanceIllustration.test.tsx` — `alt=""`, `aria-hidden`, DOM 수량·평균 텍스트, balanced 상태를 검증합니다.
- Add: `src/styles/illustrations.css` — 이미지 레이어, 트레이 값 오버레이, 주황 주석 선, 하단 행동 표면, 960/640/375px 대응을 토큰으로 정의합니다.
- Modify: `src/main.tsx` — `illustrations.css`를 기존 토큰·글로벌·컴포넌트 스타일 뒤에 한 번만 import합니다.
- Modify: `src/app/AppShell.tsx` — `UtilityToolbar`를 header에 연결하고 설정 `details`에 `id="app-settings"`를 부여합니다.
- Modify: `src/components/mission/MissionScreen.tsx` — balance 미션의 현재 작업대에 `BalanceIllustration`을 연결하고 증거 장부에 `id="artifact-records"`를 제공합니다.
- Modify: `src/components/mission/RedistributionPanel.tsx` — 초기·현재 값 props를 시각 레이어에 전달하되 기존 버튼·DOM 값·검증 로직을 유지합니다.
- Modify: `src/content/updateHistory.ts` — `2026-08-30` 이미지 중심 보강 기록을 첫 항목으로 추가하고 이전 기록을 보존합니다.
- Modify: `work/education-webapp-redesign-assets.md` — 생성 자산의 역할·판정·접근성·검토·롤백을 기록합니다.
- Modify: `design-system/MASTER.md` — 생성 장식 이미지 허용 범위와 DOM 데이터 소유 규칙을 반영합니다.
- Modify: `work/education-webapp-redesign-audit.md` — 이미지 중심 보강 전후의 시각·접근성 감사 항목을 추가합니다.
- Modify: `work/education-webapp-redesign-report.md` — 런타임 자산·검증 상태를 구현 후 기록합니다.
- Modify: `README.md` — 로컬 생성 장식 자산과 semantic 데이터 원칙, 업데이트 기록을 반영합니다.
- Modify: `docs/qa/mvp-checklist.md` — 이미지 로딩·장식 alt·외부 요청·좁은 화면 검증 결과를 기록합니다.
- Add or modify: `tests/e2e/education-redesign.spec.ts` — 이미지 로딩, DOM 수량, toolbar 목적지, overflow와 외부 요청을 검증합니다.

### Interfaces and contracts

```ts
export interface BalanceIllustrationProps {
  initialValues: readonly number[];
  currentValues: readonly number[];
  meanValue: number;
  balanced: boolean;
}

export interface UtilityToolbarProps {
  studentLabel?: string;
}
```

- `BalanceIllustration`의 `<img>`는 순수 장식이므로 `alt=""`와 `aria-hidden="true"`를 함께 사용하고, `figure`의 `figcaption`은 DOM 수량·평균을 설명하는 짧은 문장으로 제공합니다. 이미지에 의존하지 않아도 `initialValues`, `currentValues`, `meanValue`를 읽을 수 있어야 합니다.
- 이미지 import는 `src/assets/notebook/bench-illustration-v2.png` 한 경로로 고정하고 외부 `http(s)`·CSS `url()`·추적 픽셀을 사용하지 않습니다. 생성 자산이 폐기되면 해당 import와 wrapper를 제거해 이전 CSS 작업대만으로 되돌릴 수 있습니다.
- `UtilityToolbar`의 노트·기록·설정은 실제 `#main-content`, `#artifact-records`, `#app-settings` 목적지로 이동하며 HashRouter 경로를 바꾸지 않습니다. 설정 앵커는 `details`를 열어 저장 옵션을 바로 보여 주고 dead link·가짜 북마크 상태를 만들지 않습니다. 학생 레이블은 정보 텍스트입니다.
- `RedistributionPanel`의 기존 `ActionButton`, `data-current-action="true"`, `gi-pulse`, `aria-label`, live region과 계산·판정 reducer 이벤트를 변경하지 않습니다. 활성 다음 행동은 항상 정확히 하나입니다.
- 이미지 레이어는 `pointer-events: none`이며 interactive control 위에 올라가지 않습니다. 375px에서 `object-fit: contain`과 DOM fallback surface가 함께 보이고, `prefers-reduced-motion: reduce`에서는 transition·pulse가 정적 outline으로 바뀝니다.
- 모든 신규 `.ts`, `.tsx`, `.css` 파일은 500줄 미만이며, 생성 파일에는 동적 문자열·학습 수치·한국어 문장을 굽지 않습니다.

### TDD order and acceptance

- [x] 실패 테스트: `UtilityToolbar.test.tsx`에서 `노트`, `기록`, `설정`, `학생` 표시와 세 목적지 id를 기대하고, `BalanceIllustration.test.tsx`에서 `img[alt=""]`, `aria-hidden="true"`, 초기·현재 DOM 값과 평균 문장을 기대합니다.
- [x] 실패 확인: `npm test -- --run src/components/layout/UtilityToolbar.test.tsx src/components/mission/BalanceIllustration.test.tsx`가 구현 전 계약 부재를 확인한 뒤 최소 구현 후 통과했습니다.
- [x] 최소 구현: 생성 이미지를 로컬 자산으로 추가하고 두 컴포넌트·`illustrations.css`·AppShell/Mission 연결을 구현했습니다. 데이터와 버튼은 기존 DOM 구조를 유지하고 CSS로 노트 트레이·증거 장부·하단 행동 표면을 강화했습니다.
- [x] 통과 확인: 선택 테스트, `npm run typecheck`, `npm run build`가 exit 0이고 `dist/assets/bench-illustration-v2-DVepsdft.png`가 생성되었습니다.
- [x] 브라우저 합격: 1280px에서 질문→트레이→평균 수식→진행/근거→하단 다음 행동의 시각 순서를 확인했고, 375px·320px에서 `scrollWidth === clientWidth`, 이미지 `naturalWidth === 1896`, 실제 값의 `body.innerText` 노출을 확인했습니다.
- [x] 접근성 합격: 장식 이미지는 axe에 의미 있는 이름을 만들지 않고, toolbar 앵커·버튼·summary는 44px 이상, focus-visible이 보이며, current action은 정확히 하나입니다. VoiceOver는 검증하지 않았습니다.
- [x] 안전 합격: 런타임 `fetch/axios/analytics/gtag/firebase/openai/gemini`, 외부 image/font URL, 학생 식별 입력이 없고, 이미지 파일에는 읽을 수 있는 글자·숫자·로고가 없습니다.
- [x] 문서 합격: 자산 감사·디자인 시스템·감사·최종 보고서·README·QA 문서에 2026-08-30 변경과 실제 검증 결과를 기록했고 placeholder 검색이 0건입니다.

### Future commands and expected results for Task 12

```bash
npm test -- --run src/components/layout/UtilityToolbar.test.tsx src/components/mission/BalanceIllustration.test.tsx
npm run typecheck
npm run build
PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx --no-install playwright test tests/e2e/education-redesign.spec.ts --project=chromium
git diff --check
```

- 선택 테스트는 처음에는 계약 부재로 실패하고 최소 구현 뒤 모든 신규 테스트가 통과합니다.
- `npm run build`는 새 이미지가 hashed asset으로 복사되고 `dist/index.html`이 exit 0으로 생성됩니다.
- Playwright는 toolbar 목적지, 장식 이미지 로딩, balance DOM 값, 375/320px overflow, reduced motion, 외부 요청 0을 통과합니다.
- 위 명령은 계획에 기록하는 향후 실행 목록이며 계획 갱신 시 실행하지 않습니다.

### Rollback

새 이미지가 품질·대비·인지 부하 검토를 통과하지 못하면 `src/components/mission/BalanceIllustration.tsx`, `src/components/layout/UtilityToolbar.tsx`, `src/styles/illustrations.css`, `src/assets/notebook/bench-illustration-v2.png` import와 연결 코드만 되돌리고, 기존 `RedistributionPanel`의 DOM 작업대와 `components.css` 노트 스타일은 유지합니다. `work/education-webapp-redesign-assets.md`에 폐기 상태와 원래 CSS 참조 복귀를 기록하며 원본 favicon·도메인 자산은 삭제하지 않습니다.

### Task 12 implementation record

2026-08-30 14:50 KST 기준 이미지 중심 보강을 구현했습니다. `npm run check`와 전체 Chromium 27개가 통과했고, 데스크톱·모바일 캡처에서 생성 빈 트레이 underlay와 DOM 오버레이를 확인했습니다. 이후 사용자 승인에 따라 `759685a`로 커밋·push했으며 GitHub Actions run `33296397026`으로 Pages 배포를 완료했습니다.

## Initial audit findings

이번 실행의 기준은 `main...origin/main`이며, 2026-08-29 리디자인 소스·문서가 미커밋 상태로 이미 존재합니다. 그 변경을 되돌리지 않고 2026-08-30 교실 측정 노트 시각 세계를 추가 적용합니다. 최신 기능 회귀 테스트와 1440×900 시작 화면, 375×812 미션 화면의 이전 증거는 `work/education-webapp-redesign-audit.md`에 보존했습니다.

1. 시작 화면은 질문·목표·난이도·CTA가 평면적인 문서 흐름으로 이어져 초등학생이 “지금 무엇을 누르는지”를 다시 찾아야 합니다. 카드 경계와 짧은 리드 문장이 필요합니다.
2. `ProgressRail`은 375px에서 완료·현재·예정 텍스트와 단계명이 한 줄 표처럼 붙어 읽기 밀도가 높습니다. 현재 단계 요약과 단계 수를 별도로 제공하고 각 항목의 간격을 키워야 합니다.
3. 고정된 `업데이트 내역` 버튼이 375px에서 설정·푸터 영역 위에 겹쳐 보입니다. 버튼을 shell의 정상 문서 흐름에 배치하고 모바일에서 콘텐츠를 가리지 않게 해야 합니다.
4. 미션 단계의 제목·설명·가상 자료·안전 문구가 패널마다 다른 간격과 구조로 렌더링됩니다. 공통 `SectionIntro`와 stage surface로 학습 행동과 보조 설명을 분리해야 합니다.
5. 색·테두리·카드 토큰은 이미 존재하지만 시작·진행·근거·결과의 정보 계층이 동일한 무게로 보입니다. surface, kicker, action group, progress summary 토큰을 추가하되 기존 색상 의미는 보존해야 합니다.
6. 결과와 교사용 요약의 기능은 충분하므로 계산·판정·저장 로직을 건드리지 않고 결과의 다음 행동·안전 문구·모바일 카드 순서를 시각적으로 강화해야 합니다.

## Replacement-world audit and comp evidence

`impeccable`의 `concept-seed`가 지정한 6번 후보를 기준으로 세 개의 1586×992 desktop comp를 생성하고, 선택 comp를 `.impeccable/mocks/mean-balance-notebook-bench.png`로 승인(사용자 진행 지시에 따른 위임 선택)했습니다. comp는 아이보리 종이 위의 질문·균형 작업대·우측 근거 장부·하단 다음 행동이라는 시각 구조를 검증했습니다. `comp-spec.mjs --grid/--regions`, 12개 text region `font-match --measure`, lead `equation-copy`의 `font-match --rank`를 실행했고, `.impeccable/build/spec.json`과 `.impeccable/build/regions.json`에 기록했습니다. paper-ground 한 개는 `assets/plates/paper-ground.png`에 provenance를 삽입했습니다.

첫 화면 구현은 승인 comp의 비례를 참고하되 실제 앱의 한국어 문장, DOM 수식, 버튼·점도표·무늬 상자를 그대로 사용합니다. comp의 비정확한 이미지 텍스트·아이콘은 복사하지 않으며, 숫자와 수식은 앱 데이터에서 렌더링합니다. Task 12에서는 별도 검토한 글자 없는 빈 트레이 PNG만 중앙 작업대의 장식 underlay로 사용합니다.

## Expected file structure and responsibility

```text
mean-balance-lab/
├── PRODUCT.md                                         # 제품 사실과 안전 경계
├── work/education-webapp-redesign-plan.md             # 본 실행 계획
├── work/education-webapp-redesign-audit.md            # 초기·최종 UI 감사 증거
├── work/education-webapp-redesign-assets.md           # 이미지/자산 분류와 생성 여부
├── work/education-webapp-redesign-report.md           # 구현·검증·미실행 범위 보고
├── design-system/MASTER.md                            # 리디자인 토큰·컴포넌트 규칙
├── src/components/shared/SectionIntro.tsx             # 공통 학습 단계 intro 인터페이스
├── src/components/layout/UtilityToolbar.tsx           # 노트·기록·설정·학생 도구 모음
├── src/components/layout/UtilityToolbar.test.tsx      # same-page 목적지·장식 아이콘 계약
├── src/components/mission/BalanceIllustration.tsx    # 생성 빈 트레이 underlay와 DOM 값 오버레이
├── src/components/mission/BalanceIllustration.test.tsx # 이미지 alt·DOM 값 계약
├── src/assets/notebook/bench-illustration-v2.png      # 글자 없는 로컬 작업대 장식
├── src/styles/illustrations.css                       # 이미지·오버레이·도구 모음 반응형 스타일
├── src/components/start/StartScreen.tsx              # 시작 화면 카드 계층과 CTA
├── src/components/layout/ProgressRail.tsx            # 단계 수·상태·현재 요약
├── src/components/layout/ArtifactTrail.tsx            # 검증 산출물 trail
├── src/components/mission/*.tsx                      # 공통 intro를 사용하는 미션 패널
├── src/components/result/ResultScreen.tsx             # 결과 intro·안전 문구·행동
├── src/components/update/UpdateHistoryDialog.tsx      # 정상 흐름 trigger와 dialog
├── src/content/stages.ts                              # 단계 이름·짧은 학습 행동
├── src/content/updateHistory.ts                       # 날짜 기록
├── src/styles/tokens.css                              # 색·간격·타이포 토큰
├── src/styles/global.css                              # shell·문서·초점·반응형 기반
├── src/styles/components.css                          # 카드·진행·CTA·대화상자 스타일
├── src/components/shared/SectionIntro.test.tsx        # intro semantic contract
├── src/components/start/StartScreen.test.tsx          # 시작 계층·활성 CTA
├── src/components/layout/ProgressRail.test.tsx        # 상태·현재 요약
├── src/components/update/UpdateHistoryDialog.test.tsx # 날짜·초점·trigger
├── tests/e2e/education-redesign.spec.ts               # learner UI acceptance
└── tests/e2e/responsive-motion.spec.ts                # 모바일·큰 글자·reduced motion
```

방향 검증 산출물은 `.impeccable/mocks/mean-balance-notebook-*.png(.json)`, `.impeccable/build/regions.json`, `.impeccable/build/spec.json`, `.impeccable/build/scaffold/`에 남고, `assets/plates/paper-ground.png`는 comp 전용 provenance plate입니다. 이 내부 산출물은 런타임 번들에서 import하지 않습니다.

## Shared interfaces and naming contract

### `src/components/shared/SectionIntro.tsx`

```ts
export interface SectionIntroProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: 'blue' | 'green' | 'orange';
}

export const SectionIntro: (props: SectionIntroProps) => JSX.Element;
```

`id`는 부모 section의 `aria-labelledby`와 같은 값이어야 하며, 화면에 표시되는 `title` 문자열은 기존 learner-facing 테스트와 설계 문서의 개념을 보존합니다.

### `src/content/stages.ts`

```ts
export interface StageMeta {
  label: string;
  action: string;
}

export const STAGE_META: Readonly<Record<LearningStage, StageMeta>>;
export const stageLabel: (stage: LearningStage) => string;
export const stageAction: (stage: LearningStage) => string;
```

`stageAction('predict')`는 `평균이 어떻게 될지 먼저 골라 봐요.`처럼 짧은 학습 행동을 반환합니다. `mission-result`도 결과 다음 행동을 설명하는 값을 갖습니다.

### `src/components/layout/ProgressRail.tsx`

기존 `ProgressRailProps`를 유지하고 다음 읽기 전용 파생 값을 추가합니다.

```ts
interface ProgressSummary {
  completed: number;
  total: number;
  currentLabel: string;
}
```

DOM에는 `nav[aria-label="미션 진행"]`, `ol`, 각 `li[data-stage-status]`, 현재 항목 하나의 `aria-current="step"`, `현재 단계: {label}`, `{completed}/{total} 단계`가 존재해야 합니다.

### `src/components/update/UpdateHistoryDialog.tsx`

기존 `isOpen`, `triggerRef`, `closeRef`, `dialogRef` 포커스 계약을 유지합니다. trigger는 inline style의 fixed 배치를 제거하고 `.update-history-trigger` CSS의 normal flow 배치를 사용합니다. Escape·Tab trap·background inert·trigger 복귀 테스트는 변경하지 않습니다.

## Work items and TDD order

각 작업은 반드시 `실패 테스트 작성 → 실패 확인 → 최소 구현 → 같은 테스트 통과 → 관련 전체 테스트` 순서로 수행합니다. 아래 명령은 이후 실행할 항목입니다.

### Task 0 — 문서·토큰·자산 준비

**Files**

- Create: `work/education-webapp-redesign-plan.md`
- Create: `work/education-webapp-redesign-audit.md`
- Create: `work/education-webapp-redesign-assets.md`
- Create: `design-system/MASTER.md`
- Modify: `src/styles/tokens.css`

**TDD and acceptance**

- [ ] 계획·감사·자산·디자인 시스템 문서를 저장하고, 현재 소스 구조·설계의 모든 목표와 제외 항목을 표로 연결합니다.
- [ ] 토큰 테스트를 먼저 추가할 수 있도록 `src/styles/tokens.css`에만 새 custom property 이름을 정합니다. CSS 파싱 테스트는 브라우저 단계에서 `getComputedStyle(document.documentElement)`로 `--color-surface-raised`, `--space-section`, `--content-readable`가 비어 있지 않은지 확인합니다.
- [ ] `rg -n "TBD|TODO|FIXME|적절히 처리|나중에 작성|Task [0-9]+과 동일" work design-system src tests --glob '!education-webapp-redesign-plan.md'` 결과가 0건이어야 합니다.
- [ ] 이미지 자산은 `public/favicon.svg`만 분류하고 새 이미지 생성은 실행하지 않았다고 기록합니다.

### Task 1 — 공통 intro와 학습 단계 메타데이터

**Files**

- Create: `src/components/shared/SectionIntro.tsx` (<100 lines)
- Create: `src/components/shared/SectionIntro.test.tsx`
- Modify: `src/content/stages.ts`
- Modify: `src/components/mission/SituationPanel.tsx`
- Modify: `src/components/mission/PredictionPanel.tsx`
- Modify: `src/components/mission/RedistributionPanel.tsx`
- Modify: `src/components/mission/CalculationCheck.tsx`
- Modify: `src/components/mission/ComparisonPanel.tsx`
- Modify: `src/components/mission/EvidenceBuilder.tsx`
- Modify: `src/components/mission/MissionSummary.tsx`

**TDD**

- [ ] 실패 테스트: `SectionIntro.test.tsx`에서 `section`의 `aria-labelledby`, 고유 `h1 id`, eyebrow·title·description, tone class를 검증합니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/shared/SectionIntro.test.tsx`가 컴포넌트 부재로 실패해야 합니다.
- [ ] 최소 구현: `SectionIntroProps`와 semantic markup을 만들고, 각 패널의 기존 h1 문구를 그대로 intro의 `title`로 옮깁니다. 기존 `aria-labelledby` id와 버튼 이름은 유지합니다.
- [ ] 통과 확인 명령: `npm test -- --run src/components/shared/SectionIntro.test.tsx src/components/mission`이 통과해야 하며, `npm run typecheck`에 새 오류가 없어야 합니다.
- [ ] 합격 조건: 같은 단계에 h1이 두 개 생기지 않고, 계산 A/B의 h2·결과 카드의 h3/h4 계층이 기존 테스트와 일치하며, `stageAction` 문구가 시각적으로 보입니다.

### Task 2 — 시작 화면의 어린이용 정보 계층

**Files**

- Modify: `src/components/start/StartScreen.tsx`
- Modify: `src/components/start/StartScreen.test.tsx`
- Modify: `src/styles/components.css`
- Modify: `src/styles/global.css`

**Interfaces**

- `StartScreen`은 `.start-screen`, `.start-hero`, `.goal-card`, `.resume-card`, `.next-mission-card`, `.start-actions` class와 `aria-labelledby="start-heading"`를 제공합니다.
- `goals` 배열은 기존 네 학습 목표를 유지하되 문장 길이를 72자 이하로 다듬습니다.

**TDD**

- [ ] 실패 테스트: 시작 화면에 `오늘의 질문`, `오늘의 목표`, `다음 미션`, `자료 난이도`, `미션 시작`이 서로 다른 region/card로 존재하고, `data-current-action="true"`가 정확히 1개인지 검증합니다. 진행 중 run에서는 `이어서 하기`와 현재 단계가 보이고 `미션 시작`은 같은 CTA를 덮어쓰지 않습니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/start/StartScreen.test.tsx`를 실행해 새 class/region assertion이 먼저 실패하는지 확인합니다.
- [ ] 최소 구현: `SectionIntro`를 hero에 사용하고 목표·resume·next mission을 `<section>` 또는 `<aside>`로 분리합니다. 난이도 선택은 기존 radio name/value를 유지하고, primary CTA는 `ActionButton emphasis="next"` 하나만 둡니다. `window.confirm` 문구와 resume route는 변경하지 않습니다.
- [ ] 통과 확인 명령: `npm test -- --run src/components/start/StartScreen.test.tsx src/app/router.route-guards.test.tsx`.
- [ ] 합격 조건: 375px에서 제목·목표·난이도·CTA가 가로로 잘리지 않고, 학생이 화면 첫 스크롤 안에서 미션 시작 버튼을 찾을 수 있습니다.

### Task 3 — 단계 진행과 산출물 trail 재디자인

**Files**

- Modify: `src/components/layout/ProgressRail.tsx`
- Modify: `src/components/layout/ProgressRail.test.tsx`
- Modify: `src/components/layout/ArtifactTrail.tsx`
- Modify: `src/components/layout/ArtifactTrail.test.tsx`
- Modify: `src/styles/components.css`

**TDD**

- [ ] 실패 테스트: `ProgressRail`에 `4/6 단계`, `현재 단계: 계산`, stage action이 있고 완료·현재·예정 li의 `data-stage-status`가 유지되는지 검증합니다. `ArtifactTrail`은 검증 artifact 행에 `data-artifact-kind`와 사람이 읽는 설명을 갖는지 검증합니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/layout/ProgressRail.test.tsx src/components/layout/ArtifactTrail.test.tsx`.
- [ ] 최소 구현: `ProgressSummary` 파생 값을 만들고 단계 목록에 상태 badge·번호·현재 요약을 추가합니다. trail 행은 기존 결과 문구를 유지한 채 `ul`의 카드형 행으로 감쌉니다. 빈 trail은 계속 `null`입니다.
- [ ] 통과 확인 명령: 위 두 테스트와 `npm test -- --run src/domain/session-action-boundary.test.ts`.
- [ ] 합격 조건: 색을 끄고 보아도 상태를 읽을 수 있고, 375px에서 단계명이 겹치지 않으며, 검증되지 않은 계산·비교가 trail에 나타나지 않습니다.

### Task 4 — 미션 패널의 행동 중심 레이아웃

**Files**

- Modify: `src/components/mission/SituationPanel.tsx`
- Modify: `src/components/mission/PredictionPanel.tsx`
- Modify: `src/components/mission/RedistributionPanel.tsx`
- Modify: `src/components/mission/CalculationCheck.tsx`
- Modify: `src/components/mission/ComparisonPanel.tsx`
- Modify: `src/components/mission/EvidenceBuilder.tsx`
- Modify: `src/components/mission/MissionSummary.tsx`
- Modify: `src/components/mission/MissionScreen.tsx`
- Modify: `src/styles/components.css`
- Test: `src/components/mission/PredictionPanel.test.tsx`
- Test: `src/components/mission/CalculationCheck.test.tsx`
- Test: `src/components/mission/ComparisonPanel.test.tsx`

**TDD**

- [ ] 실패 테스트: 각 stage render에서 `section[data-stage]`와 `section-intro`가 하나씩 존재하고, 활성 다음 행동이 1개인지 검증합니다. balance redistribution에서는 source/destination 선택 버튼의 44px 영역과 `고르게 나누기 확인`의 pulse 조건을 검증합니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/mission/PredictionPanel.test.tsx src/components/mission/CalculationCheck.test.tsx src/components/mission/ComparisonPanel.test.tsx`.
- [ ] 최소 구현: 패널을 `stage-panel` surface와 `stage-content`/`action-group`으로 감싸고, 숫자 입력은 기존 `required`, `step=1`, `aria-describedby`, `aria-invalid`, 첫 오류 초점 계약을 유지합니다. 현재 단계 CTA 외 버튼은 `emphasis="normal"`로 유지합니다.
- [ ] 통과 확인 명령: 미션 컴포넌트 전체 Vitest와 `npm run typecheck`.
- [ ] 합격 조건: 평균 계산·재배분·비교·근거 작성의 도메인 이벤트가 바뀌지 않고, 오답 피드백에 다음 행동이 계속 표시되며, 한 화면에서 핵심 버튼이 보조 설명보다 앞에 옵니다.

### Task 5 — 결과 화면과 교사용 요약의 다음 행동

**Files**

- Modify: `src/components/result/ResultScreen.tsx`
- Modify: `src/components/mission/MissionSummary.tsx`
- Modify: `src/components/result/TeacherSummary.tsx`
- Modify: `src/components/result/ResultScreen.test.tsx`
- Modify: `src/components/result/TeacherSummary.test.tsx`
- Modify: `src/styles/components.css`
- Modify: `src/styles/global.css`

**TDD**

- [ ] 실패 테스트: 완성 결과에 `전체 결과`, 두 안전 문구, 근거 카드 4개, 전역 행동 2개가 순서대로 존재하고, 잠긴 결과에는 남은 모든 미션 이름과 `다음 미션 시작` 안내가 보이는지 검증합니다. 모바일 요약 list와 인쇄 table의 semantic label을 함께 검증합니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/result/ResultScreen.test.tsx src/components/result/TeacherSummary.test.tsx`.
- [ ] 최소 구현: 결과 intro·notice·action surfaces를 추가하고 기존 `requiredAttempts`, canonical evidence, reset confirmation을 변경하지 않습니다. 640px 이하에서는 모바일 카드, print에서는 teacher table만 보이도록 기존 CSS 계약을 유지합니다.
- [ ] 통과 확인 명령: 위 테스트와 `npm test -- --run src/domain/evaluation.test.ts src/domain/session.test.ts`.
- [ ] 합격 조건: 총점·순위·개인 비교가 없고, 각 근거 카드는 `내가 사용한 근거 → 고쳐 생각한 과정 → 근거 단계 → 행동` 순서를 유지합니다.

### Task 6 — shell, 업데이트 내역, motion/accessibility 마감

**Files**

- Modify: `src/app/AppShell.tsx`
- Modify: `src/components/update/UpdateHistoryDialog.tsx`
- Modify: `src/components/update/UpdateHistoryDialog.test.tsx`
- Modify: `src/content/updateHistory.ts`
- Modify: `src/styles/global.css`
- Modify: `src/styles/components.css`
- Modify: `src/content/documentation.test.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/responsive-motion.spec.ts`
- Create: `tests/e2e/education-redesign.spec.ts`

**TDD**

- [ ] 실패 테스트: 375px에서 update trigger의 bounding box가 `main`, `.app-settings`, `footer`와 겹치지 않는지 검증합니다. `UPDATE_HISTORY[0]`이 `2026-08-29 / 개선 / 학습 화면 계층과 모바일 행동 흐름 개선`인지 검증합니다.
- [ ] 실패 확인 명령: `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx src/content/documentation.test.ts`와 `npx playwright test tests/e2e/education-redesign.spec.ts --project=chromium`.
- [ ] 최소 구현: trigger의 fixed inline style을 제거하고 normal flow layout을 적용합니다. dialog의 Escape·Tab trap·inert·focus restore는 보존합니다. `gi-pulse`와 reduced-motion 대체 CSS를 시각 토큰과 연결합니다. 새 E2E에는 시작→미션→다음 단계, 좁은 viewport, no external request, no draggable, one current action을 넣습니다.
- [ ] 통과 확인 명령: `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx src/content/documentation.test.ts`; `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/responsive-motion.spec.ts tests/e2e/education-redesign.spec.ts --project=chromium`.
- [ ] 합격 조건: 심각·치명 axe violation 0, visible control 44px 이상, reduced motion에서 animation-name `none`·outline 4px·`다음 행동` 표시, update dialog 열기/닫기 후 trigger 초점 복귀입니다. VoiceOver는 실행하거나 승인으로 기록하지 않습니다.

### Task 7 — 최종 검증 문서와 자체 검토

**Files**

- Create: `work/education-webapp-redesign-report.md`
- Modify: `README.md`
- Modify: `docs/qa/mvp-checklist.md`

**TDD/검증 순서**

- [ ] 실패 기준을 먼저 기록: 새 테스트·기존 테스트·typecheck·build·diff check 중 하나라도 실패하면 리디자인 완료로 표시하지 않습니다.
- [ ] 다음 명령을 순서대로 실행합니다.

```bash
npm run typecheck
npm test -- --run
npm run build
PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx playwright test --project=chromium
git diff --check
find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 wc -l | sort -n | tail -5
rg -n "TBD|TODO|FIXME|적절히 처리|나중에 작성|Task [0-9]+과 동일" work design-system src tests README.md docs --glob '!education-webapp-redesign-plan.md'
```

- [ ] 각 명령의 합격 조건을 보고서에 실제 결과로 기록합니다. `npm run typecheck`, 전체 Vitest, build, 전체 Chromium, `git diff --check`가 모두 exit 0이고 소스 단일 파일이 500줄 미만이어야 합니다.
- [ ] 320×568, 375×812, 768×900, 1280×900에서 시작·상황·예측·재배분·결과를 확인하고, 키보드 Tab/Shift+Tab/Enter/Space, 큰 글자, reduced motion, 인쇄 교사용 요약을 별도 증거로 기록합니다.
- [ ] 공개 배포·GitHub 상태·HVC 카드·VoiceOver/실제 보조공학 사용자 승인은 이 요청의 검증 결과로 주장하지 않습니다.

## Current pass work items — replacement visual world

기존 Task 0~7은 2026-08-29에 반영된 카드 계층·단계 안내·모바일 안전 수정의 추적 기록입니다. 이번 전체 리디자인은 그 미커밋 변경을 기준선으로 삼아 아래 순서로 시각 세계를 교체합니다. 각 작업은 `실패 테스트 작성 → 실패 확인 → 최소 구현 → 같은 테스트 통과 → 관련 전체 테스트` 순서를 지킵니다.

### Task 8 — 노트 작업표 토큰과 문서 계약

**Files**

- Create: `PRODUCT.md`
- Modify: `design-system/MASTER.md`
- Modify: `src/styles/tokens.css`
- Modify: `src/content/updateHistory.ts`
- Modify: `work/education-webapp-redesign-audit.md`
- Modify: `work/education-webapp-redesign-assets.md`

**Interfaces and contracts**

- primitive 토큰: `--color-paper`, `--color-paper-line`, `--color-ink`, `--color-ink-muted`, `--color-cobalt`, `--color-cobalt-deep`, `--color-annotation`, `--font-display`, `--font-body`.
- semantic 토큰: `--surface-page`, `--surface-sheet`, `--surface-workbench`, `--text-primary`, `--text-secondary`, `--border-rule`, `--focus-ring`.
- component 토큰: `--sheet-padding`, `--workbench-gap`, `--action-height`, `--radius-sheet`, `--sheet-shadow`.
- `UPDATE_HISTORY[0]`은 `2026-08-30`·`개선`·`교실 측정 노트 시각 세계와 학습 작업대 재구성`을 갖고 이전 날짜를 보존합니다.

**TDD and acceptance**

- [ ] 실패 테스트: `src/content/documentation.test.ts`에서 새 날짜와 디자인 시스템 파일의 토큰 이름을 확인하고, `tests/e2e/education-redesign.spec.ts`에서 computed style로 light paper surface·cobalt focus·font variant를 확인합니다.
- [ ] 실패 확인: `npm test -- --run src/content/documentation.test.ts`가 새 기록 부재로 실패합니다.
- [ ] 최소 구현: 세 계층 토큰과 문서를 추가하고 임의의 dark-mode·외부 폰트·런타임 테마를 만들지 않습니다.
- [ ] 통과 확인: 문서·토큰 테스트와 `npm run typecheck`가 exit 0입니다.
- [ ] 합격: 지정 토큰은 모두 `var()`로 연결되고 소스의 새 raw hex 색이 컴포넌트에 남지 않으며 제품 런타임은 `assets/plates`를 import하지 않습니다.

### Task 9 — 한 장 작업표 shell과 첫 화면 재구성

**Files**

- Modify: `src/app/AppShell.tsx`
- Modify: `src/components/start/StartScreen.tsx`
- Modify: `src/components/layout/ProgressRail.tsx`
- Modify: `src/components/layout/ArtifactTrail.tsx`
- Modify: `src/components/shared/SectionIntro.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/styles/components.css`
- Modify: `src/components/start/StartScreen.test.tsx`
- Modify: `src/components/layout/ProgressRail.test.tsx`
- Modify: `src/components/layout/ArtifactTrail.test.tsx`

**Interfaces and contracts**

- `AppShell`은 `.notebook-shell`, `.utility-strip`, `.sheet-main`, `.shell-tools`, `.shell-footer` semantic region을 제공합니다.
- `StartScreen`은 `.worksheet-page`, `.question-block`, `.goal-block`, `.mission-selector`, `.worksheet-action` 구조를 유지하면서 `미션 시작` 또는 `전체 결과 보기` current action을 하나만 제공합니다.
- `ProgressRail`의 `ProgressSummary`와 `aria-current="step"` 계약은 유지하고, desktop에서는 얇은 ruled rail, mobile에서는 세로 체크 목록으로 표시합니다.
- `ArtifactTrail`의 `ArtifactRow`·`data-artifact-kind`를 유지하되 장부 행은 실제 검증된 기록만 보여 줍니다.

**TDD and acceptance**

- [ ] 실패 테스트: 시작·미션 route에 `.worksheet-page`, `.question-block`, `.mission-selector`, `.progress-rail`이 있고 body의 첫 viewport에서 다음 행동이 식별되는지, heading에 불필요한 kicker가 없는지 검증합니다.
- [ ] 실패 확인: `npm test -- --run src/components/start/StartScreen.test.tsx src/components/layout/ProgressRail.test.tsx`.
- [ ] 최소 구현: 기존 콘텐츠와 route·dispatch를 바꾸지 않고 ruled paper surface, left question, central workbench slot, right record slot을 CSS grid로 연결합니다. `SectionIntroProps.eyebrow`는 테스트용 optional API로 남기되 실제 learner surface에는 전달하지 않습니다.
- [ ] 통과 확인: 시작·레이아웃 단위 테스트, `npm run typecheck`, `npm run build`.
- [ ] 합격: 1586×992 comp의 읽기 순서(질문→작업대→진행/근거→다음 행동)를 유지하고 320px에서 가로 overflow가 없으며 각 source file이 500줄 미만입니다.

### Task 10 — 미션 패널·결과·상태 피드백의 작업표 언어

**Files**

- Modify: `src/components/mission/SituationPanel.tsx`
- Modify: `src/components/mission/PredictionPanel.tsx`
- Modify: `src/components/mission/RedistributionPanel.tsx`
- Modify: `src/components/mission/CalculationCheck.tsx`
- Modify: `src/components/mission/ComparisonPanel.tsx`
- Modify: `src/components/mission/OutlierDeltaPanel.tsx`
- Modify: `src/components/mission/EvidenceBuilder.tsx`
- Modify: `src/components/mission/MissionScreen.tsx`
- Modify: `src/components/mission/MissionSummary.tsx`
- Modify: `src/components/result/ResultScreen.tsx`
- Modify: `src/components/result/TeacherSummary.tsx`
- Modify: `src/components/shared/ActionButton.tsx`
- Modify: `src/styles/components.css`
- Modify: `src/styles/global.css`
- Modify: `src/components/mission/PredictionPanel.test.tsx`
- Modify: `src/components/mission/CalculationCheck.test.tsx`
- Modify: `src/components/mission/ComparisonPanel.test.tsx`
- Modify: `src/components/result/ResultScreen.test.tsx`

**Interfaces and contracts**

- 도메인 타입 `MissionDataset`, `LearningStage`, `LabAction`, `StageArtifacts`, `EvaluationResult`와 reducer action 이름은 변경하지 않습니다.
- `ActionButton`의 `emphasis="next"`만 `data-current-action="true"`, `gi-pulse`, reduced-motion 보조 문구를 가집니다. `ActionButtonProps`의 공개 필드는 유지합니다.
- 수량·합계·평균·범위 숫자는 `font-variant-numeric: tabular-nums`를 적용하고, dot plot·box pattern·equation은 semantic DOM으로 유지합니다.

**TDD and acceptance**

- [ ] 실패 테스트: 각 stage에 current action 하나, `20 ÷ 4 = 5` 수식, `+4` 합계 변화 후 `5→6` 평균 변화, 결과의 근거·수정 순서가 있는지 검증합니다.
- [ ] 실패 확인: `npm test -- --run src/components/mission src/components/result`.
- [ ] 최소 구현: 패널 surface와 data table/ruler motif를 CSS로 만들고 오답에는 기존 recovery copy를 유지합니다. 버튼 hover·active·disabled·focus, 입력 오류, empty artifact 상태를 모두 스타일링합니다.
- [ ] 통과 확인: 미션·결과·domain 전체 테스트와 `npm run typecheck`.
- [ ] 합격: 평균 의미·계산·분포·한 값 변화·대표값 한계의 다섯 학습 목표가 화면과 결과 근거에서 계속 읽히고, 실제 학생 개인정보·외부 통신·음성 기능이 없습니다.

### Task 11 — 업데이트·모션·반응형·최종 Impeccable 검증

**Files**

- Modify: `src/components/update/UpdateHistoryDialog.tsx`
- Modify: `src/components/update/UpdateHistoryDialog.test.tsx`
- Modify: `tests/e2e/education-redesign.spec.ts`
- Modify: `tests/e2e/responsive-motion.spec.ts`
- Modify: `work/education-webapp-redesign-audit.md`
- Modify: `work/education-webapp-redesign-report.md`
- Modify: `README.md`
- Modify: `docs/qa/mvp-checklist.md`

**TDD and acceptance**

- [ ] 실패 테스트: 320/375/768/1280px, 200% 글자, reduced motion, print summary, keyboard-only flow, update dialog focus restore, no external request, no draggable control을 먼저 검증합니다.
- [ ] 실패 확인: `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx --no-install playwright test tests/e2e/education-redesign.spec.ts --project=chromium`.
- [ ] 최소 구현: `업데이트 내역`은 normal flow 44px control로 유지하고 Escape·Tab trap·trigger 복귀를 보존합니다. reduced motion에서는 animation 대신 4px outline과 `다음 행동`을 표시합니다. `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png`를 캡처하고 `node /Users/kimhongnyeon/.agents/skills/impeccable/scripts/detect.mjs --json`을 한 번 실행합니다.
- [ ] 통과 확인: `npm run check`, Playwright 전체 Chromium, `git diff --check`, source 줄 수·placeholder 검색.
- [ ] 합격: serious/critical axe violation 0, current action 정확히 1개, 컨트롤 44px 이상, overflow 0, public deployment·VoiceOver 승인을 완료 증거로 제시하지 않습니다.

### Task 13 — 현재 수량 원형 요소 실시간 시뮬레이션

**Goal and scope**

`BalanceIllustration`의 빈 트레이 장식 위에 현재 바구니 수량만큼 동그라미를 DOM으로 표시합니다. `MOVE_ONE`과 `UNDO_MOVE`가 갱신하는 `currentValues`를 단일 데이터 원천으로 사용하여, 학생이 1개를 옮길 때 출발 바구니의 동그라미 하나가 사라지고 도착 바구니에 하나가 즉시 나타나도록 합니다. 기존 생성 PNG는 트레이 선과 종이 분위기만 담당하며 숫자·동그라미·수식·상태를 포함하지 않습니다. 초기 수량·현재 수량·평균·상태 텍스트와 기존 버튼/리듀서는 변경하지 않습니다.

**Files**

- Create: `src/components/mission/QuantityDots.tsx`
- Create: `src/components/mission/QuantityDots.test.tsx`
- Modify: `src/components/mission/BalanceIllustration.tsx`
- Modify: `src/components/mission/BalanceIllustration.test.tsx`
- Modify: `src/styles/illustrations.css`
- Modify: `tests/e2e/education-redesign.spec.ts`
- Modify: `src/content/updateHistory.ts`
- Modify: `src/components/update/UpdateHistoryDialog.test.tsx`
- Modify: `design-system/MASTER.md`
- Modify: `work/education-webapp-redesign-assets.md`
- Modify: `work/education-webapp-redesign-report.md`
- Modify: `docs/qa/mvp-checklist.md`

**Interfaces and contracts**

- `QuantityDotsProps`는 `{ values: readonly number[]; label: string }`를 공개하고, `values[index]`를 `index + 1`번 바구니의 표시 개수로 사용합니다.
- `QuantityDots`는 `data-visualization="quantity-dots"`, 각 바구니 그룹의 `data-basket-index`·`data-dot-count`, 각 동그라미의 `data-dot-index`를 제공합니다. 시각 요소 전체는 `aria-hidden="true"`이며 학습 정보는 기존 DOM 텍스트·`LiveRegion`이 소유합니다.
- `BalanceIllustration`은 `currentValues`를 `QuantityDots`에 전달하고 `data-current-values`를 쉼표로 구분한 상태 값으로 유지합니다. `initialValues`·`meanValue`·`balanced` 공개 타입은 변경하지 않습니다.
- 각 바구니는 CSS grid/flex 슬롯으로 정렬하며 동그라미 크기·간격은 320px부터 1280px까지 축소 가능합니다. 고정 픽셀 좌표, canvas, 외부 이미지·폰트·요청은 사용하지 않습니다.
- 동그라미 추가·삭제에는 240ms 이하의 opacity/transform transition만 사용하고, `prefers-reduced-motion: reduce`에서는 transition/animation을 `none`으로 만들어 즉시 정적인 수량을 보여 줍니다.

**TDD order and acceptance**

1. **실패 테스트 작성:** `QuantityDots.test.tsx`에서 `[2, 4, 6, 8]`이 네 그룹의 `data-dot-count`와 총 20개 동그라미를 만드는지, `aria-hidden="true"`와 `data-visualization`을 확인합니다. 같은 렌더러를 `[3, 4, 6, 7]`로 다시 렌더링해 그룹별 3·4·6·7개로 즉시 갱신되는지 검증합니다.
2. **실패 확인:** `npm test -- --run src/components/mission/QuantityDots.test.tsx src/components/mission/BalanceIllustration.test.tsx`가 컴포넌트와 연결 계약 부재로 실패하는 것을 확인합니다.
3. **최소 구현:** `QuantityDots.tsx`에서 값 배열을 순회해 동그라미를 생성하고, `BalanceIllustration.tsx`의 이미지 stage 위에 현재 수량 슬롯을 배치합니다. `illustrations.css`에 반응형 grid, `dot-pop` transition, reduced-motion 대체를 추가합니다. 동적 숫자·상태는 텍스트 노드로 계속 유지합니다.
4. **단위 테스트 통과:** 위 선택 테스트가 통과하고 기존 `RedistributionPanel.test.tsx`의 이동·되돌리기·알림 계약이 그대로 통과합니다.
5. **브라우저 통합 테스트:** `tests/e2e/education-redesign.spec.ts`에서 재배분 화면 진입 후 초기 20개를 확인하고, 4번에서 1번으로 이동했을 때 DOM 동그라미 수가 `[3, 4, 6, 7]`로 바뀌며 전체 20개를 보존하는지 확인합니다. `naturalWidth=1896`, 이미지 장식 속성, 375px 가로 overflow 0, 키보드 이동, reduced-motion 정적 상태를 함께 검증합니다.
6. **합격 기준:** `npm run check`, 전체 Chromium E2E, `git diff --check`, placeholder 검색이 모두 exit 0이고, 320/375/768/1280px에서 동그라미가 바구니 밖으로 겹치지 않습니다. 초점 가능한 컨트롤·수량 텍스트·`LiveRegion`은 기존 접근성 계약을 유지하고, 실제 수량은 생성 이미지에 들어가지 않습니다.

**Rollback**

`BalanceIllustration.tsx`에서 `QuantityDots` import와 슬롯을 제거하고 `illustrations.css`의 `.balance-dot-grid`, `.balance-dot-basket`, `.quantity-dot` 규칙을 삭제하면 기존 빈 트레이 underlay와 텍스트 오버레이로 되돌아갑니다. `currentValues`·리듀서·도메인 계산은 롤백 대상이 아닙니다.

**Implementation record**

2026-08-30 승인 후 구현을 완료했습니다. 사실·정체성 이미지 생성이 필요하지 않아 새 raster 자산을 만들지 않고, 기존 로컬 장식 PNG와 DOM 원형 요소를 조합했습니다. 실패 테스트에서 컴포넌트 부재·동그라미 0개를 확인한 뒤 최소 구현을 적용했으며, 선택 Vitest 10개·전체 Vitest 260개·전체 Chromium 29개·모바일 캡처·reduced-motion 확인을 통과했습니다. 실제 날짜와 변경 요약은 `src/content/updateHistory.ts`에 기록했습니다. 커밋·push·배포는 사용자 별도 승인 전까지 실행하지 않습니다.

## Future commands and expected results

구현 중 사용할 명령과 기대 결과는 다음과 같습니다. 계획 저장 단계에는 실행하지 않습니다.

```bash
npm ci
npm run typecheck
npm test -- --run src/components/shared/SectionIntro.test.tsx
npm test -- --run src/components/start/StartScreen.test.tsx src/components/layout/ProgressRail.test.tsx
npm run build
PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx playwright test --project=chromium
```

- `npm ci`: lockfile과 동일한 의존성 설치가 exit 0입니다.
- 각 선택 테스트: 실패 테스트를 먼저 확인한 뒤 최소 구현 후 exit 0입니다.
- `npm run build`: TypeScript build와 Vite 정적 번들이 exit 0이고 `dist/index.html`과 hashed asset이 생성됩니다.
- Playwright: learner flow, history restore, accessibility, responsive/motion, education redesign spec이 모두 통과하고 외부 요청 배열이 비어 있습니다.

## Future commit steps

커밋은 구현·검증이 모두 끝난 뒤 사용자가 별도로 승인한 경우에만 실행합니다. 계획 단계에서는 실행하지 않습니다.

1. `git status --short --branch`로 기존 변경을 확인하고, 의도하지 않은 파일이 있으면 보존합니다.
2. `git add work/education-webapp-redesign-plan.md work/education-webapp-redesign-audit.md work/education-webapp-redesign-assets.md design-system/MASTER.md src tests README.md docs`로 계획·문서·소스·검증 변경만 stage합니다.
3. `git diff --cached --check`와 파일 줄 수·자리표시자 검색이 통과하면 `git commit -m "feat: redesign mean balance learner experience"`를 실행합니다.
4. 커밋 뒤에는 `git log -1 --oneline`과 `git status --short --branch`를 확인합니다. push·Pages 배포·HVC 동기화는 별도 사용자 승인 없이는 실행하지 않습니다.

## Self-review checklist

- [ ] 학습 목표 다섯 항목(평균 의미, 계산, 같은 평균의 분포, 한 값 변화, 대표값 한계)이 Task 1·4·5와 테스트에 연결되었습니다.
- [ ] 기존 앱과의 차별성(고정 가상 자료, 버튼 재배분, 근거 문장, 익명 결과)과 제외 범위가 Global Constraints와 E2E에 연결되었습니다.
- [ ] 접근성, 모바일, 키보드, 큰 글자, `gi-pulse`, reduced motion, 업데이트 내역이 각각 별도 구현·검증 단계입니다.
- [ ] 개인정보·안전 문구·로컬 저장 경계를 바꾸지 않는 파일 경계가 명시되었습니다.
- [ ] 모든 작업에 정확한 경로, 타입·인터페이스, 실패 테스트, 최소 구현, 통과 명령, 합격 조건이 있습니다.
- [ ] 계획·감사·자산·디자인 시스템·최종 보고서의 경로가 명확하고 자리표시자 표현을 사용하지 않았습니다.
- [ ] 단일 소스 파일 500줄 미만과 실제 결과 기록 단계가 포함되었습니다.
- [ ] VoiceOver와 실제 보조공학 사용자 승인을 범위 밖으로 명시했으며, 이를 완료 증거로 과장하지 않습니다.
- [x] Task 12 이미지 중심 보강은 생성 자산 안전 검토, DOM 데이터 소유, HashRouter same-page 이동, 320/375px·reduced-motion·27개 Chromium 검증과 문서 기록을 완료했으며 `759685a` 커밋·push·Pages 배포(run `33296397026`)까지 마쳤습니다.
- [x] Task 13 현재 수량 원형 요소 시뮬레이션은 `QuantityDotsProps` 계약, `[2,4,6,8] → [3,4,6,7]` 실시간 갱신, 전체 20개 보존, 320/375px 트레이 정렬, reduced-motion 정적 상태, Vitest 260개·Chromium 29개 검증과 문서 기록을 완료했습니다. 현재 변경은 작업 트리에만 있으며 커밋·push·배포는 실행하지 않았습니다.
