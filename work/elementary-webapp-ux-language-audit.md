# Learner Language Audit — Text and Sentence Scope

## Scope and method

- 대상: 초등학교 5~6학년 학습자에게 실제로 보이는 시작·상황·예측·비교·근거·결과·안전 문구
- 제외: 교사용 요약, 도메인 주석, README의 기술 계약, 저장된 근거 문장의 canonical 문자열, VoiceOver 실행
- 방법: `inventory_learner_text.py` 후보 목록을 참고한 뒤, 360px 로컬 브라우저 접근성 트리와 컴포넌트 테스트로 읽기 난이도·다음 행동·문맥 보존을 수동 확인
- 판정 기준: 한 문장에 한 행동, `-해요/-해 봐요` 말투, 수학 용어는 유지하되 첫 사용에 짧은 풀이, 숫자·판정·개인정보 경계는 변경하지 않음

## Audit ledger

| issue-id | screen/state | surface | source/evidence | target grade | before | difficulty signals | after | learning intent preserved | curriculum terms/facts preserved | comprehension probe | visual readability link | verification state | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EDU-LANG-001 | 시작 화면 / cold start | 제목·질문 | `src/components/start/StartScreen.tsx:64-67`; 360px snapshot에서 제목이 3줄로 분리됨 | 5~6 | `평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?` | `대표하며`, `움직이다`가 추상적이고 질문 안에 두 개념이 겹침 | `평균은 여러 값을 어떻게 나타내고, 값 하나가 달라지면 평균은 어떻게 달라질까요?` | 평균이 여러 값을 나타내는 수이고 한 값의 변화와 연결된다는 흐름 유지 | 평균·값·변화 사실 유지 | “오늘 평균을 무엇과 연결해 살펴보나요?” → 여러 값과 값 하나의 변화라고 답할 수 있는가 | 시작 화면 360px 접근성 snapshot·`StartScreen.test.tsx` | 새 제목 role/name PASS, 360px 가로 오버플로 없음 | done |
| EDU-LANG-002 | 시작 화면 / goal card | 학습 목표 4개 | `src/components/start/StartScreen.tsx:13-18`; 기존 네 문장의 종결어미가 모두 `-합니다` | 5~6 | `설명합니다/연결합니다/구별합니다/판단합니다` | 성인 보고서 말투, 학생이 해야 할 행동이 덜 선명함 | `설명해 봐요/연결해 봐요/구분해 봐요/판단해 봐요` | 평균의 정의·합계/개수·같은 평균과 모양·평균의 한계를 모두 유지 | 평균, 합계, 개수, 자료 모양, 근거 용어 유지 | “오늘 네 가지 중 무엇을 해 보나요?” → 각 항목의 동사를 말할 수 있는가 | 목표 목록 360px snapshot·`StartScreen.test.tsx` | 네 항목 exact text PASS | done |
| EDU-LANG-003 | 시작 화면 / next mission | 자료 선택 legend·radio label | `src/components/start/StartScreen.tsx:88-99`; 내부 A/B가 화면에 보임 | 5~6 | `자료 난이도`, `기본(A 세트)`, `도전(B 세트)` | 괄호 코드가 난이도 의미를 방해하고 “난이도”가 평가처럼 들림 | `자료 선택`, `기본 자료`, `도전 자료` | 필수 기본 자료와 선택 도전 자료의 선택 기능 유지 | 내부 dataset id와 A/B 저장 계약은 코드에만 남김 | “어떤 자료를 고르면 미션을 시작하나요?” → 기본 또는 도전이라고 답하는가 | radio 접근성 이름과 `StartScreen.test.tsx`·`ResultScreen.test.tsx` | 새 group/label PASS; e2e helper도 새 이름으로 갱신 | done |
| EDU-LANG-004 | 네 미션 / situation context | 자료 문맥 | `src/content/missions.ts:18-90`; 브라우저 balance 상황 및 `missions.test.ts` | 5~6 | `고르게 나눕니다/비교합니다/살펴봅니다` | 같은 앱 안에서 격식체와 해요체가 섞임 | `고르게 나눠 봐요/비교해 봐요/살펴봐요` | 네 미션이 요구하는 관찰·비교·재분배 행동 유지 | 포장 상자·선반·바구니·보급 상자와 모든 숫자 유지 | “이 자료에서 무엇을 해 보나요?” → 문맥의 동사를 그대로 말하는가 | 상황 패널 360px snapshot·`missions.test.ts` | 여덟 dataset context exact contract PASS | done |
| EDU-LANG-005 | situation / safety note | 가상 모형 설명 | `src/components/mission/SituationPanel.tsx:32-35`; 기존 `SAFETY_COPY.modelBoundary`는 README·문서용 기술 문구 | 5~6 | `이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.` | `정밀하게 측정`, `이산 모형`이 첫 화면에서 설명 없이 등장 | `실제 물건을 재는 것이 아니라, 수를 세어 보는 교육용 가상 모형이에요.` | 실제 자료가 아닌 세기 기반 모델이라는 경계 유지 | 숫자를 세는 정수 자료, 가상 활동이라는 모델 사실 유지; 기술 문구는 `modelBoundary`로 보존 | “왜 진짜 물건을 넣지 않았나요?” → 수를 세어 보는 가상 연습이라서라고 답하는가 | safety note 360px snapshot·`SituationPanel.test.tsx` | 새 문구 PASS; README 기술 계약은 유지 | done |
| EDU-LANG-006 | outlier / prediction after choice | 선택 후 상태 힌트 | `src/content/copy.ts:20-24`, `src/components/mission/PredictionPanel.tsx:58-60`; component test | 5~6 | `가상 자료에서 바꾼 값이 커졌는지 작아졌는지를 다시 살펴보세요. 합계와 평균의 숫자는 계산 단계에서 확인해요.` | `커졌는지 작아졌는지를` 반복되고 문장 길이가 김 | `바뀐 값이 커졌는지 작아졌는지 다시 살펴봐요. 합계와 평균의 숫자는 계산 단계에서 확인해요.` | 값 방향을 먼저 보고 수치는 계산 단계에서 확인하는 순서 유지 | 합계·평균·계산 단계 용어 유지 | “지금 숫자를 계산하나요, 방향을 살펴보나요?” → 방향을 먼저 고른다고 답하는가 | prediction panel 360px snapshot·`PredictionPanel.test.tsx` | 새 status exact text PASS | done |
| EDU-LANG-007 | twins/representative compare and explain | 선택지·단계 설명 | `src/components/mission/ComparisonPanel.tsx:129-235`, `EvidenceBuilder.tsx:170-181`; component/e2e helper | 5~6 | `...입니다/같습니다`, `고정된 문장`, `범위나 각 값을 함께 살펴봐야 합니다.` | 격식체·구현 용어·학생의 선택 행동이 분리되어 보임 | `...예요/같아요`, `살펴본 근거를 골라 문장을 완성해 보세요`, `...함께 살펴봐야 해요` | 평균·범위·각 값·흩어진 정도를 비교하고 근거를 고르는 흐름 유지 | 비교 판정 id와 canonical 생성 문장은 변경하지 않고, 보이는 선택지 말투만 개선 | “어떤 근거를 골라야 문장이 완성되나요?” → 살펴본 근거라고 답하는가 | compare/explain 접근성 snapshot·`ComparisonPanel.test.tsx`·`EvidenceBuilder.test.tsx` | 새 label/description PASS; canonical record 테스트 PASS | done |
| EDU-LANG-008 | representative explain/result | 안전·공정성 안내 | `src/content/copy.ts:100-107`, `EvidenceBuilder.tsx:177-181`, `ResultScreen.tsx:76-79` | 5~6 | `평균은 ... 보여 주지는 않습니다`, `평균 하나가 ... 결정하지 않습니다` | 부정형과 `결정하다`가 길고 딱딱함 | `평균은 ... 보여 주지는 않아요`, `평균 하나만으로 공정성이나 개인의 가치를 정할 수 없어요` | 평균의 도움과 한계, 개인 가치 판단 금지라는 안전 경계 유지 | `공정성`, `개인의 가치`, 평균의 한계 사실 유지; 기술 `fairness/usefulness` 상수는 보존 | “평균 하나만 보고 사람의 가치를 정해도 되나요?” → 안 된다고 답하는가 | representative result/evidence tests | 새 learner safety 문구 PASS; 기술 문구 README 계약 유지 | done |

## Preserved wording decisions

- `EVIDENCE_FRAGMENTS`와 `modelSentence`의 canonical 문장은 기존 저장 기록과의 호환을 위해 바꾸지 않았습니다. 대표값 선택지에만 `learnerEvidenceLabel`을 적용해 화면의 말투를 쉽게 만들고, 제출 기록·판정 문장은 기존 계약을 유지했습니다.
- `src/content/copy.ts`의 `modelBoundary`, `fairness`, `usefulness`는 README와 교사·문서 계약을 위해 유지하고, 학습자 화면은 같은 뜻의 `learner*` 표현을 사용합니다.
- `대표값 심의`는 사이드바·교사 맥락의 내부 제목이므로 변경하지 않았습니다. 학습자에게 노출되는 제목은 이미 `4. 평균만으로 괜찮을까요?`입니다.
- 정적 표현 검색에서 남은 항목은 학습자 화면이 아닌 계약·픽스처입니다. `src/content/copy.ts:101`의 `modelBoundary`는 README·문서 검증용 기술 상수이고, `src/content/documentation.test.ts:19,30`은 그 계약을 고정하며, `src/components/mission/RedistributionPanel.test.tsx:11`의 문맥은 패널 테스트용 입력입니다. 실제 학습자 표면에는 원장에 적은 `learner*` 문장이 렌더링됩니다.

## Text acceptance

- [x] 시작·상황·예측·비교·근거·결과의 학생용 문장이 해요체와 행동 중심으로 읽힙니다.
- [x] 숫자·평균 계산·판정 id·안전 경계·개인정보 계약은 유지되었습니다.
- [x] `src/components/start/StartScreen.test.tsx`, `SituationPanel.test.tsx`, `PredictionPanel.test.tsx`, `ComparisonPanel.test.tsx`, `EvidenceBuilder.test.tsx`, `ResultScreen.test.tsx`가 새 문장을 검증합니다.
- [x] `npm test -- --run`에서 전체 34개 테스트 파일, 276개 테스트가 통과했습니다.
