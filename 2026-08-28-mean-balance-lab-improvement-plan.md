# Mean Balance Lab Improvement Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax. 구현 에이전트는 각 작업의 실패 테스트 → 최소 구현 → 통과 테스트 순서를 지킵니다.

**Goal:** 초등학생이 평균 균형 조정실의 네 미션을 쉽게 이해하고, 현재 단계를 잃지 않으며, 모바일·키보드 환경에서도 계산 근거를 안전하게 완성하도록 기존 MVP의 문장·초점·진행 표시·입력 피드백·모바일 요약을 개선합니다.

**Architecture:** 기존 Vite + React + TypeScript 정적 SPA와 순수 도메인 계산 규칙을 유지합니다. 학습자 제목과 단계 이름은 콘텐츠 모듈에서 관리하고, 화면 전환 초점과 resume/restart 안내는 작은 훅·컴포넌트로 분리합니다. 버튼 기반 미션 흐름, 근거 중심 결과, 브라우저 로컬 저장 경계를 변경하지 않습니다.

**Tech Stack:** Vite, React 19, TypeScript strict mode, React Router DOM HashRouter, CSS, Vitest, React Testing Library, @testing-library/user-event, Playwright, @axe-core/playwright, npm lockfile

**Spec:** /Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/2026-08-26-mean-balance-lab-design.md 및 현재 MVP의 초등학생 관점 브라우저 검토 결과

## Baseline Findings and Scope

| 관찰 | 개선 결과 | 검증 증거 |
|---|---|---|
| 단계 이동 뒤 초점이 body에 남음 | 새 단계의 main 영역으로 초점 이동 | 훅 단위 테스트와 키보드 E2E |
| 계산 기록에 자료 A/B 구분이 없음 | 계산식 앞에 대상 라벨 표시 | ArtifactTrail.test.tsx |
| 현재·완료·예정 진행 단계가 시각적으로 같음 | 색에 의존하지 않는 상태 배지·테두리·굵기 | ProgressRail.test.tsx, axe |
| 결과 잠금 문구가 한 미션만 요구하는 것처럼 보임 | 남은 필수 미션 이름을 동적으로 안내 | ResultScreen.test.tsx |
| 빈 계산 입력이 합계 오답으로 안내되고 정수 제약이 없음 | 빈칸별 안내, required, step=1, aria-invalid, 설명 연결 | CalculationCheck.test.tsx, E2E |
| 숫자 뒤 조사가 어색하고 4·4 / 0·6 표시가 암호 같음 | 조사 없는 문장과 자료별 이름이 있는 요약 | evaluation.test.ts, ComparisonPanel.test.tsx |
| 교사용 표가 375px에서 672px로 넓어짐 | 모바일 카드 목록, 데스크톱·인쇄용 표 유지 | TeacherSummary.test.tsx, responsive E2E |
| 대표값 심의·교육용 이산 모형·퍼짐이 어려움 | 학습자 제목과 쉬운 설명·흩어진 정도 표현 | 콘텐츠 테스트와 learner-flow E2E |
| 처음으로에서 새 미션이 진행 중 자료를 조용히 덮음 | 이어서 하기와 명시적 재시작 확인 | StartScreen.test.tsx, history E2E |
| 기본 Playwright 실행이 다른 앱의 4173 서버를 재사용할 수 있음 | 로컬 4174, CI 4173, 재사용은 명시적 환경 변수 | Playwright 실행 결과 |

VoiceOver는 이번 검증 범위에서 제외합니다. 키보드 초점, DOM 이름, aria-live, axe 검사는 수행하지만 VoiceOver 결과를 사람 사용성 승인으로 보고하지 않습니다.

## Learning and Safety Traceability

| 설계 요구 | 개선 작업 |
|---|---|
| 전체 양 보존 → 재배분 → 합계 ÷ 개수 → 비교 → 대표값 한계 | 진행 표시와 단계 초점으로 순서를 잃지 않게 하며 reducer 게이트는 보존 |
| 평균을 합계와 자료 개수로 해석 | 계산 입력의 빈칸·정수·ARIA 안내와 대상 라벨 |
| 평균이 같아도 분포가 다름 | 자료 A/B 평균·범위 풀어 쓰기와 쉬운 점도표 설명 |
| 한 값 변화가 평균에 미치는 영향 | 합계 먼저, 평균 다음의 기존 패널과 근거 문장 보존 |
| 평균의 유용성과 한계 | 어린이 제목을 노출하되 범위·각 값 근거 선택은 유지 |
| 기존 앱과의 차별성 | 그래프 제작, 설문, 실제 학급 자료, 순위, 개인정보, 외부 API를 추가하지 않음 |
| 접근성·모바일·모션 감소 | main 초점, 비색 상태, 계산 ARIA, 모바일 카드, gi-pulse와 reduced motion 보존 |
| 개인정보·안전 | 가상 자료와 결과 안전 문구, 로컬 저장 경계 유지 |
| 완료 기준 | 버튼·키보드 완주, 새로 고침 transient feedback 제거, 375px 무가로스크롤, 근거 우선 결과를 회귀 테스트 |

## Global Constraints

- 대상은 초등 5~6학년이며 학습자 문장은 짧고 쉬운 존댓말 한국어입니다.
- 미션 순서는 상황 확인 → 평균 예측 → 재배분 또는 계산 → 비교 → 근거 설명 → 미션 결과입니다.
- 평균은 sum(values) / values.length의 내부값과 표시값을 분리하지 않습니다.
- 네 미션·여덟 고정 자료·자연수 평균·버튼 조작·읽기 전용 점도표 범위를 유지합니다.
- 드래그·실제 학급 자료·이름·학번·성적·신체 자료·학생 순위·자유 서술 자동 채점·서버·로그인·광고·분석 추적기·외부 AI API를 추가하지 않습니다.
- 오답은 틀렸습니다 단독 문구가 아니라 다음 확인 행동을 함께 보여 줍니다.
- 상자는 색 외에 무늬·번호·텍스트로 구분합니다.
- 현재 단계 핵심 버튼 하나에만 gi-pulse를 적용하고 reduced motion에서는 4px 테두리와 보이는 다음 행동 문구를 사용합니다.
- 모든 터치 대상은 최소 44×44px, 본문 명암비는 4.5:1 이상입니다.
- 기본 sessionStorage와 명시적 localStorage 선택 저장, 기기 밖 공유 금지, 네트워크 부재를 유지합니다.
- 결과의 두 안전 문구를 유지합니다. 이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다. 평균 하나가 공정성이나 개인의 가치를 결정하지 않습니다.
- 모든 TS, TSX, CSS 파일은 500줄 미만이며 450줄에 도달한 파일에는 새 책임을 넣지 않습니다.
- 오른쪽 아래 업데이트 내역 버튼과 대화상자의 기존 키보드 동작을 유지하고 2026-08-28 개선 내역을 추가합니다.
- Chromium, 키보드, DOM 접근성, axe, 375px, 큰 글자, reduced motion을 자동 검증하고 VoiceOver는 실행하지 않습니다.
- 이 문서의 명령은 구현·검증·커밋 시점에 실행하며 계획 저장 단계에서는 실행하지 않습니다.

## Expected File Structure and Responsibilities

~~~text
mean-balance-lab/
├── 2026-08-28-mean-balance-lab-improvement-plan.md
├── README.md
├── playwright.config.ts
├── src/content/stages.ts                         # 단계 label
├── src/hooks/useStageFocus.ts                    # stage 변경 후 main 초점
├── src/components/start/StartScreen.tsx          # resume/restart 선택
├── src/components/layout/ProgressRail.tsx        # 상태별 진행 표시
├── src/components/layout/ArtifactTrail.tsx       # 대상 라벨 계산 기록
├── src/components/mission/MissionScreen.tsx      # 단계 초점 연결
├── src/components/mission/CalculationCheck.tsx   # 빈칸·정수·ARIA 피드백
├── src/components/mission/ComparisonPanel.tsx    # 자료별 요약
├── src/components/result/ResultScreen.tsx        # 남은 미션 잠금 안내
├── src/components/result/TeacherSummary.tsx      # 모바일 카드와 인쇄 표
├── src/styles/components.css
├── src/styles/global.css
├── src/components/layout/ProgressRail.test.tsx
├── src/components/start/StartScreen.test.tsx
├── src/hooks/useStageFocus.test.tsx
├── src/components/result/TeacherSummary.test.tsx
├── tests/e2e/stage-focus-and-copy.spec.ts
└── docs/qa/mvp-checklist.md
~~~

## Shared Interfaces

~~~ts
// src/domain/types.ts
export interface MissionDefinition {
  id: MissionId;
  title: string;              // 교사용·저장 기록 제목
  learnerTitle: string;       // 학습자 화면 제목
  learningGoal: string;
  requiredDatasetId: DatasetId;
  datasets: readonly MissionDataset[];
}

// src/content/stages.ts
export const STAGE_LABELS: Readonly<Record<LearningStage, string>>;
export const stageLabel: (stage: LearningStage) => string;

// src/hooks/useStageFocus.ts
export const useStageFocus: (focusKey: string) => void;

// src/components/result/ResultScreen.tsx
export const getIncompleteRequiredMissionTitles: (state: LabSessionState) => readonly string[];
export const resultLockCopy: (remainingTitles: readonly string[]) => string;
~~~

useStageFocus는 focusKey가 바뀔 때 main-content를 찾아 preventScroll 옵션으로 focus합니다. 대상이 없으면 조용히 종료하고, AppShell의 main-content는 tabIndex=-1을 유지합니다.

## Task 1: Learner-friendly content and shared stage labels

**Files:**
- Create: src/content/stages.ts
- Modify: src/domain/types.ts:81-87
- Modify: src/content/missions.ts:9-94
- Modify: src/components/start/StartScreen.tsx:30-70
- Modify: src/components/layout/ProgressRail.tsx:1-31
- Modify: src/components/mission/MissionSummary.tsx:50-93
- Modify: src/components/mission/SituationPanel.tsx:19-27
- Test: src/content/missions.test.ts
- Test: src/components/start/StartScreen.test.tsx

**Interfaces:** Consumes MissionDefinition, LearningStage, MISSIONS, getDataset. Produces learnerTitle, STAGE_LABELS, stageLabel.

- [ ] Step 1: Write the failing test

~~~tsx
it('exposes learner title and shared stage label', () => {
  expect(MISSIONS.find((mission) => mission.id === 'representative-review')?.learnerTitle)
    .toBe('4. 평균만으로 괜찮을까요?');
  expect(stageLabel('mission-result')).toBe('미션 결과');
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/content/missions.test.ts src/components/start/StartScreen.test.tsx

Expected: FAIL because learnerTitle, stages.ts, and the new start test are absent.

- [ ] Step 3: Write minimal implementation

~~~ts
import type { LearningStage } from '../domain/types';

export const STAGE_LABELS: Readonly<Record<LearningStage, string>> = {
  situation: '상황', predict: '예측', redistribute: '재배분', calculate: '계산',
  compare: '비교', explain: '설명', 'mission-result': '미션 결과',
};
export const stageLabel = (stage: LearningStage): string => STAGE_LABELS[stage];
~~~

Add learnerTitle values 1. 골고루 나누기, 2. 평균이 같아도 다를까요?, 3. 한 값이 바뀌면?, 4. 평균만으로 괜찮을까요?. Use learnerTitle in learner-facing headings and retain title for TeacherSummary. Change mission contexts to plain Korean and add 실제 자료가 아닌 수학 연습용 가상 자료예요. in SituationPanel.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/content/missions.test.ts src/components/start/StartScreen.test.tsx

Expected: PASS with one shared stage-label source and learner titles.

- [ ] Step 5: Future commit command

~~~bash
git add src/content/stages.ts src/domain/types.ts src/content/missions.ts src/components/start/StartScreen.tsx src/components/layout/ProgressRail.tsx src/components/mission/MissionSummary.tsx src/components/mission/SituationPanel.tsx src/content/missions.test.ts src/components/start/StartScreen.test.tsx
git commit -m "feat: simplify learner-facing mission copy"
~~~

## Task 2: Route-stage focus and keyboard handoff

**Files:**
- Create: src/hooks/useStageFocus.ts
- Test: src/hooks/useStageFocus.test.tsx
- Modify: src/components/mission/MissionScreen.tsx:1-32
- Modify: src/app/AppShell.tsx:19-28
- Test: tests/e2e/stage-focus-and-copy.spec.ts

**Interfaces:** Consumes MissionScreen stage key and AppShell main-content. Produces useStageFocus(focusKey: string): void.

- [ ] Step 1: Write the failing test

~~~tsx
it('focuses main after the focus key changes', () => {
  const { rerender } = render(<FocusProbe focusKey="situation" />);
  const main = document.getElementById('main-content')!;
  expect(main).not.toHaveFocus();
  rerender(<FocusProbe focusKey="predict" />);
  expect(main).toHaveFocus();
});
~~~

The browser test starts balance-20-a, clicks 다음: 평균 예측, and asserts that main-content is focused before the next action.

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/hooks/useStageFocus.test.tsx

Expected: FAIL because the hook and probe are absent.

- [ ] Step 3: Write minimal implementation

~~~ts
import { useEffect } from 'react';

export const useStageFocus = (focusKey: string): void => {
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main instanceof HTMLElement) main.focus({ preventScroll: true });
  }, [focusKey]);
};
~~~

Call useStageFocus with mission id, dataset id, and stage joined by colons in MissionScreen. Keep the skip link and do not add student-facing narration.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/hooks/useStageFocus.test.tsx src/app/router.learner-handoff.test.tsx

Expected: PASS; the new Chromium spec passes after Task 8 server configuration.

- [ ] Step 5: Future commit command

~~~bash
git add src/hooks/useStageFocus.ts src/hooks/useStageFocus.test.tsx src/components/mission/MissionScreen.tsx src/app/AppShell.tsx tests/e2e/stage-focus-and-copy.spec.ts
git commit -m "feat: move focus to each learning stage"
~~~

## Task 3: Make progress and artifact history explicit

**Files:**
- Modify: src/components/layout/ProgressRail.tsx:1-31
- Modify: src/components/layout/ArtifactTrail.tsx:1-57
- Modify: src/styles/components.css:17-49,88-105
- Test: src/components/layout/ProgressRail.test.tsx
- Modify: src/components/layout/ArtifactTrail.test.tsx

**Interfaces:** Consumes STAGE_LABELS, CalculationArtifact, CalculationTarget. Produces progress items with data-stage-status and target-labelled calculation rows.

- [ ] Step 1: Write the failing test

~~~tsx
it('marks completed and current stages', () => {
  render(<ProgressRail mission={mission} dataset={dataset} currentStage="calculate" />);
  expect(screen.getByRole('listitem', { name: /완료.*상황/ }))
    .toHaveAttribute('data-stage-status', 'completed');
  expect(screen.getByRole('listitem', { name: /현재 단계.*계산/ }))
    .toHaveAttribute('data-stage-status', 'current');
});
it('labels both verified calculations', () => {
  render(<ArtifactTrail artifacts={{ calculations: {
    left: { target: 'left', total: 16, count: 4, average: 4, verified: true },
    right: { target: 'right', total: 16, count: 4, average: 4, verified: true },
  } }} />);
  expect(screen.getByText('자료 A 계산: 16 ÷ 4 = 4')).toBeVisible();
  expect(screen.getByText('자료 B 계산: 16 ÷ 4 = 4')).toBeVisible();
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/components/layout/ProgressRail.test.tsx src/components/layout/ArtifactTrail.test.tsx

Expected: FAIL because state data and target labels do not exist.

- [ ] Step 3: Write minimal implementation

Derive completed/current/upcoming from currentIndex. Render status text 완료, 현재 단계, or 예정; retain aria-current=step only on current. Apply classes progress-step-completed, progress-step-current, progress-step-upcoming. Add CALCULATION_TARGET_LABELS and render the label, calculation, and values. Replace learner-facing 퍼짐 with 흩어진 정도. Add CSS borders, font weight, and non-color markers; leave gi-pulse and reduced-motion rules intact.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/components/layout/ProgressRail.test.tsx src/components/layout/ArtifactTrail.test.tsx

Expected: PASS and npm run typecheck has no new diagnostics.

- [ ] Step 5: Future commit command

~~~bash
git add src/components/layout/ProgressRail.tsx src/components/layout/ProgressRail.test.tsx src/components/layout/ArtifactTrail.tsx src/components/layout/ArtifactTrail.test.tsx src/styles/components.css
git commit -m "feat: clarify progress and saved calculations"
~~~

## Task 4: Improve calculation input validation and feedback

**Files:**
- Modify: src/components/mission/CalculationCheck.tsx:1-147
- Modify: src/content/copy.ts:3-12
- Modify: src/components/mission/CalculationCheck.test.tsx
- Modify: tests/e2e/accessibility.spec.ts
- Modify: tests/e2e/history-and-restore.spec.ts

**Interfaces:** Consumes CalculationTarget, CalculationInput, EvaluationResult, sum, mean. Produces required integer fields with aria-describedby, aria-invalid, and blank-field feedback without fake zero dispatch.

- [ ] Step 1: Write the failing test

~~~tsx
it('asks for the first empty field before dispatching', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<CalculationCheck target="current" values={[2, 4, 6, 8]} onSubmit={onSubmit} feedback={null} />);
  await user.click(screen.getByRole('button', { name: '계산 확인' }));
  expect(screen.getByText('합계를 입력해 주세요.')).toBeVisible();
  expect(screen.getByRole('spinbutton', { name: '합계' })).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('spinbutton', { name: '합계' })).toHaveAttribute('required');
  expect(screen.getByRole('spinbutton', { name: '합계' })).toHaveAttribute('step', '1');
  expect(onSubmit).not.toHaveBeenCalled();
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/components/mission/CalculationCheck.test.tsx

Expected: FAIL because empty strings become zero and the attributes are absent.

- [ ] Step 3: Write minimal implementation

Use noValidate on the controlled form. Before constructing CalculationInput, find the first blank among total, count, mean; set local feedback with the exact message and next action, focus that field, and return without onSubmit. Use messages 합계를 입력해 주세요., 자료 개수를 입력해 주세요., 평균을 입력해 주세요. and next actions 합계를 먼저 채워 보세요., 자료 개수를 먼저 채워 보세요., 평균을 먼저 채워 보세요. Add required, step=1, min=0, stable hint ids, aria-describedby, and aria-invalid to each input. Preserve domain feedback for nonblank mistakes.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/components/mission/CalculationCheck.test.tsx src/domain/evaluation.test.ts

Expected: PASS; wrong nonblank values still focus the first incorrect field and correct values advance.

- [ ] Step 5: Future commit command

~~~bash
git add src/components/mission/CalculationCheck.tsx src/components/mission/CalculationCheck.test.tsx src/content/copy.ts tests/e2e/accessibility.spec.ts tests/e2e/history-and-restore.spec.ts
git commit -m "fix: guide empty average inputs"
~~~

## Task 5: Rewrite comparison summaries and Korean numeric copy

**Files:**
- Modify: src/content/copy.ts:14-97
- Modify: src/components/mission/ComparisonPanel.tsx:94-220
- Modify: src/components/mission/OutlierDeltaPanel.tsx:37-53
- Modify: src/components/mission/EvidenceBuilder.tsx:164-220
- Modify: src/domain/evaluation.test.ts
- Modify: src/components/mission/ComparisonPanel.test.tsx
- Modify: src/app/router.learner-handoff.test.tsx
- Modify: tests/e2e/helpers/learner.ts

**Interfaces:** Consumes the existing copy factories and COMPARISON_COPY. Produces explicit data-labelled summaries without changing evidence IDs or domain values.

- [ ] Step 1: Write the failing test

~~~ts
it('avoids numeric particles in twin evidence', () => {
  expect(buildTwinsEvidenceSentence(4, 0, 6))
    .toBe('두 자료의 평균은 모두 4이고, 범위는 자료 A가 0, 자료 B가 6이라서 달라요.');
});
~~~

~~~tsx
it('shows labelled means and ranges', () => {
  renderTwinsComparison();
  expect(screen.getByText('자료 A 평균 4, 자료 B 평균 4 / 자료 A 범위 0, 자료 B 범위 6')).toBeVisible();
  expect(screen.queryByText('평균 4·4 / 범위 0·6')).not.toBeInTheDocument();
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/domain/evaluation.test.ts src/components/mission/ComparisonPanel.test.tsx

Expected: FAIL because current copy has 4으로, 4과, and the dot-separated summary.

- [ ] Step 3: Write minimal implementation

Build the twin evidence sentence with string concatenation: 두 자료의 평균은 모두 + average + 이고, 범위는 자료 A가 + leftRange + , 자료 B가 + rightRange + 이라서 달라요. Build the twin mean sentence with the existing parameters and no new rounding. Rewrite balance calculation copy as 전체 양은 + total + 이고, 자료 + count + 개로 나누면 평균은 + average + 예요. Render named data A/B means and ranges in ComparisonPanel. Replace learner-facing 퍼짐 with 흩어진 정도. Keep outlier headings in 먼저 합계, 그다음 평균 order.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/domain/evaluation.test.ts src/components/mission/ComparisonPanel.test.tsx src/app/router.learner-handoff.test.tsx

Expected: PASS with canonical evidence and no dot shorthand.

- [ ] Step 5: Future commit command

~~~bash
git add src/content/copy.ts src/components/mission/ComparisonPanel.tsx src/components/mission/OutlierDeltaPanel.tsx src/components/mission/EvidenceBuilder.tsx src/domain/evaluation.test.ts src/components/mission/ComparisonPanel.test.tsx src/app/router.learner-handoff.test.tsx tests/e2e/helpers/learner.ts
git commit -m "fix: make average comparisons readable"
~~~

## Task 6: Make result lock and resume/restart behavior honest

**Files:**
- Modify: src/components/result/ResultScreen.tsx:1-42
- Modify: src/components/start/StartScreen.tsx:1-70
- Modify: src/content/stages.ts
- Test: src/components/result/ResultScreen.test.tsx
- Test: src/components/start/StartScreen.test.tsx
- Modify: tests/e2e/history-and-restore.spec.ts

**Interfaces:** Consumes LabSessionState, MISSIONS, isCanonicalEvidenceRecord, routeFor, stageLabel. Produces getIncompleteRequiredMissionTitles, resultLockCopy, resume route, and explicit restart confirmation.

- [ ] Step 1: Write the failing test

~~~tsx
it('lists every unfinished required mission', () => {
  renderAppAt('#/results');
  expect(screen.getByRole('status')).toHaveTextContent(
    '전체 결과를 보려면 1. 골고루 나누기, 2. 평균이 같아도 다를까요?, 3. 한 값이 바뀌면?, 4. 평균만으로 괜찮을까요? 미션을 끝내야 해요.',
  );
});
it('offers resume and confirms before replacing another run', async () => {
  renderAppAt('#/', sessionWithActiveTwinRun());
  expect(screen.getByRole('button', { name: '이어서 하기' })).toBeVisible();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await userEvent.setup().click(screen.getByRole('button', { name: '미션 시작' }));
  expect(confirm).toHaveBeenCalledWith('현재 진행 중인 자료를 버리고 새 미션을 시작할까요?');
  confirm.mockRestore();
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/components/result/ResultScreen.test.tsx src/components/start/StartScreen.test.tsx

Expected: FAIL because the lock copy is fixed and StartScreen silently dispatches START_DATASET.

- [ ] Step 3: Write minimal implementation

Compute unfinished missions from completedRequiredMissions plus a canonical required attempt, matching the existing completion rule. Return learnerTitle values in registry order and build the sentence from that list. In StartScreen, derive the active mission and dataset, render an aside labelled 진행 중인 미션 with learnerTitle, dataset label, stageLabel, and 이어서 하기. Resume navigates to the active stage without dispatching. Starting a different dataset asks exactly 현재 진행 중인 자료를 버리고 새 미션을 시작할까요?; cancel leaves state and hash unchanged. Starting the same dataset resumes it instead of resetting.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/components/result/ResultScreen.test.tsx src/components/start/StartScreen.test.tsx src/app/router.route-guards.test.tsx

Expected: PASS and canonical result completion remains unchanged.

- [ ] Step 5: Future commit command

~~~bash
git add src/components/result/ResultScreen.tsx src/components/result/ResultScreen.test.tsx src/components/start/StartScreen.tsx src/components/start/StartScreen.test.tsx src/content/stages.ts tests/e2e/history-and-restore.spec.ts
git commit -m "fix: protect learner progress when resuming"
~~~

## Task 7: Remove mobile teacher-summary horizontal scrolling

**Files:**
- Modify: src/components/result/TeacherSummary.tsx:27-52
- Modify: src/styles/components.css:88-105
- Modify: src/styles/global.css:111-143
- Modify: src/components/result/TeacherSummary.test.tsx
- Modify: tests/e2e/responsive-motion.spec.ts

**Interfaces:** Consumes TeacherSummaryRow, levelDescription, getDataset. Produces teacher-summary-mobile cards at max-width 640px and the existing table for desktop and print.

- [ ] Step 1: Write the failing test

~~~tsx
it('renders mobile cards and retains the labelled table', () => {
  render(<TeacherSummary attempts={completedSession().attempts} />);
  expect(screen.getByRole('list', { name: '모바일 교사용 요약' })).toBeInTheDocument();
  expect(screen.getByRole('table')).toBeInTheDocument();
});
~~~

Responsive E2E visits results at 375px and asserts html scrollWidth equals clientWidth and mobile cards are visible.

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/components/result/TeacherSummary.test.tsx

Expected: FAIL because only the 42rem minimum-width table exists.

- [ ] Step 3: Write minimal implementation

Render a ul with class teacher-summary-mobile and aria-label 모바일 교사용 요약. Create one li card per row with 미션, 자료, 선택한 근거, 근거 단계 설명, 수정 기록. Hide the list by default; at max-width 640px hide the table region and show the list with wrapping values. Keep the table for desktop and print, hide the mobile list in print, and preserve min-width 0 in print.

- [ ] Step 4: Run test to verify it passes

Run: npm test -- --run src/components/result/TeacherSummary.test.tsx
Run: npx playwright test tests/e2e/responsive-motion.spec.ts --project=chromium

Expected: PASS at 375px, 1440px, and print media without horizontal overflow.

- [ ] Step 5: Future commit command

~~~bash
git add src/components/result/TeacherSummary.tsx src/components/result/TeacherSummary.test.tsx src/styles/components.css src/styles/global.css tests/e2e/responsive-motion.spec.ts
git commit -m "fix: make teacher summary mobile friendly"
~~~

## Task 8: Harden Playwright server isolation and extend learner-flow checks

**Files:**
- Modify: playwright.config.ts:1-13
- Create: tests/e2e/stage-focus-and-copy.spec.ts
- Modify: tests/e2e/learner-flow.spec.ts
- Modify: tests/e2e/helpers/learner.ts
- Modify: README.md:45-91
- Modify: docs/qa/mvp-checklist.md

**Interfaces:** Consumes Playwright baseURL, webServer, and learner helpers. Produces deterministic server selection with PLAYWRIGHT_PORT and PLAYWRIGHT_REUSE_SERVER.

- [ ] Step 1: Write the failing configuration check

Run the new page-flow spec while an unrelated server occupies 4173:

Run: npm run test:e2e -- --project=chromium tests/e2e/stage-focus-and-copy.spec.ts

Expected before the fix: the spec can see the wrong document or fail Mean Balance selectors when an unrelated server is reused. Treat this as configuration evidence and do not terminate that server.

- [ ] Step 2: Run test to verify it fails

Record the wrong-title or missing-selector failure, stop using that reused server, and draw no product conclusion from it.

- [ ] Step 3: Write minimal implementation

~~~ts
const port = Number(process.env.PLAYWRIGHT_PORT ?? (process.env.CI ? 4173 : 4174));
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? ['http://127.0.0.1:', port].join('');

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: ['npm run dev -- --host 127.0.0.1 --port ', port].join(''),
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
  },
});
~~~

Extend helper assertions for named twin summaries, target-labelled artifacts, resume warning, mobile cards, one gi-pulse action, reduced-motion replacement text, no external requests, no draggable controls, and exact safety copy. Keep keyboard-only flow.

- [ ] Step 4: Run test to verify it passes

Run: PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium

Expected: all Chromium learner, history, accessibility, responsive, and new stage-focus/copy specs pass against this project even when 4173 is occupied.

- [ ] Step 5: Future commit command

~~~bash
git add playwright.config.ts tests/e2e/stage-focus-and-copy.spec.ts tests/e2e/learner-flow.spec.ts tests/e2e/helpers/learner.ts README.md docs/qa/mvp-checklist.md
git commit -m "test: isolate learner browser verification"
~~~

## Task 9: Record the improvement and run the complete verification gate

**Files:**
- Modify: src/content/updateHistory.ts:7-11
- Modify: src/components/update/UpdateHistoryDialog.test.tsx:15-40
- Modify: README.md
- Modify: docs/qa/mvp-checklist.md

**Interfaces:** Consumes UPDATE_HISTORY and the existing update-dialog focus contract. Produces a dated 2026-08-28 improvement entry and documented verification.

- [ ] Step 1: Write the failing test

~~~ts
it('records the 2026-08-28 improvement', () => {
  expect(UPDATE_HISTORY[0]).toEqual({
    date: '2026-08-28',
    category: '개선',
    summary: '학습 단계 안내와 입력·모바일 화면 개선',
  });
});
~~~

- [ ] Step 2: Run test to verify it fails

Run: npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx

Expected: FAIL because the first entry is currently the 2026-08-27 deployment record.

- [ ] Step 3: Write minimal implementation

Prepend the exact 2026-08-28 improvement entry. Update README and docs/qa/mvp-checklist.md with the copy, focus, mobile-card, safe-port changes and the explicit VoiceOver exclusion. Keep update-history button availability and Escape/focus restoration.

- [ ] Step 4: Run the complete verification gate

Run in order:

~~~bash
npm run typecheck
npm test -- --run
npm run build
PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npm run test:e2e -- --project=chromium
git diff --check
git status --short
find src -type f -name '*.ts' -o -name '*.tsx' -o -name '*.css' | xargs wc -l | sort -n | tail -5
rg -n "placeholder|FIXME|XXX" 2026-08-28-mean-balance-lab-improvement-plan.md src tests README.md docs
~~~

Expected: typecheck, all Vitest tests, build, and full Chromium suite exit 0; no whitespace errors; only intended files are modified; every source file is below 500 lines; placeholder scan returns no matches.

- [ ] Step 5: Future commit command

~~~bash
git add src README.md docs/qa/mvp-checklist.md playwright.config.ts tests/e2e
git commit -m "fix: improve mean balance learner experience"
~~~

The current implementation turn stops after local verification. This commit is not run unless the user explicitly requests a commit.

## Future Release Commands and Expected Results

These commands are documented for a later user-authorized release and are not run during this turn:

~~~bash
git status --short --branch
git log -1 --oneline
git push origin main
gh run list --workflow deploy-pages.yml --limit 5
gh run watch successful-run-id --exit-status
~~~

Expected later evidence is a clean pushed main, a successful Pages workflow, and a separately checked public learner path at https://wbmaker2.github.io/mean-balance-lab/. No push, deployment, HVC registration, or gallery synchronization is performed in this implementation turn.

## Self-Review Checklist

- [ ] 설계의 학습 목표·핵심 질문이 Task 1·4·5·6에 연결되었습니다.
- [ ] 재배분·계산·쌍둥이 자료·극단값·대표값 한계의 순서를 바꾸지 않습니다.
- [ ] 차별성·MVP 제외 항목이 Global Constraints와 Task 8 문서 검증에 있습니다.
- [ ] 접근성·모바일·키보드·gi-pulse·reduced motion·업데이트 내역이 별도 작업입니다.
- [ ] 개인정보·안전 문구와 저장 범위를 변경하지 않습니다.
- [ ] 각 단계에 정확한 경로, 타입·함수 이름, 실패 테스트, 최소 구현, 통과 명령, 합격 조건이 있습니다.
- [ ] 단일 소스 500줄 미만 검사와 자리표시자 검색이 마지막 게이트에 있습니다.
- [ ] VoiceOver는 범위에서 제외되고 사람 승인으로 과장되지 않습니다.
- [ ] 계획과 구현에 미완성 자리표시자나 모호한 작업 지시가 없습니다.
