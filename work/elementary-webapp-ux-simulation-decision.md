# Simulation Decision Ledger — Balance Delivery

## Scope

검토 대상은 `src/components/mission/RedistributionPanel.tsx`의 균형 배송 활동과 그 하위 DOM 시각화입니다. 다른 미션의 점도표는 정적 비교 자료이므로 이번 시뮬레이션 판정에는 포함하지 않습니다.

## Decision

| field | decision | evidence |
| --- | --- | --- |
| opportunity | `implement` | 최근 추가된 실시간 바구니 점 기능이 학습자가 “한 개를 옮기면 수량이 어떻게 달라지는가”를 직접 관찰하게 하므로 검증·초기화 보강을 구현함 |
| model boundary | 네 바구니의 자연수 수량만 다루는 교육용 가상 모델. 실제 물건·실제 측정·개인 자료를 사용하지 않음 | `src/content/missions.ts`의 고정 데이터, `SituationPanel` learner safety copy, README 기술 경계 |
| source of truth | `ActiveRun.artifacts.redistribution.currentValues` | `MissionScreen`이 panel에 전달하고 `BalanceIllustration`·`QuantityDots`가 같은 배열을 받음 |
| one variable | 한 조작은 `{ fromIndex, toIndex }` 한 쌍. 출발 수량 -1, 도착 수량 +1 | `moveOne` 결과와 `MOVE_ONE` reducer |
| conservation invariant | 이동·초기화 전후 `sum(currentValues) === sum(initialValues)`, 기본 자료 합계는 20 | panel guard, session reducer, browser evaluate |
| observation | `data-current-values`, 바구니별 `data-dot-count`, `.quantity-dot` 총 개수, 현재 수량 텍스트, `data-balanced`, `LiveRegion` | DOM 검증 목록 |
| explanation | 초기/현재 오버레이와 `평균 20 ÷ 4` 힌트로 전체 양 보존과 균형 상태를 연결 | `BalanceIllustration.tsx`, `RedistributionPanel.tsx` |
| reset | `RESET_REDISTRIBUTION`이 현재 배열을 `initialValues`로 복사하고 `undoStack`·`confirmed`를 비움. 패널은 선택 출발 상자·오류를 지우고 status를 알림 | `src/domain/session.ts`, `src/components/mission/RedistributionPanel.tsx` |
| comparison | 초기 `[2,4,6,8]` → 중간 `[3,4,6,7]` → 균형 `[5,5,5,5]` → reset `[2,4,6,8]` | component test + local Playwright MCP |
| wrong path | 같은 상자·빈 상자 선택은 값·점 개수를 바꾸지 않고 다음 행동을 안내 | `RedistributionPanel.test.tsx`, browser status/alert probe |
| keyboard/touch | 네이티브 `button`으로 Enter/Tab과 pointer click을 같은 reducer 경로로 처리. 버튼 최소 높이 44px | browser bounding-box probe, `ActionButton` contract |
| reduced motion | 새 모션을 추가하지 않음. 기존 `.quantity-dot`의 `quantity-dot-pop`은 `@media (prefers-reduced-motion: reduce)`에서 `animation:none`; 균형 상태에는 정적 outline | `src/styles/illustrations.css:158-162` |
| pause | `N/A`: 자동 재생·시간 경과 상태 없음 | 클릭 즉시 한 상태만 바뀌는 모델 |
| step | `N/A`: 프레임·연속 시간축이 없고 한 번의 클릭이 이미 최소 학습 단위 | `moveOne`은 항상 1개만 이동 |
| performance | DOM 점 최대 24개(B 자료)와 CSS grid 사용. Canvas/WebGL·새 패키지 없음 | `QuantityDots.tsx`, production build |
| visual asset | 기존 bench raster는 장식만 담당하며 숫자·점은 DOM으로 생성 | `BalanceIllustration.test.tsx` alt/aria-hidden 및 dot tests |

## Risk and mitigation

- `currentValues`와 점 개수가 서로 다른 원천을 참조하면 시각적 오개념이 생길 수 있으므로, 테스트에서 배열·각 basket count·총 점 개수를 동시에 검사합니다.
- 초기화가 세션 전체를 지우면 학습 기록이 사라질 수 있으므로, 새 액션은 `redistribution`만 재설정하고 예측·계산·단계는 보존합니다.
- `aria-hidden` 점이 화면 낭독기에 수량을 숨길 수 있으므로, 같은 수량을 overlay·현재 수량 문장·LiveRegion으로 제공합니다.
- 320px에서 점과 버튼이 잘리면 조작이 불가능하므로 세 폭에서 scroll width와 44px 버튼 높이를 측정합니다.

## Acceptance checklist

- [x] 유효 이동 1회 뒤 `[3,4,6,7]`, 점 20개, 합계 20, 현재 텍스트가 일치합니다.
- [x] 균형 `[5,5,5,5]` 뒤 `data-balanced="true"`, 평균 5, 점 20개, 확인 버튼 하나만 현재 행동입니다.
- [x] reset 뒤 `[2,4,6,8]`, 점 20개, `data-balanced="false"`, undo 비활성화, status가 확인됩니다.
- [x] 같은 상자 오류 뒤 값과 점 개수가 보존됩니다.
- [x] 320px·375px·1280px 가로 오버플로가 없고 주요 버튼 높이가 44px 이상입니다.
- [x] `npm run typecheck`, `npm test -- --run`, `npm run build`가 통과했습니다.
