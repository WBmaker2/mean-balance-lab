# Mean Balance Lab Redesign Asset Audit

## Audit date and scope

- 날짜: 2026-08-30 (Asia/Seoul)
- 조사 경로: `public/`, `src/`, CSS `background-image`·`url()` 및 JSX 이미지 참조
- 안전 기준: `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/references/asset-safety.md`

## Inventory

| 원본 | 역할 | 판정 | 새 파일 | 접근성·상태 | 롤백 |
|---|---|---|---|---|---|
| `public/favicon.svg` | 브라우저 탭 브랜드 아이콘 | 유지 | 없음 | 정보성 탭 아이콘; 기존 참조 유지; 확인 완료 | 기존 파일과 참조를 보존 |
| `.box-pattern-dots`, `.box-pattern-stripes`, `.box-pattern-grid`, `.box-pattern-waves` in `src/styles/components.css` | 균형 배송 상자를 색 이외의 무늬로 구분 | 유지 | 없음 | DOM label·번호·수량과 함께 사용; 확인 완료 | 새 CSS 토큰을 되돌려 기존 pattern 규칙 복구 |
| `src/components/shared/DotPlot.tsx` | 자료 분포를 DOM 점으로 표현 | 유지·자동 교체 금지 | 없음 | 수치·축 label이 정보이므로 이미지로 대체하지 않음; 확인 완료 | 기존 컴포넌트 렌더링 유지 |
| `assets/plates/paper-ground.png` | `impeccable` comp 검증용 paper-ground texture plate | 생성된 내부 검증 자산 | 런타임 미참조 | 장식 texture, alt 없음; prompt provenance 삽입·scan 0 missing | 앱에는 import하지 않으며 `.impeccable` 방향 산출물만 삭제 가능 |
| `.impeccable/mocks/mean-balance-notebook-*.png` | 방향 comp 3종 | 생성된 내부 검증 자산 | 런타임 미참조 | 사용자 화면에 노출하지 않음; 각 PNG에 prompt provenance 삽입 | source UI를 comp에 의존하지 않고 기존 semantic DOM으로 복귀 |
| 외부 이미지·CDN·실제 학생 사진 | 없음 | 자동 교체 금지·추가하지 않음 | 없음 | 새 claims·인물·기관·수식 raster 없음 | 해당 없음 |
| `src/assets/notebook/bench-illustration-v2.png` (Task 12) | 균형 배송 중앙 작업대의 빈 트레이·종이 분위기 장식 | 일반 장식·개념 일러스트; 수치·수식·자료를 전달하지 않음 | 생성됨·검토·코드 참조 갱신 완료 — 2026-08-30 `image_gen__imagegen`, 1896×830 PNG, `BalanceIllustration` 정적 import | `alt=""`, `aria-hidden="true"`; 초기·현재 수량은 DOM overlay; 확인 결과 읽을 수 있는 글자·숫자·로고 없음 | import와 wrapper만 제거하면 기존 CSS 작업대 참조로 복귀; 원본 생성 결과는 `/Users/kimhongnyeon/.codex/generated_images/01a03c53-257f-71e3-8846-ca25ac09f90c/exec-6b2ae3a2-2d99-4e94-bc6a-3dc9523fa449.png`에 보존 |

## Image generation decision

`imagegen`은 2026-08-30에 사용 가능했고 `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md`를 읽었습니다. `impeccable` comp-led 절차를 위해 `mean-balance-notebook-bench.png`, `mean-balance-notebook-spread.png`, `mean-balance-notebook-rail.png` 세 개의 방향 comp를 생성했습니다. 승인 comp의 paper-ground 한 조각은 `assets/plates/paper-ground.png`로 저장하고 `embed-prompt.mjs --scan assets/plates` 결과 `0 missing`을 확인했습니다. comp-spec의 paper-ground region은 최종적으로 `kind: "chrome"`, `medium: "semantic"`, `plate: null`로 기록해 CSS로 그린 ruled paper만 제품 계약으로 남겼습니다.

Task 12 승인에 따라 `imagegen`으로 빈 트레이·작업대 장식 자산을 생성했습니다. 프롬프트에는 초등 수학 노트 맥락, 따뜻한 아이보리 종이, 코발트 선, 정면 구도, 글자·숫자·수식·표·로고·사람·버튼 없음, 로컬 오버레이를 위한 넉넉한 빈 영역을 명시했습니다. 생성 결과 `bench-illustration-v2.png`(1896×830)를 `view_image`로 확인했고 읽을 수 있는 문자·수치·브랜드·오답을 유도하는 화살표가 없어 사용 승인했습니다. 평균 학습의 핵심인 수식·수치·표·점도표는 여전히 자동 생성·교체 금지 대상이며 DOM이 직접 전달합니다. `assets/plates/paper-ground.png`와 `.impeccable/mocks/*.png`는 방향·검토 증거로만 남고, 승인된 `src/assets/notebook/bench-illustration-v2.png`만 정적 번들 후보입니다.

## Safety and reference checks

- 외부 이미지 URL·CDN·추적 픽셀·원격 폰트를 추가하지 않습니다. 생성 자산은 로컬 정적 import 하나로 제한합니다.
- 내부 comp의 부정확한 한국어 글자·아이콘을 제품 코드에 복사하지 않고, 실제 `src/content` 값과 semantic control을 사용합니다.
- JSX `<img>`의 신규 런타임 참조는 `src/assets/notebook/bench-illustration-v2.png` 하나이며 외부 `http(s)`·CSS `url(`·`srcset`은 0건으로 확인했습니다. `assets/plates`와 `.impeccable`은 빌드 import 대상이 아닙니다. `dist/assets/bench-illustration-v2-DVepsdft.png` 생성과 27개 Chromium 테스트로 정적 로딩을 확인했습니다.
- 원본 자산을 삭제·덮어쓰지 않았습니다. 방향을 되돌릴 때는 새 token/CSS 변경만 revert하고 기존 favicon·pattern·DotPlot 참조를 복구합니다.
