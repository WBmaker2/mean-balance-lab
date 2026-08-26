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

## Fix Round 2 — skip link inert 경계

### RED 증거

- 구현 전에 `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx`를 실행했습니다.
- 새 회귀 테스트가 기존 구조에서 실패했습니다. `#app-shell-content`가 바깥에 있던 `본문으로 건너뛰기` 링크를 포함하지 않아 `toContainElement` 검증이 실패했습니다.

### 최소 수정

- `src/app/AppShell.tsx`에서 `본문으로 건너뛰기` 링크를 `#app-shell-content` wrapper의 첫 자식으로 이동했습니다.
- dialog와 업데이트 내역 trigger는 wrapper 밖에 유지했습니다. 따라서 dialog가 열리면 skip link를 포함한 모든 일반 shell 컨트롤이 동일한 `inert`·`aria-hidden="true"` 경계에 들어가고, trigger/dialog 분리가 보존됩니다.
- 기존 `inert` property/attribute 처리와 `focusin` containment는 변경하지 않았습니다. 닫힘·Escape·재개방 시 cleanup 및 focus restoration 계약도 유지됩니다.

### 추가 검증

- `src/components/update/UpdateHistoryDialog.test.tsx`에 skip link가 inert 경계 안에 있는지, dialog open 시 경계 속성을 받는지, close 후 focus와 `#main-content` skip navigation이 복구되는지 검증하는 테스트를 추가했습니다.
- Focused: `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx` → 1 file, 15 tests passed.
- Full: `npm test -- --run` → 19 files, 199 tests passed.
- Typecheck: `npm run typecheck` passed.
- Build: `npm run build` passed; Vite production bundle generated successfully.
- Diff: `git diff --check` passed.
- Source line count: production/test TS·TSX 파일 중 최댓값은 `src/app/router.test.tsx` 480줄이며 500줄 미만입니다.
- package install, push, deploy는 실행하지 않았습니다.

### Fix Round 2 Commit

- `844bd80c2bd7829c3799a799aaec5bc321a3d671 fix: include skip link in modal boundary`

### Fix Round 2 상태

- re-review finding 해결: skip link가 modal inert boundary 안에 포함됩니다.
- close/Escape/StrictMode/reopen/focus restoration 및 skip navigation 회귀가 통과했습니다.

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

## Fix Round 3 — Chromium programmatic inert activation guard

### RED 증거

- `src/components/update/UpdateHistoryDialog.test.tsx`에 모달을 연 뒤 `skipLink.click()`과 inert 배경 버튼의 cancelable `click` 이벤트를 직접 실행하는 회귀 테스트를 먼저 추가했습니다.
- 구현 전 `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx`를 실행했고, 배경 버튼의 click handler가 1회 실행되어 `backgroundActivations`가 0이 아니므로 실패했습니다. Chromium의 native inert가 사용자 입력은 막아도 script-triggered `element.click()`을 막지 않는 경계를 재현한 것입니다.

### 최소 수정

- `src/components/update/UpdateHistoryDialog.tsx`의 열린 dialog effect에 capture-phase `click` listener를 추가했습니다.
- 이벤트 target이 `#app-shell-content` 배경 또는 `[inert]` 조상 안에 있으면 `preventDefault()`, `stopPropagation()`, `stopImmediatePropagation()`으로 배경의 사용자·프로그램 활성화를 모두 차단합니다.
- dialog 내부 닫기 버튼은 배경 경계 밖이므로 차단하지 않으며, effect cleanup에서 동일 listener와 capture 옵션으로 정확히 제거합니다. 기존 `focusin`, `keydown`, inert/aria 복원 동작은 그대로 유지했습니다.

### 검증

- Focused: `npm test -- --run src/components/update/UpdateHistoryDialog.test.tsx` → 1 file, 16 tests passed.
- Full: `npm test -- --run` → 19 files, 200 tests passed.
- Typecheck: `npm run typecheck` passed.
- Build: `npm run build` passed; Vite production bundle generated successfully.
- Diff: `git diff --check` passed.
- Source line count: production/test TS·TSX 파일 중 최댓값은 `src/app/router.test.tsx` 480줄이며 500줄 미만입니다.
- package install, push, deploy는 실행하지 않았습니다.

### Fix Round 3 Commit

- `6d2c787 fix: block inert background activation`

### Fix Round 3 상태

- re-review finding 해결: dialog open 중 skip link의 `click()`과 inert 배경 control의 dispatched click이 URL·handler·dialog 상태를 변경하지 않으며, close 후에는 skip navigation과 배경 버튼 활성화가 복구됩니다.
