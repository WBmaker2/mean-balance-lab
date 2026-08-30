# Simulation Test Ledger — Live Quantity Dots

## Scope and test setup

- 대상 기능: 재배분 단계의 한 개 이동, 실시간 점도표, 합계 보존, 균형 판정, 오류 안내, 명시적 초기화
- 제외 기능: 텍스트 외 전면 UX 감사, VoiceOver 실행, 배포·원격 저장소 검증
- 로컬 주소: `http://127.0.0.1:4201/#/`
- 기준 자료: `balance-20-a`, 처음 수량 `[2, 4, 6, 8]`, 전체 합계 `20`, 목표 평균 `5`
- 브라우저 증거: Playwright MCP 접근성 스냅샷·DOM 평가·키보드 입력·콘솔·네트워크 확인
- 단위 테스트 근거: `src/domain/session.test.ts`, `src/components/mission/RedistributionPanel.test.tsx`, `src/components/mission/BalanceIllustration.test.tsx`, `src/components/mission/QuantityDots.test.tsx`, `src/app/router.route-guards.test.tsx`

## Decision and invariant ledger

| 항목 | 결정 | 구현 근거 | 합격 조건 |
| --- | --- | --- | --- |
| 시뮬레이션 대상 | 상자 네 개의 구슬 수량을 한 번에 한 개씩 옮김 | `src/components/mission/RedistributionPanel.tsx:144-176` | 출발·도착 상자를 선택하면 두 값이 각각 `-1/+1` |
| 단일 소스 | `currentValues`가 카드 숫자와 점도표를 함께 결정 | `RedistributionPanel.tsx:123-127`, `BalanceIllustration.tsx:19-24`, `QuantityDots.tsx:13-29` | DOM의 `data-current-values`, `data-dot-count`, 현재 수량 문장이 같은 배열을 반영 |
| 보존 불변식 | 이동·오류·초기화 뒤 전체 합계는 20 | `session.ts:243-258`, 패널 LiveRegion | 모든 시나리오에서 점 총수와 합계가 20 |
| 균형 판정 | 네 값이 같을 때만 `balanced=true`, 확인 버튼을 다음 행동으로 강조 | `RedistributionPanel.tsx:103-112`, `BalanceIllustration.tsx:16-30` | `[5,5,5,5]`에서 평균 5·균형 문장·`gi-pulse` 확인 |
| 관찰 후 설명 | 바뀐 값의 방향을 먼저 보고, 합계·평균 숫자는 계산 단계에서 확인 | `src/content/copy.ts:21`, `PredictionPanel.tsx:58-60` | 예측 뒤 방향 힌트가 보이고 계산 전 숫자를 단정하지 않음 |
| 초기화 | 별도 `RESET_REDISTRIBUTION`으로 초기 배열·현재 배열·undo를 함께 복원 | `session.ts:243-259`, `RedistributionPanel.tsx:96-101,190-195` | 어느 상태에서 눌러도 `[2,4,6,8]`, 점 20, undo 비활성화 |
| 오류 경로 | 같은 상자 이동은 값과 점을 바꾸지 않고 다음 행동을 안내 | `RedistributionPanel.tsx:72-86`, 테스트 72-84행 | `alert`가 원인과 다음 행동을 모두 포함 |

## Scenario ledger

| scenario-id | 시작 상태 | 조작 | 관찰 결과 | 설명·다음 행동 | 예상/실제 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| SIM-001 | 재배분 진입, `[2,4,6,8]` | 아무 이동도 하지 않음 | 현재 수량 `2,4,6,8`, 점 `20`, `data-balanced=false`, reset 활성, undo 비활성 | “더 많은 상자에서 적은 상자로 1개를 옮겨 보세요.” | 일치 | PASS |
| SIM-002 | SIM-001 | `4번 상자에서 1개 꺼내기` → `1번 상자에 1개 넣기` | `[3,4,6,7]`, 각 바구니 점 수 `3/4/6/7`, 점 총수 `20`, 현재 수량 문장 동일 | LiveRegion: `4번 상자에서 1개를 1번 상자로 옮겼어요. 현재 수량 3, 4, 6, 7. 전체는 20개로 같아요.` | 일치 | PASS |
| SIM-003 | `[3,4,6,7]` | `2번 상자에서 1개 꺼내기` 후 같은 `2번 상자에 1개 넣기` | 값 `[3,4,6,7]`·점 `20` 불변, 선택 상태 유지, undo 비활성 | `같은 상자에서는 옮길 수 없어요. 다음 행동: 다른 상자의 +1 버튼을 눌러 보세요.` | 일치 | PASS |
| SIM-004 | `[2,4,6,8]` | 유효 이동 네 번으로 `3→1`, `4→1`, `4→1`, `4→2` | `[5,5,5,5]`, 평균 `5`, 점 `20`, `data-balanced=true`, caption `고르게 나뉘었어요.` | 확인 버튼만 enabled current action이며 `gi-pulse` 강조 | 일치 | PASS |
| SIM-005 | SIM-003의 오류 상태와 SIM-004의 균형 상태 각각 | `처음 상태로 되돌리기` 클릭 | 두 경우 모두 `[2,4,6,8]`, 점 `20`, `data-balanced=false`, 선택 해제, undo 비활성 | LiveRegion: `처음 상태로 되돌렸어요. 전체는 20개로 같아요.` | 일치 | PASS |
| SIM-006 | 이동 후 reset 버튼에 포커스 | 버튼에 포커스 후 Enter | 마우스 클릭과 같은 초기화, 포커스가 reset 버튼에 남음 | 키보드만으로 같은 결과를 재현 | 일치 | PASS |
| SIM-007 | 재배분 화면 | viewport `320×812`, `375×812`, `1280×800` | 각 viewport에서 `scrollWidth === clientWidth`; 재배분 버튼 높이 모두 `44px` 이상; 점도표가 컨테이너 안에 있음 | 모바일·데스크톱에서 가로 스크롤 없이 수량을 읽고 조작 | 일치 | PASS |
| SIM-008 | 최종 브라우저 상태 | 콘솔 오류·동적 요청 확인 | `browser_console_messages(level:error)` 오류 0; 동적 네트워크 요청 없음 | 계산·저장 경계가 로컬 UI에 머무름 | 일치 | PASS |

## Visual and motion evidence

- 360px 결과 이미지: [elementary-text-simulation-redistribution-360.png](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/output/playwright/elementary-text-simulation-redistribution-360.png)
- 1280px 결과 이미지: [elementary-text-simulation-redistribution-1280.png](/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/output/playwright/elementary-text-simulation-redistribution-1280.png)
- 점도표는 장식 이미지 위에 DOM으로 그려지며 이미지 자체에 학습 숫자를 새기지 않습니다. `QuantityDots`는 `aria-hidden="true"`로 중복 낭독을 막고, 현재 수량 문장과 카드가 학습 정보를 제공합니다.
- `prefers-reduced-motion`에서는 `src/styles/illustrations.css:158-163`이 점·이미지 전환과 애니메이션을 끄고 균형 상태를 윤곽선으로 표시합니다. 별도 지속 애니메이션이나 자동 재생은 추가하지 않았습니다.
- `pause/step` 제어는 한 개 이동을 직접 조작하는 활동 모델에 필요하지 않아 이번 범위에서는 적용 대상이 아닙니다. 대신 reset·undo·오류 안내를 제공했습니다.

## Unit and browser gate

- `npm run check`: typecheck 0건, Vitest `34 files / 276 tests` PASS, Vite build PASS
- targeted simulation tests: 도메인·패널·일러스트·라우팅 관련 테스트 PASS
- TDD 기록: 구현 전 새 문구와 reset 계약 테스트에서 의도한 실패를 확인한 뒤 최소 구현을 적용하고, 같은 테스트와 전체 회귀를 통과시켰습니다.
- 브라우저 재검증은 같은 자료와 같은 이동 순서를 사용했습니다. DOM 숫자·점 개수·합계·오류·초기화·키보드·세 viewport를 모두 확인했습니다.
- 빈 상자 경로는 `[0,4,6,10]` 도메인/컴포넌트 테스트에서 출발 버튼 disabled와 오류 불변식을 검증했습니다. 기준 자료 자체에는 빈 상자가 없으므로 브라우저 흐름에는 포함하지 않았습니다.
