# Elementary Learner UX Audit

## 실행 경계

- 점검일: 2026-08-30 (Asia/Seoul)
- 대상: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`
- 실행 모드: `full`
- 관찰 방식: 브라우저 MCP 기반 렌더링 점검과 저장소 테스트, `simulated learner panel`
- 주 페르소나: 초등학교 5~6학년 `서윤`; 인접 가드레일: 초등학교 3~4학년 `준호`, 1~2학년 `민서`
- 실제 초등학생·교사·스크린 리더 사용자의 연구나 승인으로 해석하지 않습니다. VoiceOver는 실행하지 않았고, DOM 이름·키보드·포커스·반응형 결과만 별도 확인했습니다.
- 시작 시 Stage 0은 `ready`였습니다. 현재 런타임의 Available skills 목록에는 `ui-ux-pro-max`가 없어 직접 호출하지 않았고, 프로젝트의 `design-system/MASTER.md`를 기준으로 시각 결정을 검토했습니다. `impeccable` 독립 평가 2건은 코드 변경 없이 입력으로만 사용했습니다.

## 기준선 브라우저 점검

기준선은 cold start에서 학생이 보이는 단서만 따라 시작 → 미션 진입 → 오답 회복 → 완료를 관찰했습니다.

| 경로·화면 | viewport | 관찰된 행동/결과 | 근거 |
| --- | ---: | --- | --- |
| 시작 화면 | 375×812 | 질문과 목표는 보였지만 `미션 시작`은 첫 viewport 밖(`y≈1162`)에 있어 아래로 탐색해야 했습니다. | `output/playwright/elementary-baseline-start-375.png`, snapshot `page-2026-08-30T11-50-38-270Z.yml` |
| 시작 화면 | 320×800 | 같은 CTA가 `y≈1188`에 있어 첫 행동 위치를 추측해야 했습니다. | `output/playwright/elementary-baseline-320-viewport.png`, snapshot `page-2026-08-30T11-49-08-321Z.yml` |
| 시작 → 상황 | 375×812 | CTA를 찾기 위해 내려간 `scrollY≈778.5`가 새 단계에도 남아 `#main-content`와 상황 heading이 위로 밀렸습니다. | 브라우저 evaluate `scrollAfterStart=778.5`, snapshot `page-2026-08-30T11-50-45-191Z.yml` |
| 재배분 오답 | 375×812 | 같은 오답 문장이 `role="alert"`와 `role="status"`에 동시에 나타났습니다(`alertCount=1`, `statusCount=1`). | snapshot `page-2026-08-30T11-51-38-218Z.yml` |
| 결과 완료 | 1280×900 | 핵심 완료 경로와 결과 기록은 보였고 가로 넘침은 없었습니다. | 브라우저 run 결과 `mission-result`, `overflow=false` |

## 독립 전문 평가

### Assessment A — 시각·UX 휴리스틱

`impeccable` 평가자는 40점 만점 중 28점으로 보고했으며 디자인 구체성은 중상 수준으로 판정했습니다. 주요 관찰은 다음과 같습니다.

- P1: 예측 버튼이 선택된 뒤 포커스를 잃으면 선택 상태가 일반 버튼과 구분되지 않았습니다.
- P1: 재배분에서 출발 상자를 골라도 카드의 지속적인 선택 표시가 없어 두 단계 조작을 기억해야 했습니다.
- P2: outlier와 대표값 비교 화면에 균형 미션과 같은 점 분포 단서가 부족했습니다.
- P2: `prefers-reduced-motion` 설정에서도 기록 이동에 `smooth`가 직접 전달되었습니다.
- P2: 기록 앵커가 실제 focus target이 아니어서 이동 후 키보드 위치가 불명확했습니다.
- P2: 재배분 stage wrapper와 intro가 같은 landmark 이름을 사용했습니다.

### Assessment B — 정적·브라우저 탐지 재검토

독립 detector 재검토에서는 `src/styles/components.css:66`의 `.box-pattern-grid` two-axis gradient 1건만 advisory로 남았습니다. 이 무늬는 네 상자의 측정 작업대 표현이며 상자 번호·수량·버튼이 모두 DOM에 있으므로 학습 정보 은닉이나 장식 오인으로 판정하지 않았습니다. 최종 브라우저 재검토에서는 다음을 확인했습니다.

- 320/375/1280px에서 안정된 가로 overflow 없음
- route 이동 후 `scrollY=0`, `#main-content` focus 유지
- 오답 시 alert 1개, status 0개; 성공 이동 시 status 1개
- 예측·출발 상자 선택 표시와 점도표 accessible label 노출
- reduced-motion 기록 이동에 `behavior="auto"`
- 콘솔 Errors 0, 실패한 비정적 요청 0, 외부 요청 0

## 이슈 원장과 최종 상태

| ID | 심각도 | 학습자 영향 | 변경/검증 | 상태 |
| --- | --- | --- | --- | --- |
| EDU-UX-001 | P1 | 새 미션의 질문과 자료가 viewport 밖으로 밀림 | `src/hooks/useStageFocus.ts`에서 scroll top 정규화 후 main focus; 320/375 브라우저 확인 | 해결 |
| EDU-UX-002 | P2 | 같은 오답 안내가 두 알림으로 반복됨 | `LiveRegion` 빈 상태 미렌더링, 재배분 오류 announcement 비움; alert/status 수 확인 | 해결 |
| EDU-UX-003 | P2 | 시작 화면에서 첫 행동을 찾기 위해 긴 목표 목록을 탐색함 | `StartScreen`에 짧은 다음 행동 cue 추가; 320/375 첫 viewport에서 cue 확인 | 해결. CTA는 정상 문서 흐름에 남아 있으며 320px에서 cue 아래에 위치 |
| EDU-UX-004 | P3 advisory | 측정 무늬 detector 경고 | `.box-pattern-grid`는 의도된 시각 언어로 유지; DOM 수치·라벨 확인 | 수용된 관찰 |
| EDU-UX-005 | P1 | 예측 선택을 잃은 것처럼 느낄 수 있음 | `choice-selected`, `data-selected`, `aria-pressed`와 지속 CSS; unit/MCP 확인 | 해결 |
| EDU-UX-006 | P1 | 출발 상자와 목적지의 두 단계 조작을 기억해야 함 | 선택 상자 문장·instruction·`data-selected`·`aria-pressed`; unit/MCP 확인 | 해결 |
| EDU-UX-007 | P2 | 모션 감소 설정에서도 부드러운 스크롤이 실행됨 | `UtilityToolbar`가 reduced motion에서 `auto`, 기본에서 `smooth`; unit/MCP 확인 | 해결 |
| EDU-UX-008 | P2 | 튀는 값과 대표값 자료의 모양을 직접 비교하기 어려움 | outlier 변경 전·후 및 대표값에 기존 `DotPlot` 재사용; accessible label 확인 | 해결 |
| EDU-UX-009 | P2 | 기록으로 이동해도 키보드 focus 위치가 남지 않음 | 시작 span과 미션 aside에 `tabIndex={-1}`·이름 부여, helper가 target focus; MCP 확인 | 해결 |
| EDU-UX-010 | P2 accessibility advisory | landmark 목록에서 재배분 영역이 중복 이름으로 들림 | outer wrapper를 `aria-label="재배분 활동"`으로 분리; region snapshot 확인 | 해결. axe CLI 최종 실행은 not run |

P0 결함은 없고, 해결되지 않은 P1은 없습니다. EDU-UX-003의 CTA가 320px 첫 화면 안에 들어오지는 않지만 cue와 정상적인 문서 순서가 보이며, 현재 핵심 경로를 막지 않는 P2 후속 관찰로 남겼습니다.

## 설계 요구사항 대조

- 학습 목표: 평균을 전체 양을 고르게 나눈 값으로 이해하고 합계·자료 개수·평균의 관계를 계산하는 흐름을 `SituationPanel → PredictionPanel → RedistributionPanel → CalculationCheck`로 유지했습니다.
- 기존 앱과의 차별성: 가상 자료를 직접 조작하고 근거를 기록하는 평균 탐구 흐름을 보존했으며, 새 변경은 선택 상태와 점도표를 강화하는 범위로 제한했습니다.
- 핵심 흐름: 네 미션, 여덟 고정 자료, 버튼 기반 재배분, 오답 후 회복, 결과의 다음 학습 행동을 그대로 검증했습니다.
- 콘텐츠·판정 모델: `src/domain`의 평균·합계·범위·예측 경계와 `src/state` reducer를 변경하지 않았고, 수학 값과 판정은 DOM 텍스트가 계속 소유합니다.
- 접근성: `aria-pressed`, 고유 landmark 이름, focusable 기록 target, 단일 alert/status 계약, 키보드 Tab/Enter, reduced-motion을 확인했습니다. VoiceOver는 범위에서 제외했습니다.
- 개인정보·안전: 이름·학번·성적·신체 자료·계정·순위·AI·센서·마이크·음성·외부 통신을 추가하지 않았고 기존 익명 로컬 저장 경계를 유지했습니다.
- MVP·완료 기준: 기존 4개 미션과 결과 화면을 유지하면서 320/375/1280px 핵심 경로, 오답 회복, 모바일 overflow, 업데이트 내역, `gi-pulse`와 정적 reduced-motion 대체를 재검증했습니다.

## 검증 경계와 후속 관찰

- 저장소의 공식 Playwright E2E 31개는 `PLAYWRIGHT_REUSE_SERVER=true npm run test:e2e -- --project=chromium`으로 시도했지만, 앱 오류가 아니라 로컬 Chromium 실행 파일 부재(`/Users/kimhongnyeon/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`)로 모두 시작 단계에서 막혔습니다. 브라우저 설치는 실행하지 않았습니다.
- 같은 핵심 시나리오는 브라우저 MCP에서 cold start, 오답·회복, 완료, 키보드, reduced-motion, 점도표, focus, console/network를 확인했습니다. axe CLI 최종 실행은 bundled Chromium 부재로 `not run`이며, landmark 변경은 DOM snapshot으로 확인했습니다.
- 실제 학생·교사·VoiceOver 사용자의 수용 테스트는 수행하지 않았습니다. 필요하면 별도 승인과 연구 절차로 진행해야 합니다.
- 변경 파일 중 소스·테스트·스타일 단일 파일은 500줄 미만이며, 새 외부 이미지·의존성·통신은 추가하지 않았습니다.
