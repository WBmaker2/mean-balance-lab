# Task 13 Implementation Report

## 날짜 확인

- 콘텐츠 파일을 만들기 직전에 `TZ=Asia/Seoul date +%F`를 실행했습니다.
- 출력: `2026-08-26`
- 따라서 `UPDATE_HISTORY`에는 설계 문서의 두 literal 날짜를 그대로 기록했습니다.

## RED 증거

- 구현 전에 `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx`를 실행했습니다.
- `UpdateHistoryDialog.tsx`가 없어 Vite가 `Failed to resolve import "./UpdateHistoryDialog"`로 테스트 스위트를 로드하지 못했고, 테스트 0개에서 실패했습니다.
- 실패 원인이 새 업데이트 내역 데이터·대화상자 부재임을 확인한 뒤 최소 구현을 진행했습니다.

## 변경 파일과 인터페이스

- `src/content/updateHistory.ts`
  - `UpdateHistoryEntry`를 추가했습니다: `date: \`${number}-${number}-${number}\``, `category: '설계' | '개발' | '개선'`, `summary: string`.
  - 런타임 날짜 계산 없이 `UPDATE_HISTORY`를 두 개의 literal 날짜 항목으로 제공합니다.
- `src/components/update/UpdateHistoryDialog.tsx`
  - `UpdateHistoryDialog()`를 추가했습니다.
  - `UPDATE_HISTORY`를 정적 콘텐츠로 소비하고 `update-history-trigger`, `update-history-dialog`, `print-hidden` class hook을 제공합니다.
  - 실제 인쇄 미디어 규칙은 Task 14가 소유하도록 두고, trigger의 fixed 위치와 최소 44×44px 크기만 inline style로 보장합니다.
- `src/components/update/UpdateHistoryDialog.test.tsx`
  - 날짜 literal 2개, ARIA dialog 이름·modal·label 연결, semantic list, 초기 닫기 버튼 focus, Escape/버튼 닫기와 trigger focus 복원, Tab/Shift+Tab 순환, 반복 open/close, fixed/44px geometry, `gi-pulse`·current-action 비사용, AppShell 노출을 검증합니다.
- `src/app/AppShell.tsx`
  - 기존 저장 설정·결과 Outlet 흐름을 유지한 채 전역 shell에 `UpdateHistoryDialog`를 추가했습니다.

## Focus 및 접근성 동작

- 열기 직후 `닫기` 버튼에 focus를 둡니다.
- 열린 동안 document `keydown` listener가 Escape를 닫기 동작으로 처리하고, Tab/Shift+Tab이 dialog 내부 focusable 목록을 순환하도록 합니다.
- dialog 외부가 active 상태여도 다음 focus를 dialog 첫/마지막 항목으로 되돌려 배경으로 빠지지 않게 합니다.
- 닫힘 effect에서 trigger focus를 복원하며, listener cleanup은 effect cleanup으로 보장합니다.
- dialog는 조건부 렌더링되고 `role="dialog"`, `aria-modal="true"`, `aria-labelledby`와 고유 `h2` ID를 사용합니다.

## 검증

- Focused: `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx` → 1 file, 10 tests passed.
- Full: `npm test -- --run` → 19 files, 194 tests passed.
- Typecheck: `npm run typecheck` passed.
- Build: `npm run build` passed; Vite production bundle generated successfully.
- Diff: `git diff --check` passed.
- Source line count: production/test TS·TSX 파일 중 최댓값은 `src/app/router.test.tsx` 480줄이며 500줄 미만입니다.
- package install, push, deploy는 실행하지 않았습니다.

## Commit

- `7741d34b912dbcb17b44a2af8fa4c08d612ae48d feat: add accessible update history`

## 미해결

- 없음. 실제 `@media print` 규칙과 reduced-motion/global stylesheet 결합은 계획대로 Task 14의 범위입니다.

## Task 13 Fix Round 1 — 배경 inert와 강제 focus 회수

### RED 증거

- `src/components/update/UpdateHistoryDialog.test.tsx`에 AppShell 배경의 native `inert` 속성·프로퍼티, 강제 프로그램 focus의 dialog 회수, close/reopen/unmount 시 상태 복원을 검증하는 4개 테스트를 먼저 추가했습니다.
- 구현 전 `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx`를 실행했고, `#app-shell-content`가 없어 3개 테스트가 실패했으며 강제 focus는 배경 링크에 남았습니다.

### 최소 구현

- `src/app/AppShell.tsx`에서 header/main/settings/footer를 `#app-shell-content`로 묶어 update dialog와 분리했습니다.
- `src/components/update/UpdateHistoryDialog.tsx`에서 dialog가 열릴 때 배경 wrapper와 trigger의 기존 `inert`/`aria-hidden` 상태를 저장한 뒤 배경을 `inert`·`aria-hidden="true"`, trigger를 `inert`로 설정합니다.
- `focusin` 캡처 listener를 추가해 native inert가 없는 jsdom이나 프로그램 호출에서도 dialog 밖 focus를 닫기 버튼으로 즉시 회수합니다.
- close/Escape/reopen/unmount cleanup은 저장한 속성·프로퍼티를 복원한 뒤 기존 trigger focus restoration 순서를 유지합니다. jsdom의 native inert 미구현은 브라우저 기본값인 `false`로 정규화합니다.

### 검증

- `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx` → 1 file, 14 tests passed.
- `npm test -- --run` → 19 files, 197 tests passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- production/test TS·TSX 파일은 모두 500줄 미만이며, 최댓값은 기존 `src/app/router.test.tsx` 480줄입니다.
- package install, push, deploy는 실행하지 않았습니다.

### Commit

- `aacbe36eddb9516e3d62b5eb60ecf3e71af92007 fix: isolate update history modal focus`

### 미해결

- 없음. 실제 `@media print` 규칙과 reduced-motion/global stylesheet 결합은 계획대로 Task 14의 범위입니다.
