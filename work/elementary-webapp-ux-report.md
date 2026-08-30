# Elementary Learner UX Improvement Report

## 결정 요약

- 구현 범위: 초등학생 관점의 시작 행동, 단계 전환, 선택 상태, 오답 회복, 점도표 시각 단서, reduced-motion, 기록 focus와 landmark를 보강했습니다.
- 로컬 구현 상태: 완료
- 최종 수용 게이트: `conditional` — P0 0개와 해결되지 않은 P1 0개, 핵심 브라우저 MCP 시나리오는 통과했지만 공식 Playwright Chromium과 axe CLI 최종 실행은 환경상 `blocked/not run`입니다.
- 커밋·푸시·배포·HVC 등록·갤러리 동기화: 이 실행에서는 시작하지 않았습니다.
- 기준선 공개 주소(새 배포 증거가 아님): [기존 GitHub Pages 주소](https://wbmaker2.github.io/mean-balance-lab/)

## 대상과 학습 계약

- 대상 앱: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`
- 학습자: 초등학교 5~6학년 `서윤`을 주 페르소나로 하고, 3~4학년 `준호`와 1~2학년 `민서`를 가드레일로 사용했습니다.
- 학습 목표: 여덟 개의 고정 자료를 직접 살펴 평균을 “전체 양을 고르게 나눈 값”으로 이해하고, 합계 ÷ 자료 개수, 균형 전후, outlier 영향, 대표값의 한계를 근거와 함께 기록합니다.
- 보존한 계약: 네 미션, 자연수 평균·판정 도메인, 버튼 기반 재배분, 익명 로컬 저장, DOM이 소유하는 수치·수식·판정, 밝은 테마, `업데이트 내역`.

## 100점 보조 점수

| 영역 | 기준선 | 최종 | 근거 |
| --- | ---: | ---: | --- |
| 학습 목표·과제 명료성 (15) | 11 | 13 | 시작 질문·목표를 유지하고 첫 행동 cue를 추가했습니다. |
| 아동 언어·인지부하 (15) | 10 | 12 | `다음 행동`, 선택한 상자 문장을 짧은 현재형으로 제공하고 오류 문장 중복을 없앴습니다. |
| 화면 구조·행동 위계 (15) | 9 | 12 | 단계 진입 scroll top, current action 1개, 선택 상태 지속 표시를 확인했습니다. |
| 피드백·오류 회복 (15) | 9 | 13 | 오답은 alert 한 곳, 성공 이동은 status 한 곳으로 분리하고 source 재선택으로 회복됩니다. |
| 시각적 가독성 (10) | 7 | 8 | 선택 카드·버튼 대비와 outlier/대표값 점도표를 추가했습니다. |
| 키보드·의미·기본 접근성 (10) | 7 | 8 | main/기록 focus, `aria-pressed`, landmark 이름, Tab/Enter 경로를 확인했습니다. axe CLI 최종 결과는 없습니다. |
| 반응형 학습 흐름 (10) | 7 | 8 | 320/375/1280px에서 안정된 가로 overflow 없음과 핵심 경로를 확인했습니다. 320px CTA는 정상 문서 흐름의 아래쪽에 있습니다. |
| 런타임 안정성 (5) | 5 | 5 | 브라우저 MCP 최종 콘솔 Errors 0, 비정적 실패 요청 0, 외부 요청 0입니다. |
| 맥락적 시각자료·자산 안전 (5) | 5 | 5 | 새 이미지·외부 자산·생성 이미지 없이 기존 `DotPlot`과 DOM 수치를 재사용했습니다. |
| **합계** | **70** | **84** | 점수는 전후 비교용이며 미실행 게이트를 대신하지 않습니다. |

## 구현된 개선

### 첫 행동과 단계 전환

- `src/components/start/StartScreen.tsx`에 `다음 행동: 자료 난이도를 고르고 미션 시작을 눌러요.`를 추가했습니다.
- `src/styles/learner-cues.css`에 cue와 선택 상태의 지속적인 색·테두리·`gi-pulse` 대체 표현을 분리했습니다.
- `src/hooks/useStageFocus.ts`는 새 단계 진입 시 기존 모바일 scroll을 상단으로 정규화한 뒤 `#main-content`에 focus합니다.
- 시작 기록 target과 미션 기록 aside는 `tabIndex={-1}`과 accessible name을 갖습니다.

### 오답과 선택 상태

- `src/components/shared/LiveRegion.tsx`는 빈 메시지를 렌더링하지 않습니다.
- `src/components/mission/RedistributionPanel.tsx`의 오답은 `FeedbackPrompt` alert 한 곳에서만 읽히며, source 재선택 시 이전 알림이 비워집니다.
- 예측 선택은 `choice-selected`, `data-selected`, `aria-pressed`로 남습니다.
- 재배분은 “먼저 꺼낼 상자… 다음으로 넣을 상자…” 안내, `선택한 상자: N번`, 선택 카드 상태와 `aria-pressed`를 제공합니다.
- outer stage landmark 이름을 `재배분 활동`으로 고유화했습니다.

### 시각 자료와 모션

- `src/components/mission/OutlierDeltaPanel.tsx`에 변경 전·후 `DotPlot`을 추가했습니다.
- `src/components/mission/ComparisonPanel.tsx` 대표값 화면에 자료 모양 `DotPlot`을 추가했습니다.
- `src/components/layout/UtilityToolbar.tsx`는 reduced-motion이면 `scrollIntoView({ behavior: 'auto' })`, 기본이면 `smooth`를 사용합니다.
- `src/content/updateHistory.ts`와 `README.md`에 2026-08-30 개선 내역 3건을 기록했습니다.
- 정답 수치·수식·판정은 새 이미지에 넣지 않았습니다. 생성 이미지가 학습을 더 정확하게 만들지 않는 범위이므로 이미지 생성은 사용하지 않았습니다.

## 테스트와 브라우저 증거

### 저장소 검증

- `npm run check`: exit 0
  - TypeScript `tsc -b`: exit 0
  - Vitest: 33개 파일, 269개 테스트 통과
  - Vite production build: exit 0
- 개선 대상 targeted Vitest: 6개 파일, 31개 테스트 통과(초기 구현 묶음은 5개 파일, 32개 테스트 통과)
- `git diff --check`: 공백 오류 0건
- 소스·테스트·스타일 파일별 500줄 초과 검사: 0건; 한 줄 500자 초과 검사: 0건
- 소스·테스트 범위 placeholder 검색: `T[D]B`, `TO[D]O`, `FIXME`, `적절히 처리`, `나중에 작성`, `Task N과 동일` 0건 (기존 과거 보고서와 계획의 검색 명령 문자열은 대상에서 제외)

### 동일 시나리오 재검증

| 시나리오 | 결과 |
| --- | --- |
| 375px cold start → `미션 시작` → 상황 | URL이 `/mission/balance-delivery/balance-20-a/situation`, `scrollY=0`, `#main-content` focus, 상황 heading visible |
| 320px cold start → 미션 진입 | `scrollY=0`, 상황 heading visible, `clientWidth=scrollWidth=305`, overflow 없음; 첫 viewport에 행동 cue가 보임 |
| 375px 재배분 오답 | alert 1개, status 0개, 문장 `아직 상자 수가 같지 않아요…` 한 곳; overflow 없음 |
| source 재선택 → destination 이동 | 선택 문장과 `aria-pressed/data-selected` 표시, 성공 status 1개, 현재 수량 `3, 4, 6, 7` |
| 예측 선택 | `aria-pressed="true"`, `data-selected="true"`, `choice-selected` 유지; current action 1개 |
| outlier compare 375px | `변경 전 점도표: 4, 5, 5, 6`, `변경 후 점도표: 4, 5, 5, 10` role img 노출; overflow 없음 |
| 대표값 compare | `대표값 자료` 점도표 role img 노출 |
| 1280px balance 완료 | `/mission/.../mission-result`, 결과 heading·`활동 마치기`·다음 행동 노출, overflow 없음 |
| 키보드 | situation route에서 main focus 후 Tab으로 `다음: 평균 예측`, Enter로 다음 단계 진입 |
| reduced-motion | `기록` 클릭 시 `behavior="auto"`, `artifact-records` focus, route 보존 |
| 기록 target | 시작·미션 화면 모두 target이 실제 `document.activeElement`가 됨 |
| 콘솔/네트워크 | 최종 브라우저 MCP에서 Errors 0, Warnings 0, 비정적 실패 요청 0, 외부 요청 0 |

### 실행되지 않은 검증

- 공식 Playwright E2E 31개: `PLAYWRIGHT_REUSE_SERVER=true npm run test:e2e -- --project=chromium` 실행 시 앱이 아니라 로컬 Chromium 실행 파일 부재로 시작 단계에서 막혔습니다. 누락 경로는 `/Users/kimhongnyeon/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`이며, 브라우저 설치는 실행하지 않았습니다.
- axe CLI 최종 실행: bundled Chromium 부재로 `not run`; landmark와 role 계약은 DOM snapshot과 단위 테스트로 부분 확인했습니다.
- 실제 초등학생·교사·VoiceOver 사용자 연구: `not run`; simulated learner panel 결과와 분리합니다.

## 수용 게이트와 남은 작업

- P0: 0개
- 해결되지 않은 P1: 0개
- 핵심 시작·완료·자연스러운 오답 회복: 브라우저 MCP 확인
- 320px 가림·가로 잘림: 확인됨 없음. CTA는 정상 문서 흐름 아래에 있고 cue가 첫 viewport에 있습니다.
- 마우스 없이 핵심 조작·보이는 focus: 키보드 MCP 확인
- 정답·수치의 생성 이미지 의존: 없음
- 기준선과 같은 시나리오 재검증: 완료
- 최종 takeaway/다음 행동: 결과 화면과 시작 cue에 있음

따라서 현재 결과는 `conditional`입니다. 출시 전에 완전한 자동 브라우저 증거가 필요하면 Chromium 실행 파일을 승인된 방식으로 준비한 뒤 공식 E2E와 axe를 재실행해야 합니다. 실제 학습자 수용은 별도 연구 단계입니다. 이 문서 작성 시점에는 커밋·푸시·배포를 하지 않았습니다.
