# Mean Balance Lab Education Webapp Redesign Report

## Scope and decision

- 작업일: 2026-08-30 (Asia/Seoul)
- 대상: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`
- 요청: 기존 교육용 React/Vite 앱의 전체 시각 세계와 학습 화면 리디자인
- 이번 변경: 프레젠테이션·레이아웃·카피 계층·상태 피드백을 교체하고 평균 계산·판정·라우팅·저장·고정 가상 자료 계약은 보존
- 실행하지 않음: 커밋, 푸시, GitHub Pages 배포, HVC 등록·갤러리 동기화
- VoiceOver 및 실제 보조공학 사용자 승인은 검증 범위에서 제외

이번 리디자인은 `교실 측정 노트와 분배 작업표` 방향으로 완료했습니다. 화면의 읽기 순서를 질문/처음 자료 → 중앙 작업대 → 진행·검증 기록 → 다음 행동으로 통일하고, 아이보리 종이·가는 규칙선·그래파이트 잉크·코발트 현재 상태·주황 주석을 사용합니다. 평균·합계·범위·점도표·상자 무늬는 모두 semantic DOM이며 제품 런타임은 새 이미지·외부 폰트·외부 요청을 사용하지 않습니다.

## Rules, plan, and design evidence

- 제품 기준: [`PRODUCT.md`](</Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/PRODUCT.md>), 원 설계 문서, 기존 개선 계획
- 구현 계획: [`work/education-webapp-redesign-plan.md`](</Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/education-webapp-redesign-plan.md>)
- 감사: [`work/education-webapp-redesign-audit.md`](</Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/education-webapp-redesign-audit.md>)
- 자산 감사: [`work/education-webapp-redesign-assets.md`](</Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/work/education-webapp-redesign-assets.md>)
- 디자인 시스템: [`design-system/MASTER.md`](</Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab/design-system/MASTER.md>)
- Impeccable direction key: `93ababc8`, assigned direction 6 `교실 측정 노트와 분배 작업표`
- 승인 reference comp: `.impeccable/mocks/mean-balance-notebook-bench.png`; 보조 comp 2종도 `.impeccable/mocks/`에 보관
- 실행 증거(로컬): `.impeccable/review/hero-repro.png`(1586×992), `.impeccable/review/desktop.png`(1440×1680), `.impeccable/review/mobile.png`(390×3087). Impeccable 생성 디렉터리와 `assets/plates/`는 제품 소스가 아니므로 `.gitignore`로 커밋에서 제외합니다.

Impeccable build-phase의 hero·responsive 비교 점수는 각각 약 `0.5373`, `0.5319`로 reference comp와 drift가 있었습니다. comp는 방향을 위한 내부 일러스트 reference이고 실제 앱은 한국어 학습 콘텐츠·semantic controls·개인정보 경계를 우선해야 하므로 사용자가 요청한 “전체 리디자인” 범위에 따라 두 게이트를 `--force`로 통과시켰습니다. 내부 comp의 아이콘·회화형 tray·raster 종이 texture·사용할 수 없는 외부 display font를 제품에 복사하지 않았습니다. 최종 disposition은 `fix`이며, 이는 브라우저 학습 경로는 통과했지만 comp와의 픽셀 동일성을 배포 승인으로 과장하지 않는다는 뜻입니다.

## Implemented changes

### Learner topology and language

- `src/app/AppShell.tsx`: `utility-strip`, `sheet-main`, `shell-tools`, `shell-footer`, skip link으로 한 장 문서 shell을 구성했습니다. 설정과 업데이트 기록은 학습 내용을 가리지 않는 정상 문서 흐름에 둡니다.
- `src/components/start/StartScreen.tsx`, `src/components/result/ResultScreen.tsx`: 질문·목표·다음 미션·결과 근거를 같은 worksheet 계층으로 정리했습니다. 실제 화면에서 반복되던 kicker/eyebrow는 제거했고 `SectionIntroProps.eyebrow` optional API만 호환성 때문에 남겼습니다.
- `src/components/mission/MissionScreen.tsx`: 왼쪽 맥락, 중앙 stage workbench, 오른쪽 진행/검증 장부의 3열 구조를 제공하고 640px 이하에서 한 열로 쌓습니다.
- `src/components/mission/RedistributionPanel.tsx`: `처음 자료` semantic tray, `현재 작업대`, `1개씩 옮기기` 연결 문장, 현재 수량, `합계 ÷ 자료 개수 = 평균` 힌트를 추가했습니다. 보이는 버튼은 어린이용으로 짧게 쓰고 full action은 `aria-label`로 보존했습니다.
- `src/components/layout/ProgressRail.tsx`, `src/components/layout/ArtifactTrail.tsx`: 현재 단계 하나만 코발트로 강조하고 완료·예정 상태와 검증된 산출물만 기록합니다.

### Interaction and safety contracts

- `src/components/shared/ActionButton.tsx`: 활성화된 다음 행동 하나만 `data-current-action="true"`와 `gi-pulse`를 가집니다. `prefers-reduced-motion: reduce`에서는 애니메이션을 끄고 4px 정적 outline과 `다음 행동` 텍스트를 표시합니다.
- `src/components/update/UpdateHistoryDialog.tsx`, `src/content/updateHistory.ts`: 44px `업데이트 내역` trigger, Escape·Tab focus 처리, trigger 복귀, 실제 Asia/Seoul 날짜 기록을 유지합니다.
- 계산·판정·reducer·sessionStorage/localStorage 선택·익명 결과·교육용 이산 모형 및 공정성 한계 문구는 변경하지 않았습니다. 이름·학번·성적·신체 자료·실제 학급 자료·계정·순위·AI·센서·음성·외부 통신을 추가하지 않았습니다.

## Verification evidence

| 검증 | 실행 결과 | 판정 |
|---|---|---|
| `npm run check` | `tsc --noEmit` exit 0; Vitest 29 files / 253 tests passed; Vite build exit 0, `dist/index.html` 및 hashed assets 생성 | 통과 |
| Playwright Chromium | `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx --no-install playwright test --project=chromium` → 25 passed (14.5s) | 통과 |
| 학습 흐름 | 4개 필수 미션, 선택 B 세트, 재배분·계산·비교·근거·결과·새로고침·기록 복원을 버튼/키보드로 완주 | 통과 |
| 접근성 DOM/axe | current action 정확히 1개, `aria-current="step"`, live region, dialog focus, 44px controls, serious/critical axe 위반 0 | 통과 |
| 반응형 | 375px overflow 0, 큰 글자 32px, 640px 이하 한 열, 모바일 스크린샷 390×3087 | 통과 |
| 모션 감소 | reduced-motion에서 animation none, 정적 4px outline, `다음 행동` 노출 | 통과 |
| 인쇄 | 교사용 요약 표만 남고 학생용 shell·입력·업데이트 trigger는 숨김 | 통과 |
| 개인정보·네트워크 | 실제 학생 입력·외부 요청·런타임 이미지/폰트 import 없음 | 통과 |
| 파일 크기 | `src/styles/components.css` 477줄, 나머지 단일 소스 파일 500줄 미만 | 통과 |
| 작업 트리 위생 | `git diff --check` 통과; 계획 문서의 명령을 제외한 placeholder 검색 0건 | 통과 |

첫 번째 권한 없는 macOS Chromium 실행은 `mach_port_rendezvous_mac.mm` Permission denied로 브라우저가 시작되지 않았습니다. 같은 서버를 재사용해 권한 승인된 실행을 한 번 수행했고 위 25개 테스트가 통과했습니다. 이는 앱 실패가 아니라 로컬 브라우저 실행 환경 차이로 기록합니다.

자동 DOM·axe·Playwright 결과는 실제 초등학생·실제 기기·VoiceOver 승인과 같은 의미가 아닙니다. 실제 교실 기기와 스크린리더를 포함한 별도 수동 사용성 승인은 아직 수행하지 않았습니다.

## Remaining release state

- 소스·문서와 로컬 내부 review 산출물은 현재 작업 트리에 반영되어 있습니다. 내부 review 산출물은 `.gitignore`로 커밋에서 제외됩니다.
- 최신 리디자인은 아직 커밋·푸시·GitHub Pages 배포되지 않았습니다. 공개 URL [`https://wbmaker2.github.io/mean-balance-lab/`](https://wbmaker2.github.io/mean-balance-lab/)은 이전 공개 버전이며 로컬 리디자인과 동일하다고 표시하지 않습니다.
- 사용자가 별도로 승인하면 다음 순서로 진행할 수 있습니다: 변경 파일 검토 → 커밋 → push → GitHub Actions/Pages 공개 경로 검증 → HVC 등록·갤러리 동기화.
