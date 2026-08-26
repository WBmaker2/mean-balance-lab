# Task 14 인쇄 결함 2차 수정 보고서

## RED: viewport 높이 변형 재현

기존 인쇄 테스트를 375×812와 375×3000 두 viewport로 확장하고, 교사용 요약이 두 높이에서 같은 인쇄 높이를 유지해야 한다는 assertion을 추가했습니다. 기존 CSS(`@media print`에 `#root` override 없음)에서 새 assertion이 실패했습니다.

- 375×812의 body/root 높이: 812px
- 375×3000의 body/root 높이: 3000px
- 높이 차이: 2,188px
- 새 failing assertion: `tallPrintExtent.bodyHeight - printExtent.bodyHeight <= 0`

이 결과는 `#root { min-height: 100vh }`가 인쇄 매체에도 적용되어 viewport 높이에 따라 빈 인쇄 공간을 만드는 것을 직접 증명합니다. 기존 단일 viewport의 `summaryHeight + 256` 검사는 제거했습니다. 해당 임의의 느슨한 threshold 대신 실제 CSS box 여유를 사용하도록 회귀 검사를 구성했습니다.

## 최소 수정

`src/styles/global.css`의 `@media print`에 다음 한 줄을 추가했습니다.

```css
#root { min-height: 0; }
```

화면 레이아웃과 다른 기능은 변경하지 않았습니다.

## GREEN 및 회귀 범위

인쇄 테스트는 두 viewport에서 각각 다음을 검증합니다.

- canonical completed results의 `교사용 활동 요약`과 요약 표가 visible
- 학생용 `.full-result` 직접 자식이 모두 `display: none`
- 요약 인쇄 버튼, 헤더, 푸터, 설정, 업데이트 trigger/dialog가 hidden
- body/root 높이가 요약 높이와 실제 shell box 여유의 합을 넘지 않음
- 812px와 3000px에서 body/root 높이가 동일하여 viewport height에 비례하지 않음

shell 여유는 테스트에서 실제 computed CSS 값인 `main` 세로 padding, `.full-result` padding/border, `.teacher-summary` 상단 margin을 합산해 계산합니다. 수정 후 두 viewport의 실측값은 body/root 635px, summary 502.625px, shell allowance 132px이며 `ceil(502.625 + 132) = 635`로 통과했습니다.

## 검증

- `CI=1 npm run test:e2e -- tests/e2e/responsive-motion.spec.ts` → 4 passed
- `CI=1 npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/responsive-motion.spec.ts` → 9 passed
- `npm test -- --run` → 19 files, 200 tests passed
- `npm run typecheck` → passed
- `npm run build` → passed
- `git diff --check` → passed
- `src`/`tests` TypeScript·TSX·CSS 파일 줄 수 확인 → 최대 480줄, 500줄 미만

패키지 설치, push, deploy는 수행하지 않았습니다. `progress.md`는 오케스트레이터 소유 파일이므로 변경·커밋하지 않았습니다.
