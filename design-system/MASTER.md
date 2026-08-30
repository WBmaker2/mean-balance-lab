# Mean Balance Lab Design System

## Purpose

`평균 균형 조정실`은 초등학교 5~6학년이 평균을 직접 조정하고 근거를 기록하는 정적 학습 앱입니다. 새 시각 세계는 **교실 측정 노트와 분배 작업표**입니다. 종이·잉크·자·기록 장부의 규율을 사용하되, 모든 학습 숫자와 수식은 semantic DOM으로 렌더링합니다. 이 문서는 UI 계층만 규정하며 도메인 계산·판정·라우팅·저장 계약에는 관여하지 않습니다.

## Visual direction

- 화면은 한 장의 측정 작업표처럼 읽힙니다: 질문과 목표 → 중앙 작업대 → 진행과 검증 장부 → 다음 행동.
- 따뜻한 아이보리 종이와 가는 청색 줄은 실제 노트의 리듬을 만들고, 그래파이트 잉크는 본문과 숫자를 담당합니다.
- 코발트는 현재 단계·선택·초점이라는 한 가지 의미를 갖습니다. 안전·주의는 작은 주황 주석으로만 표시합니다.
- 모서리는 10~14px의 종이 모서리로 제한하고, 넓은 카드 격자·유리 효과·과한 그라데이션을 사용하지 않습니다. 승인된 이미지 중심 보강에서는 빈 트레이·종이 질감처럼 의미를 주장하지 않는 로컬 생성 장식만 허용합니다.
- 수식과 자료 값은 `font-variant-numeric: tabular-nums`로 정렬합니다. 외부 폰트·CDN·원격 이미지는 금지하고, 생성 장식 이미지는 `src/assets/notebook/`의 버전 파일을 정적으로 import합니다. 숫자·수식·표·점·상태·조작은 언제나 DOM이 소유합니다.
- `impeccable` 승인 comp는 `.impeccable/mocks/mean-balance-notebook-bench.png`이며, 구조 기준으로만 사용합니다. comp 안의 부정확한 글자와 아이콘을 raster로 복사하지 않습니다.

### Decorative asset contract

- `src/assets/notebook/bench-illustration-v2.png`는 빈 트레이와 작업대의 분위기만 제공하는 장식 레이어입니다. 이미지에 읽을 수 있는 글자·숫자·수식·표·로고·버튼·실존 인물·사실을 넣지 않습니다.
- 장식 `<img>`는 `alt=""`, `aria-hidden="true"`, `pointer-events: none`을 사용하고, 같은 영역의 초기 수량·현재 수량·평균·상태는 DOM 텍스트와 기존 컨트롤로 중복 제공해야 합니다.
- `src/components/mission/QuantityDots.tsx`가 그리는 동그라미는 현재 수량을 시각적으로 보여 주는 DOM 장식이며 `aria-hidden="true"`를 유지합니다. 각 바구니의 `data-dot-count`와 기존 현재 수량 텍스트·`LiveRegion`은 같은 `currentValues`에서 파생되어야 하며, raster 이미지에 숫자나 동그라미를 굽지 않습니다.
- 생성 결과가 흐리거나 학습 의미를 오도하면 이미지 import를 제거하고 기존 CSS 작업대로 되돌립니다. 원본 favicon과 DOM 패턴은 삭제·덮어쓰지 않습니다.

## Token architecture

### Primitive layer — `src/styles/tokens.css`

원시 값은 한 곳에서만 선언합니다.

```css
:root {
  --color-paper: #f7f4ec;
  --color-paper-line: #d9e2ee;
  --color-ink: #1d252c;
  --color-ink-muted: #53616b;
  --color-cobalt: #1457b8;
  --color-cobalt-deep: #0d3f86;
  --color-annotation: #b45309;
  --color-success: #176b45;
  --color-danger: #a32929;
  --space-1: 0.5rem;
  --space-2: 0.75rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --radius-sheet: 0.875rem;
  --radius-control: 0.625rem;
}
```

### Semantic layer

의미 토큰은 primitive만 참조합니다.

```css
:root {
  --surface-page: var(--color-paper);
  --surface-sheet: var(--color-surface);
  --surface-workbench: var(--color-blue-wash);
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-ink-muted);
  --border-rule: var(--color-paper-line);
  --focus-ring: var(--color-cobalt);
  --action-primary: var(--color-cobalt);
  --action-primary-hover: var(--color-cobalt-deep);
}
```

### Component layer

컴포넌트 토큰은 semantic을 조합합니다.

```css
:root {
  --sheet-padding: clamp(1rem, 3vw, 2.25rem);
  --workbench-gap: clamp(1rem, 2.4vw, 2rem);
  --action-height: var(--control-min);
  --sheet-shadow: 0 14px 36px rgb(29 37 44 / 0.12);
  --rule-width: 1px;
}
```

컴포넌트 CSS에는 raw hex를 쓰지 않고 `var()`를 사용합니다. 상태 색을 추가할 때도 의미 토큰을 먼저 정하고 component 토큰에서 참조합니다.

## Component contracts

### `SectionIntro`

`src/components/shared/SectionIntro.tsx`의 `SectionIntroProps`는 `{ id, title, description?, eyebrow?, tone?, children? }`입니다. `eyebrow`는 하위 테스트와 재사용 API를 위해 남기되 실제 학습 화면에서는 제목 위에 반복 라벨을 그리지 않습니다. 부모 `section`은 `aria-labelledby={id}`를 갖고 route당 주 제목 하나만 둡니다.

### `ActionButton`

`src/components/shared/ActionButton.tsx`의 `emphasis="next"`만 현재 행동입니다. enabled 상태에서 `data-current-action="true"`와 `gi-pulse`를 붙이고, disabled 상태에는 붙이지 않습니다. `44px` 이상 터치 영역, hover·active·disabled·focus-visible 상태, 긴 한국어 줄바꿈을 보장합니다. 버튼에는 아이콘 문자를 장식으로 넣지 않고 행동 문장을 씁니다.

### `ProgressRail`

`src/components/layout/ProgressRail.tsx`는 `nav[aria-label="미션 진행"]`과 `ProgressSummary`를 제공합니다. 현재 한 항목만 `aria-current="step"`이며 완료·현재·예정은 상태 단어·번호·border로 중복 전달합니다. desktop은 얇은 가로 기록선, 640px 이하에서는 세로 체크 목록입니다.

### `ArtifactTrail`

`src/components/layout/ArtifactTrail.tsx`는 검증된 `prediction`, `redistribution`, `calculation`, `comparison`, `evidence`, `revision`만 `data-artifact-kind` 행으로 렌더링합니다. 내부 id·JSON·검증 전 숫자는 표시하지 않습니다. 각 행은 학습자용 문장과 왜 중요한지 한 줄 설명을 가집니다.

### `UpdateHistoryDialog`

`src/components/update/UpdateHistoryDialog.tsx`의 trigger는 문서 정상 흐름에 있는 `44px` 버튼입니다. dialog는 `aria-modal="true"`, 고유 제목, Escape 닫기, Tab 순환, 닫은 뒤 trigger 초점 복귀를 보장합니다. 기록은 `src/content/updateHistory.ts`의 실제 KST 날짜·구분·요약으로 관리합니다.

## Layout rules

- `.notebook-shell`은 `--content-width` 안에서 3열(질문/작업대/기록)로 배치하고 860px 이하에서 2열, 640px 이하에서 1열로 전환합니다.
- `.worksheet-page`는 `--surface-sheet`와 `--sheet-shadow` 한 장을 사용하며, nested card grid 대신 구분선·여백·작업대 surface로 계층을 만듭니다.
- 본문 문단은 `--content-readable`(약 65~72ch) 이내로 제한합니다. 제목은 `text-wrap: balance`, 설명은 `text-wrap: pretty`를 사용합니다.
- 버튼·입력·summary·링크의 실제 표시 영역은 44×44px 이상입니다. 320px부터 가로 overflow가 없어야 하며, 200% 글자에서도 값·버튼이 줄바꿈됩니다.
- print에서는 `.teacher-summary-table-region`만 남기고 shell·업데이트 trigger·학생용 행동을 숨깁니다.

## Motion and states

- 현재 행동 버튼 하나만 `gi-pulse`로 반복 강조합니다. hover는 색·깊이, active는 1px 눌림, disabled는 대비를 낮추되 형태를 유지합니다.
- 오류는 문제와 회복 행동을 함께 쓰고 `role="alert"` 또는 `aria-live`로 알립니다. 로딩이 필요한 정적 흐름은 없으므로 임의 spinner를 넣지 않습니다.
- 빈 artifact trail은 렌더링하지 않습니다. 결과 잠금은 남은 미션 이름과 시작 행동을 보여 줍니다.
- `prefers-reduced-motion: reduce`에서는 animation·smooth scroll을 제거하고 현재 버튼에 4px 정적 outline과 보이는 `다음 행동` 텍스트를 표시합니다.

## Accessibility and safety

- 모든 input은 visible label과 `aria-describedby`를 연결하며, 단계 변경 시 `#main-content`로 초점을 이동합니다.
- 색 외에 번호·상태 단어·무늬·텍스트를 사용합니다. 본문 대비 4.5:1 이상, 큰 글자 3:1 이상을 목표로 합니다.
- 이름·학번·성적·실제 학급 자료·계정·순위·AI 채점·센서·마이크·음성 기능·외부 통신을 추가하지 않습니다.
- 결과에는 교육용 이산 모형과 평균 하나로 공정성·개인 가치를 결정할 수 없다는 문구를 유지합니다.
- VoiceOver와 실제 보조공학 사용자 승인은 자동 검증 범위 밖이며, DOM·axe·키보드·모바일 검증과 구분해 보고합니다.
