# Mean Balance Lab Implementation Plan

## Goal

이번 작업의 범위는 최근 추가된 두 기능에 한정합니다.

1. **단어·문장 표현 검사**: 초등학교 5~6학년 학습자가 시작 화면과 네 가지 미션의 상황·예측·재배분·계산·비교·근거 화면에서 문장을 한 번 읽고 다음 행동을 알아차리도록 표현을 고칩니다. 평균, 합계, 자료 개수, 범위, 흩어진 정도, 공정성, 가상 모형이라는 학습·안전 의미는 보존하고, 첫 사용 시 낯선 말은 짧은 풀이를 붙입니다.
2. **시뮬레이션 검사**: 균형 배송 미션의 바구니 점 시각화가 DOM의 현재 수량과 항상 같은 값을 보여 주는지 검증하고, 한 번의 조작에서 한 변수(선택한 출발 상자에서 도착 상자로 구슬 1개 이동)만 바뀌며 전체 합 20이 보존되는지 확인합니다. 학습자가 틀린 선택에서 회복하고 처음 상태로 다시 비교할 수 있도록 명시적인 `처음 상태로 되돌리기` 동작을 추가합니다.

이번 범위에서 다루지 않는 항목은 전체 레이아웃 재설계, 새 이미지 생성, 도메인 문제 수·정답·라우팅 변경, 로그인·서버·분석·외부 AI, VoiceOver/TTS/녹음, HVC 등록, 커밋·푸시·배포입니다.

## Baseline evidence

- Stage 0 preflight: `work/elementary-webapp-ux-bootstrap-text-simulation.md`에 기록된 결과를 사용합니다. `playwright`와 `design-system` 런타임은 사용 가능하고, 전문 시뮬레이션 런타임은 필요하지 않습니다.
- 텍스트 후보 수집: `work/elementary-webapp-ux-language-candidates.md`는 `src`의 후보를 모은 참고 목록입니다. 자동 목록을 등급 판정으로 사용하지 않고 아래 수동 원장으로 확정합니다.
- 브라우저 기준 시나리오: 360px 폭에서 기본 자료를 시작하고 `상황 → 예측(평균 5) → 재배분`으로 진입했습니다. 첫 화면 제목은 한 줄에 담기 어려운 추상 질문이고, 미션 문맥은 `고르게 나눕니다`, 시작 목표는 `설명합니다/연결합니다/구별합니다/판단합니다`로 끝났습니다. 재배분에서는 `[2,4,6,8]`의 점 20개가 `[3,4,6,7]` 이동 뒤에도 점 20개와 동일한 수량 속성을 유지했고, 네 번 이동해 `[5,5,5,5]`가 되면 `data-balanced="true"`가 되었습니다. 네 번의 `마지막 이동 취소`로 초기 `[2,4,6,8]`로 복원되지만, 학습자에게 초기화라는 의도가 직접 보이지 않습니다.

## Architecture

현재 React/Vite 구조와 DOM 중심 수학 모델을 유지합니다.

- 콘텐츠 표현은 `src/content/copy.ts`와 `src/content/missions.ts`의 상수에서만 바꿉니다. 숫자·평균 계산은 `src/domain/math.ts`와 `src/domain/session.ts`가 계속 소유합니다.
- 균형 시뮬레이션은 `RedistributionPanel → BalanceIllustration → QuantityDots` 흐름을 유지합니다. `currentValues`가 유일한 수량 원천이며 `data-current-values`, 각 `data-dot-count`, 실제 `.quantity-dot` 개수가 모두 같은 배열에서 렌더링됩니다.
- 초기화는 세션 전체를 지우는 `RESET_ACTIVE_DATASET`과 구분되는 `RESET_REDISTRIBUTION` 액션으로 설계합니다. 현재 미션·예측·단계·다른 산출물은 유지하고, 현재 재배분의 `currentValues`를 `initialValues`로 되돌리며 `undoStack`과 `confirmed`를 비웁니다.
- 접근성 트리에는 장식 점을 노출하지 않고(`aria-hidden="true"`), 이미 존재하는 수량 텍스트와 `LiveRegion`으로 같은 정보를 전달합니다. 초기화·이동·오류 메시지는 짧은 다음 행동을 포함합니다.

## Tech Stack

- React 18 + TypeScript + Vite
- 기존 `vitest`/Testing Library 단위·컴포넌트 테스트
- 기존 Playwright MCP 브라우저 검증(공개 배포가 아니라 로컬 4201 포트)
- 기존 CSS 토큰과 `prefers-reduced-motion` 규칙
- 새 패키지, Canvas, WebGL, 서버 저장소를 추가하지 않습니다.

## Spec

### Text specification

| Issue ID | 대상 | 현재 표현 | 변경 표현 | 합격 조건 |
| --- | --- | --- | --- | --- |
| EDU-LANG-001 | `src/components/start/StartScreen.tsx` 제목 | `평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?` | `평균은 여러 값을 어떻게 나타내고, 값 하나가 달라지면 평균은 어떻게 달라질까요?` | 360px에서 제목이 화면 밖으로 넘치지 않고, `나타내다`의 의미가 평균 학습 목표와 충돌하지 않음 |
| EDU-LANG-002 | `src/components/start/StartScreen.tsx` 목표 목록 | `설명합니다/연결합니다/구별합니다/판단합니다` | `설명해 봐요/연결해 봐요/구분해 봐요/판단해 봐요` | 네 항목이 같은 `-해 봐요` 말투이고 평균·합계·개수·자료 모양·근거 의미 유지 |
| EDU-LANG-003 | `src/components/start/StartScreen.tsx` 자료 선택 | `자료 난이도`, `기본(A 세트)`, `도전(B 세트)` | `자료 선택`, `기본 자료`, `도전 자료` | 라디오 그룹의 접근성 이름과 보이는 레이블이 학습자용이며 A/B 내부 코드는 UI에 노출되지 않음 |
| EDU-LANG-004 | `src/content/missions.ts` 미션 문맥 | `고르게 나눕니다/비교합니다/살펴봅니다` | `고르게 나눠 봐요/비교해 봐요/살펴봐요` | 네 미션·두 데이터 세트의 문맥이 존댓말 `-해요`로 통일되고 숫자·도메인 대상은 그대로임 |
| EDU-LANG-005 | `src/components/mission/SituationPanel.tsx` 안전 설명 | `교육용 이산 모형입니다` | `실제 물건을 재는 것이 아니라, 수를 세어 보는 교육용 가상 모형이에요.` | 실제 자료가 아니라는 경계, 세는 정수 자료라는 모델 의미, 안전 안내가 모두 남고 초등학생이 이해 가능 |
| EDU-LANG-006 | `src/components/mission/PredictionPanel.tsx` 오답/힌트 | 긴 두 문장 | `바뀐 값이 커졌는지 작아졌는지 다시 살펴봐요. 합계와 평균의 숫자는 계산 단계에서 확인해요.` | 선택 후 한 번에 읽히며 다음 단계에서 수치를 확인한다는 안내 유지 |
| EDU-LANG-007 | 미션 상황·비교·근거 컴포넌트 | `고정된 문장`, 성인 중심의 `대표값` 설명 | `살펴본 근거`, `평균과 자료의 모습` 등 | 학생이 해야 할 행동이 동사로 시작하고 내부 구현 용어가 보이지 않음. `평균`, `범위`, `각 값`, `흩어진 정도` 같은 교과어는 유지 |

텍스트 원장 `work/elementary-webapp-ux-language-audit.md`에 각 변경을 위 Issue ID와 함께 기록합니다. 각 행에는 화면/상태, 표면, 파일·라인 근거, 목표 학년, 변경 전·후, 어려운 신호, 학습 의도 보존, 교과 사실 보존, 이해 확인 질문, 시각 가독성 확인, 검증 상태, 완료 상태를 적습니다. 안전 문구는 원장에 학생 이해 질문과 모델 경계 확인을 남기고 표현 변경 후에도 같은 경계를 다시 확인합니다.

### Simulation specification

| 항목 | 결정 |
| --- | --- |
| 기회 판정 | `implement`: 최근 추가된 실시간 바구니 점 시뮬레이션을 핵심 학습 흐름으로 검증·보강합니다. |
| 모델 | 균형 배송 자료 `[2,4,6,8]` 또는 `[1,5,7,11]`의 각 상자 수. 한 조작은 출발 상자 1개 감소와 도착 상자 1개 증가입니다. |
| 학습 변수 | 한 번에 하나의 이동(`fromIndex`, `toIndex`)만 바꿉니다. 합계는 도메인에서 보존 검증합니다. |
| 관찰 | 현재 수량 텍스트, `data-current-values`, 바구니별 `data-dot-count`, `.quantity-dot` 총 개수, 균형 상태, LiveRegion 문장을 함께 확인합니다. |
| 설명 | `전체 양 20개`, `평균 20 ÷ 4`, 초기 수량·현재 수량 오버레이로 보존·변화를 연결합니다. |
| 비교/리셋 | `처음 상태로 되돌리기`는 재배분만 초기화하고, 초기 점 20개와 `[2,4,6,8]`을 즉시 복원합니다. `마지막 이동 취소`는 직전 한 단계만 취소합니다. |
| pause/step | `N/A`: 자동 재생·시간 경과·연속 프레임이 없는 클릭 기반 모델이므로 일시정지/한 프레임 진행은 학습에 이득이 없습니다. |
| 접근성 | 모든 조작은 네이티브 버튼으로 키보드·터치 가능, 점은 장식으로 숨김, 현재 수량과 상태는 텍스트·`role="status"`로 전달합니다. 초기화 버튼에도 44px 이상 터치 영역을 유지합니다. |
| 모션 | 새 모션을 추가하지 않습니다. 기존 점 `quantity-dot-pop`은 `@media (prefers-reduced-motion: reduce)`에서 정지하고, 기존 `gi-pulse` CTA의 정적 윤곽 대체를 유지합니다. |
| 성능 | 최대 데이터 값 11, 최대 점 24개를 DOM으로 렌더링하며 320px·375px·1280px에서 가로 오버플로가 없어야 합니다. |

시뮬레이션 원장 `work/elementary-webapp-ux-simulation-decision.md`에 위 결정을 기록하고, `work/elementary-webapp-ux-simulation-test.md`에 예측→한 변수 이동→관찰→설명→리셋/비교→전이·전이 후 확인을 기록합니다.

## Global Constraints

- 한 소스 파일은 500줄 미만으로 유지합니다. 이번 변경은 기존 파일의 문자열·액션·작은 핸들러만 수정하며 파일을 비대하게 만들지 않습니다.
- 학습 계산·정답·미션 순서·저장 모드·개인정보 경계는 변경하지 않습니다. `RESET_REDISTRIBUTION`은 현재 재배분 아티팩트만 되돌립니다.
- 페이지는 라이트 모드만 사용합니다. `prefers-color-scheme: dark`를 추가하지 않습니다.
- 교육 단계의 현재 행동 버튼에는 기존 `gi-pulse` 강조를 유지합니다. 초기화·취소 같은 보조 버튼에는 펄스를 붙이지 않습니다.
- 업데이트 내역 버튼과 날짜 기록을 유지하고, 실제 코드 변경 시 `src/content/updateHistory.ts`에 `2026-08-30` 개선 항목을 추가합니다.
- VoiceOver/TTS/음성 녹음은 구현·검증하지 않습니다. 키보드, 화면 낭독기 DOM 이름·상태, 터치·모바일 레이아웃만 확인합니다.
- 이미지 생성·교체는 하지 않습니다. 현재 래스터는 장식이고 수량·숫자는 DOM이 소유하므로 시뮬레이션 사실성과 충돌하지 않습니다.
- 계획에 적은 명령은 구현 단계에서 실행할 명령입니다. 이 계획 작성 단계에서는 명령을 실행하지 않습니다.

## Expected file structure and responsibilities

```text
src/
  content/
    copy.ts                         # 학습자 피드백·안전 문장 상수
    missions.ts                     # 미션별 학습자 문맥과 데이터
    updateHistory.ts                # 날짜별 변경 내역
  domain/
    session.ts                      # LabAction, 재배분 초기화 reducer
  components/
    start/StartScreen.tsx           # 시작 질문·목표·자료 선택
    mission/
      SituationPanel.tsx            # 상황·안전 안내
      PredictionPanel.tsx           # 평균 예측·힌트
      RedistributionPanel.tsx       # 한 개 이동·초기화·오류 회복
      BalanceIllustration.tsx       # 초기/현재 DOM 오버레이
      QuantityDots.tsx              # 수량별 장식 점 렌더러
work/
  elementary-webapp-ux-text-simulation-plan.md
  elementary-webapp-ux-language-audit.md
  elementary-webapp-ux-simulation-decision.md
  elementary-webapp-ux-simulation-test.md
  elementary-webapp-ux-text-simulation-report.md
```

## Work items

### 1. Scoped artifacts and baseline ledger

- [x] `work/elementary-webapp-ux-language-audit.md`를 작성하고 EDU-LANG-001~008의 근거·원문·개선문·이해 질문을 채웠습니다.
- [x] `work/elementary-webapp-ux-simulation-decision.md`를 작성하고 DOM 모델, 단일 변수 조작, 합계 보존, 리셋, pause/step N/A, reduced motion, 키보드·터치·모바일 결정을 채웠습니다.
- [x] `work/elementary-webapp-ux-simulation-test.md`에 360px 기준 초기 상태의 점 20개·배열 `[2,4,6,8]`과 재현 결과를 기록했습니다.

### 2. Text TDD: learner wording

**Failing test first**

- [x] `src/components/start/StartScreen.test.tsx`에 새 제목, `자료 선택`, `기본 자료`, `도전 자료`, `-해 봐요` 목표 문장을 요구하는 테스트를 먼저 추가했습니다.
- [x] `src/content/missions.test.ts`에 네 미션 문맥이 `-해요` 문장이고 내부 `A 세트/B 세트`가 보이지 않는다는 테스트를 추가했습니다.
- [x] `src/components/mission/PredictionPanel.test.tsx`에 오답 힌트의 두 짧은 문장을 요구하는 테스트를 추가했습니다.
- [x] `src/components/mission/SituationPanel.test.tsx`를 추가하고, 안전 문장이 실제 자료 경계와 `수를 세어 보는` 설명을 포함하는지 테스트했습니다.

**Minimal implementation**

- [x] `src/components/start/StartScreen.tsx`의 제목·목표 배열·자료 선택 legend/label을 Spec의 개선문으로 바꿨습니다.
- [x] `src/content/missions.ts`의 여덟 개 데이터 문맥을 `-해요` 말투로 바꿨습니다.
- [x] `src/components/mission/SituationPanel.tsx`에서 모델 경계 문장을 새 안전 문구 상수로 렌더링했습니다.
- [x] `src/components/mission/PredictionPanel.tsx`에서 오답 힌트를 두 문장으로 바꿨습니다.
- [x] `src/content/copy.ts`, `ComparisonPanel.tsx`, `EvidenceBuilder.tsx`에서 학습자 표면의 구현 용어·긴 종결어미를 Spec의 행동 중심 표현으로 정리했습니다. `OutlierDeltaPanel`은 기존 동사와 판정 설명을 유지하고 회귀 테스트로 텍스트 계약을 확인했습니다.
- [x] 텍스트 변경 날짜와 요약을 `src/content/updateHistory.ts`에 추가했습니다.

**Passing tests and probes**

- [x] 위 단위·컴포넌트 테스트를 통과시키고, 기존 계산·라우팅·저장 테스트가 그대로 통과하는지 확인했습니다.
- [x] 브라우저에서 시작 화면과 상황을 열고 초등학생 역할의 이해 질문을 수행했습니다. 예측·근거 질문은 같은 문장 계약을 테스트와 원장에서 확인했습니다: “오늘 무엇을 배우나요?”, “지금 무엇을 누르나요?”, “왜 이 자료가 가상인가요?”, “틀렸을 때 다음에 무엇을 하나요?”

### 3. Simulation TDD: live dots and deterministic reset

**Failing test first**

- [x] `src/domain/session.test.ts`에 `RESET_REDISTRIBUTION`이 재배분 중에만 현재 값을 초기 배열로 복원하고, `undoStack=[]`, `confirmed` 제거, 예측·단계·다른 아티팩트 보존을 요구하는 테스트를 추가했습니다.
- [x] `src/components/mission/RedistributionPanel.test.tsx`에 초기화 버튼 표시, 이동 후 `처음 상태로 되돌리기` 클릭 시 현재 수량·선택 상태·LiveRegion이 초기 상태로 돌아가는 테스트를 추가했습니다.
- [x] `src/components/mission/BalanceIllustration.test.tsx`와 `src/components/mission/QuantityDots.test.tsx`에 초기·중간·균형 배열의 `data-current-values`, `data-dot-count`, 총 점 개수, `aria-hidden` 불변식을 테스트했습니다.
- [x] `src/app/router.route-guards.test.tsx`에 초기화 후 단계가 `redistribute`에 남고 계산 단계로 건너뛰지 않는 경계 테스트를 추가했습니다.

**Minimal implementation**

- [x] `src/domain/session.ts`의 `LabAction`에 `{ type: 'RESET_REDISTRIBUTION' }`를 추가하고 reducer에서 `run.stage === 'redistribute'`이며 재배분 아티팩트가 있을 때만 초기화합니다. `initialValues`는 새 배열로 복사하고 `currentValues`를 같은 값으로 복사하며 `undoStack: []`, `confirmed: undefined`를 사용합니다.
- [x] `src/components/mission/RedistributionPanel.tsx`에 `resetRedistribution` 핸들러를 추가해 액션을 dispatch하고 `처음 상태로 되돌렸어요. 전체는 20개로 같아요.`를 LiveRegion에 알립니다. 선택 출발 상자와 오류 상태를 지웁니다.
- [x] 같은 컴포넌트의 보조 작업 영역에 `처음 상태로 되돌리기` 버튼을 추가하고, `canUndo`와 별개로 항상 활성화합니다. `고르게 나누기 확인`의 `gi-pulse` 동작은 그대로 둡니다.
- [x] `src/components/mission/BalanceIllustration.tsx`와 `src/components/mission/QuantityDots.tsx`의 현재 수량 단일 원천·장식 접근성 계약을 유지합니다. 필요할 때만 테스트용 `data-simulation-state` 속성을 추가하고 학습 숫자를 중복 생성하지 않습니다.
- [x] `src/styles/illustrations.css`의 기존 점 애니메이션과 reduced-motion 규칙을 확인하고, 새 지속 애니메이션을 추가하지 않습니다.
- [x] `src/content/updateHistory.ts`에 실시간 점 검증·초기화 보강 날짜 항목을 추가합니다.

**Passing tests and probes**

- [x] 도메인·컴포넌트·라우팅 테스트를 통과시킵니다.
- [x] 브라우저에서 `2,4,6,8` → `3,4,6,7` 한 번 이동을 관찰하고 총 점 20, 합계 20, 현재 수량 텍스트 일치를 확인합니다.
- [x] 네 번의 유효 이동으로 `5,5,5,5`를 만들고 `data-balanced="true"`, 평균 5, 점 20, 확인 버튼의 다음 행동 강조를 확인합니다.
- [x] 잘못된 같은 상자 선택에서 수량·점 개수가 바뀌지 않고 다음 행동 문장이 나타나는지 확인합니다. 빈 상자 선택은 이 자료에서 발생하지 않으므로 도메인 경계 테스트로 대체했습니다.
- [x] `처음 상태로 되돌리기`를 균형 전·균형 후 각각 눌러 `[2,4,6,8]`, 점 20, `data-balanced="false"`, 선택 해제, undo 비활성화를 확인합니다.
- [x] 320px, 375px, 1280px에서 가로 오버플로가 없고, 모든 재배분 버튼의 bounding box가 44px 이상이며, Tab→Enter로 초기화가 마우스와 같은 결과를 만드는지 확인합니다.

### 4. Scoped regression and acceptance report

- [x] `work/elementary-webapp-ux-text-simulation-report.md`에 변경 파일, 테스트 결과, 브라우저 시나리오, 언어 원장, 시뮬레이션 원장, P0~P3 잔여 이슈, 미실행 검사(VoiceOver·배포)를 기록했습니다.
- [x] 설계의 학습 목표(평균을 고르게 나눈 값·합계/개수·같은 평균과 다른 모양·평균의 도움/한계), 콘텐츠 판정 모델, 접근성, 개인정보·안전, MVP 완료 기준과 이번 두 기능의 연결을 보고서 체크표로 대조했습니다.
- [x] 계획·원장·보고서에서 금지된 자리표시자 표현이 없는지 수동 검색했고, 결과가 빈 결과임을 확인했습니다.
- [x] `A 세트|B 세트|고정된 문장|교육용 이산 모형입니다|나눕니다|비교합니다|살펴봅니다` 검색 결과를 검토하고, 의도적으로 남긴 계약·테스트 픽스처를 언어 원장에 기록했습니다.

## TDD execution order

각 기능은 반드시 다음 순서로 실행합니다.

1. 실패 테스트를 추가하고 해당 테스트만 실행해 예상 실패를 확인합니다.
2. 가장 작은 콘텐츠·액션·컴포넌트 변경을 적용합니다.
3. 해당 테스트를 통과시킵니다.
4. 관련 전체 테스트와 타입 검사를 실행합니다.
5. 같은 브라우저 시나리오를 재실행해 텍스트 이해와 점 수량 불변식을 확인합니다.
6. 원장과 보고서를 실제 증거로 갱신합니다.

## Future commands and expected results

아래 명령은 계획 승인 후 구현 단계에서 실행합니다.

```bash
cd "/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab"
npm test -- --run src/components/start/StartScreen.test.tsx src/content/missions.test.ts src/components/mission/PredictionPanel.test.tsx src/components/mission/SituationPanel.test.tsx
# 예상: 지정한 텍스트 테스트가 모두 PASS

npm test -- --run src/domain/session.test.ts src/components/mission/RedistributionPanel.test.tsx src/components/mission/BalanceIllustration.test.tsx src/components/mission/QuantityDots.test.tsx src/app/router.route-guards.test.tsx
# 예상: 재배분 초기화·점 수량·라우팅 경계 테스트가 모두 PASS

npm run typecheck
# 예상: TypeScript 오류 0건

npm test -- --run
# 예상: 전체 Vitest 테스트 PASS

npm run build
# 예상: Vite production build 성공, dist/ 생성

python3 "/Users/kimhongnyeon/.codex/skills/elementary-webapp-ux-orchestrator/scripts/preflight.py" \
  --manifest "/Users/kimhongnyeon/.codex/skills/elementary-webapp-ux-orchestrator/references/dependency-manifest.json" \
  --project-root "/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab" \
  --mode full --runtime-skill playwright --runtime-skill design-system \
  --report "/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/elementary-webapp-ux-bootstrap-text-simulation.md"
# 예상: status=ready, 브라우저·디자인 런타임 상태 갱신
```

브라우저 MCP에서는 `http://127.0.0.1:4201/#/`를 열고, 360px·320px·375px·1280px로 `browser_resize`를 실행합니다. `browser_evaluate`로 `data-current-values`, `data-dot-count`, `.quantity-dot` 총 개수, `document.documentElement.scrollWidth > document.documentElement.clientWidth`를 읽고, `browser_snapshot`으로 버튼 이름·상태·LiveRegion을 확인합니다. Playwright CLI가 환경상 실행되지 않으면 이를 정식 실패가 아니라 `not-run: environment`로 보고서에 남기고 MCP 증거를 사용합니다.

## Future commit steps

커밋은 사용자가 별도로 승인한 뒤에만 실행합니다.

1. `git diff --check`와 변경 파일 목록으로 계획 범위가 텍스트·시뮬레이션에만 머무는지 확인합니다.
2. 텍스트 TDD와 원장만 포함해 `git add src/content/copy.ts src/content/missions.ts src/components/start/StartScreen.tsx src/components/mission/SituationPanel.tsx src/components/mission/PredictionPanel.tsx src/components/mission/ComparisonPanel.tsx src/components/mission/OutlierDeltaPanel.tsx src/components/mission/EvidenceBuilder.tsx src/content/updateHistory.ts work/elementary-webapp-ux-language-audit.md` 후 `git commit -m "fix: simplify learner language"`를 실행합니다.
3. 시뮬레이션 TDD와 원장만 포함해 `git add src/domain/session.ts src/components/mission/RedistributionPanel.tsx src/components/mission/BalanceIllustration.tsx src/components/mission/QuantityDots.tsx src/components/mission/*.test.tsx src/app/router.route-guards.test.tsx work/elementary-webapp-ux-simulation-decision.md work/elementary-webapp-ux-simulation-test.md src/content/updateHistory.ts` 후 `git commit -m "fix: make balance simulation resettable"`를 실행합니다.
4. 두 커밋과 보고서를 검토한 뒤 사용자가 요청할 때만 원격 푸시·배포를 별도 계획으로 진행합니다. 이번 작업의 구현 단계에서는 푸시·배포를 실행하지 않습니다.

## Rollback

구현 중 학습 흐름이나 계산 판정이 바뀌면 해당 커밋을 적용하기 전 상태로 작업 트리에서 되돌리고, `RESET_REDISTRIBUTION` 액션과 문자열 변경만 다시 분리합니다. 세션 전체를 초기화하는 기존 `RESET_ACTIVE_DATASET`·`RESET_ALL`은 수정하거나 대체하지 않습니다.
