# Mean Balance Lab Education Webapp Redesign Audit

## Scope and evidence

- 감사 날짜: 2026-08-30 (Asia/Seoul)
- 대상: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`
- 규칙 확인: 저장소 루트의 `AGENTS.md`, `EDUCATION_DESIGN.md`는 없었고 `README.md`, `2026-08-26-mean-balance-lab-design.md`, `2026-08-28-mean-balance-lab-improvement-plan.md`를 제품·학습 기준으로 삼았습니다.
- 제품 기록: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/PRODUCT.md`를 `impeccable` 초기화 규칙에 따라 확인 가능한 사실만 기록했습니다.
- 읽은 코드 범위: `src/app`, `src/components`, `src/content`, `src/domain`, `src/state`, `src/styles`, `tests/e2e`
- 기존 기준선: 2026-08-29 리디자인 변경이 미커밋 상태로 존재하며, 이 실행에서는 되돌리지 않습니다.
- VoiceOver 및 실제 보조공학 사용자 승인은 감사·검증 범위에서 제외합니다.

## Role execution

| 역할 | 경로 | 2026-08-30 확인 결과 |
|---|---|---|
| `education-webapp-redesign` | `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/SKILL.md` | 전체 지침 읽음 |
| `impeccable` | `/Users/kimhongnyeon/.agents/skills/impeccable/SKILL.md` | context·concept-seed·build-phase·comp-spec·font-match 실행 |
| `design-system` | `/Users/kimhongnyeon/.agents/skills/design-system/SKILL.md` | token architecture 읽고 문서에 3계층 반영 |
| `redesign-existing-projects` | `/Users/kimhongnyeon/.agents/skills/redesign-existing-projects/SKILL.md` | Vite/React/vanilla CSS 진단 기준 적용 |
| `imagegen` | `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md` | 내부 comp 3종 생성에 사용 |
| 자산 안전 참조 | `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/references/asset-safety.md` | 데이터·문서·수식 이미지는 자동 교체 금지로 판정 |

## Initial incumbent findings

1. 기존 2026-08-29 화면은 질문·목표·진행·근거를 카드로 분리했지만 색·둥근 카드·강한 border가 반복되어 “작업표”보다 범용 SaaS 화면처럼 읽힐 여지가 있습니다.
2. `SectionIntro`의 eyebrow와 `section-kicker`가 제목 위에 반복되어 첫 화면의 정보 밀도를 높입니다. 새 시각 세계에서는 제목과 행동 문장 자체로 계층을 만들고 optional API만 보존합니다.
3. 시작·미션·결과의 공통 CSS가 단일 surface의 관계보다 각각의 card box를 강조합니다. 질문·중앙 작업대·우측 기록·하단 CTA의 한 장 구조가 필요합니다.
4. 숫자·수식은 이미 DOM으로 제공되므로 이미지 생성으로 대체해서는 안 됩니다. `DotPlot`과 box pattern은 학습 정보에 직접 기여합니다.
5. `ActionButton`, `ProgressRail`, `ArtifactTrail`, `UpdateHistoryDialog`, `useStageFocus`의 접근성·상태 계약은 강점이므로 새 CSS에서도 유지해야 합니다.

## Replacement-world direction audit

`node /Users/kimhongnyeon/.agents/skills/impeccable/scripts/concept-seed.mjs --scope direction --mode operate` 결과는 키 `93ababc8`, 지정 번호 6번이었습니다. 팀의 6번 grounded direction인 **교실 측정 노트와 분배 작업표**를 선택하고, challenger를 학습자 식별 가능성·제품 명료성 두 축으로 검토했습니다.

| 방향 재료 | 판정 | 감사 메모 |
|---|---|---|
| phosphor terminal | declined | 어두운 단일색과 터미널 은유가 초등 수학 자료를 숨길 위험이 있어 제외 |
| ASCII live scene | declined | 글리프 밀도보다 실제 값·점·무늬가 필요해 제외 |
| orizuru fold sequence | competitive | 단계 순서 규율만 차용하고 종이 접기 그림은 사용하지 않음 |
| iridescent cloud edge | declined | 색 변화가 합계·평균보다 앞설 수 있어 제외 |
| streaming title wall | declined | 탐색형 타일은 한 번에 한 행동이라는 흐름과 충돌 |
| cd-rom chrome navigation | competitive | 눌림·초점 피드백만 차용하고 베벨·음성은 제외 |

선택 방향의 승인 comp는 `.impeccable/mocks/mean-balance-notebook-bench.png`입니다. 보조 comp `.impeccable/mocks/mean-balance-notebook-spread.png`, `.impeccable/mocks/mean-balance-notebook-rail.png`도 같은 1586×992 조건으로 생성했습니다. `comp-spec.mjs --grid`, `--regions`, text region `font-match --measure`, lead `equation-copy` `font-match --rank`를 실행했고, 결과는 `.impeccable/build/comp-grid.png`, `.impeccable/build/regions.json`, `.impeccable/build/spec.json`에 있습니다.

## Prioritized implementation findings

| 우선순위 | 관찰 | 개선 방향 | 검증 |
|---|---|---|---|
| P0 | 승인 comp의 한 장 작업표 구조가 기존 카드 격자와 다름 | paper/ink/cobalt token과 3열 worksheet shell 도입 | computed token, desktop/mobile screenshot |
| P1 | 제목 위 kicker가 반복됨 | 실제 learner 화면에서는 eyebrow/kicker 제거, heading과 section label로 의미 전달 | heading count·copy Vitest |
| P1 | 중앙 학습 행동과 우측 기록이 같은 시각 무게를 가짐 | workbench surface와 evidence ledger의 대비·공간 분리 | 1586×992 visual review, current action count |
| P1 | 모바일에서 작업대와 CTA가 길게 쌓임 | 640px 이하 1열, CTA order와 focus handoff 유지 | 320/375px no-overflow E2E |
| P1 | 현재 action pulse가 여러 단계에서 과도하게 눈에 띌 수 있음 | enabled next CTA 하나만 pulse, reduced motion 정적 outline | CSS media query, Playwright |
| P2 | update trigger는 정상 흐름이지만 새 sheet footer와 시각 언어가 다름 | shell footer의 작은 문서 버튼으로 통합, 날짜 기록 유지 | dialog focus·non-overlap test |

## Accessibility, privacy, and scope checks

- 44×44px controls, `:focus-visible`, `aria-current`, `aria-live`, first-error focus, dialog Escape/Tab/focus restore를 유지합니다.
- 색 외 번호·무늬·상태 텍스트로 자료를 구분하고, light mode를 고정합니다.
- `prefers-reduced-motion: reduce`에서는 animation·smooth scroll을 제거하고 `다음 행동`을 노출합니다.
- 이름·학번·성적·신체 자료·실제 학급 자료·계정·순위·AI·센서·마이크·음성·외부 통신을 추가하지 않습니다.
- 학습용 수식·표·점도표는 `asset-safety.md`의 자동 교체 금지 대상이므로 생성 이미지로 대체하지 않습니다.

## Decision

계산·판정·라우팅·저장 로직은 보존하고, 승인된 교실 측정 노트 방향으로 프레젠테이션 계층만 교체합니다. 내부 comp·plate는 방향 검증 자료이며 런타임에 import하지 않습니다. 구현 후 `impeccable` detector와 한 번의 batched desktop/mobile review로 기계적·시각적 회귀를 확인합니다.

## Implementation review (2026-08-30)

- `AppShell`, 시작 화면, 미션 화면, 결과 화면을 semantic notebook shell로 연결했습니다. 실제 learner surface에서는 반복 kicker/eyebrow를 제거하고 질문·작업대·기록·다음 행동의 순서를 유지합니다.
- 균형 배송은 `처음 자료`와 `현재 작업대`를 나란히 보여 주며, `1개씩 옮기기`와 `합계 ÷ 자료 개수 = 평균` 힌트를 semantic DOM으로 제공합니다. 도메인 reducer·고정 자료·저장·판정 계약은 변경하지 않았습니다.
- 데스크톱 캡처는 1440×1680, 모바일 캡처는 390×3087이며 640px 이하에서 한 열로 재배치됩니다. 375px overflow 0, 키보드 경로, reduced-motion 정적 outline, update dialog focus를 Chromium에서 확인했습니다.
- Impeccable detector는 의도적인 `.box-pattern-grid` measurement tray gradient 한 건만 advisory로 보고했습니다. 새 notebook 규칙선·상태색은 토큰으로 연결했고, 컴포넌트 side stripe와 중복 장식은 제거했습니다.
- reference comp의 아이콘·raster tray·외부 display font를 복사하지 않았습니다. hero/responsive 비교는 semantic learner content와 comp topology 차이로 force 처리했으므로 최종 disposition은 `fix`이고 픽셀 동일성·배포 승인으로 해석하지 않습니다.
