# Task 14 인쇄 결함 수정 보고서

## RED: 빈 인쇄 공간 재현

`tests/e2e/responsive-motion.spec.ts`의 교사용 인쇄 테스트에 인쇄 매체에서 `body`와 `#root` 높이가 교사용 요약 높이와 셸 여유 범위를 넘지 않는다는 assertion을 먼저 추가했습니다. 기존 CSS로 실행한 `CI=1 npm run test:e2e -- tests/e2e/responsive-motion.spec.ts`는 해당 assertion에서 실패했습니다.

- 교사용 요약 높이: 약 688px
- 기존 `body` 인쇄 scrollHeight: 2,985px
- 실패 결과: `Expected: <= 880`, `Received: 2985`

첫 샌드박스 실행은 macOS Chromium Mach-port 권한 오류로 브라우저가 시작되지 않았습니다. 승인된 로컬 브라우저 실행에서 위 RED 결과를 확인했습니다.

## 최소 구현

`src/styles/global.css`의 `@media print`에 다음 두 가지 수정만 적용했습니다.

- `.full-result > :not(.teacher-summary)`를 `display: none !important`로 처리하여 학생용 전체 결과, 미션 카드, 결과 액션이 인쇄 공간을 차지하지 않게 했습니다.
- `.teacher-summary`를 `position: static`으로 두어 교사용 제목과 근거 표가 정상 인쇄 flow에 남도록 했습니다.

기존의 body-wide visibility 격리와 header/footer/settings/update trigger/dialog 및 버튼 숨김 규칙은 유지했습니다. 회귀 테스트에는 교사용 제목·요약 표 가시성, 학생용 결과 직접 자식 제거, body/root 인쇄 높이 안정성 assertion을 추가했습니다.

## GREEN 및 필수 검증

- `CI=1 npm run test:e2e -- tests/e2e/responsive-motion.spec.ts` → 4 passed
- `npm test -- --run` → 19 files, 200 tests passed
- `npm run typecheck` → passed
- `npm run build` → passed
- `git diff --check` → passed

관련 소스·테스트·CSS 줄 수는 모두 500줄 미만입니다: `src/styles/global.css` 129줄, `src/styles/components.css` 105줄, `tests/e2e/responsive-motion.spec.ts` 94줄, `src/components/result/ResultScreen.tsx` 79줄, `src/components/result/TeacherSummary.tsx` 53줄.

패키지 설치, push, deploy는 수행하지 않았습니다. 최종 task-scoped 커밋 SHA는 작업 보고 메시지로 전달합니다.
