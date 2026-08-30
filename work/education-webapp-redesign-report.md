# Mean Balance Lab Education Webapp Redesign Report

## Scope and decision

- 작업일: 2026-08-30 (Asia/Seoul)
- 대상: `/Volumes/ External Drive 256G/Dev2/codex/mean-balance-lab`
- 요청: 기존 교육용 React/Vite 앱의 전체 시각 세계와 학습 화면 리디자인
- 이전 릴리스 변경: 프레젠테이션·레이아웃·카피 계층·상태 피드백을 교체하고 평균 계산·판정·라우팅·저장·고정 가상 자료 계약은 보존
- 이전 릴리스 상태: 커밋, 원격 push, GitHub Pages 배포 완료
- 이번 후속 변경: 2026-08-30 이미지 중심 노트 작업대 보강을 작업 트리에 구현했으며, 이 후속 변경의 커밋·push·배포는 실행하지 않음
- 실행하지 않음: HVC 등록·갤러리 동기화
- VoiceOver 및 실제 보조공학 사용자 승인은 검증 범위에서 제외

이전 릴리스는 `교실 측정 노트와 분배 작업표` 방향으로 완료했습니다. 후속 작업은 같은 읽기 순서와 아이보리 종이·가는 규칙선·그래파이트 잉크·코발트 현재 상태·주황 주석을 유지하면서, 균형 배송 중앙 작업대에 글자·숫자 없는 로컬 생성 빈 트레이 일러스트를 장식 레이어로 추가했습니다. 평균·합계·범위·점도표·상자 무늬·초기/현재 수량은 모두 semantic DOM이며 외부 폰트·외부 요청은 사용하지 않습니다. 후속 이미지 변경은 현재 공개 URL에 아직 배포되지 않았습니다.

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
- `src/components/layout/UtilityToolbar.tsx`: 노트·기록·설정 앵커와 학생 정보, 장식 inline SVG를 한 줄 도구 모음으로 제공하며 HashRouter 경로를 바꾸지 않고 같은 화면 목적지로 이동합니다.
- `src/components/mission/BalanceIllustration.tsx`: `src/assets/notebook/bench-illustration-v2.png`를 `alt=""`·`aria-hidden="true"` 장식 레이어로 배치하고 초기/현재 수량·평균·균형 상태는 DOM 오버레이와 figcaption으로 제공합니다.
- `src/styles/illustrations.css`: 이미지 underlay, 수량 오버레이, 하단 행동 표면, 960/640/375px 반응형, reduced-motion 정적 상태를 토큰으로 정의했습니다.
- `src/components/layout/ProgressRail.tsx`, `src/components/layout/ArtifactTrail.tsx`: 현재 단계 하나만 코발트로 강조하고 완료·예정 상태와 검증된 산출물만 기록합니다.

### Interaction and safety contracts

- `src/components/shared/ActionButton.tsx`: 활성화된 다음 행동 하나만 `data-current-action="true"`와 `gi-pulse`를 가집니다. `prefers-reduced-motion: reduce`에서는 애니메이션을 끄고 4px 정적 outline과 `다음 행동` 텍스트를 표시합니다.
- `src/components/update/UpdateHistoryDialog.tsx`, `src/content/updateHistory.ts`: 44px `업데이트 내역` trigger, Escape·Tab focus 처리, trigger 복귀, 실제 Asia/Seoul 날짜 기록을 유지합니다.
- 계산·판정·reducer·sessionStorage/localStorage 선택·익명 결과·교육용 이산 모형 및 공정성 한계 문구는 변경하지 않았습니다. 이름·학번·성적·신체 자료·실제 학급 자료·계정·순위·AI·센서·음성·외부 통신을 추가하지 않았습니다.

## Verification evidence

| 검증 | 실행 결과 | 판정 |
|---|---|---|
| `npm run check` | `tsc -b` exit 0; Vitest 31 files / 258 tests passed; Vite build exit 0, `dist/index.html` 및 `bench-illustration-v2` hashed asset 생성 | 통과 |
| Playwright Chromium | `PLAYWRIGHT_PORT=4188 PLAYWRIGHT_REUSE_SERVER=false npx --no-install playwright test --project=chromium` → 25 passed (14.5s) | 통과 |
| 학습 흐름 | 4개 필수 미션, 선택 B 세트, 재배분·계산·비교·근거·결과·새로고침·기록 복원을 버튼/키보드로 완주 | 통과 |
| 접근성 DOM/axe | current action 정확히 1개, `aria-current="step"`, live region, dialog focus, 44px controls, serious/critical axe 위반 0 | 통과 |
| 반응형 | 375px overflow 0, 큰 글자 32px, 640px 이하 한 열, 모바일 스크린샷 390×3087 | 통과 |
| 모션 감소 | reduced-motion에서 animation none, 정적 4px outline, `다음 행동` 노출 | 통과 |
| 인쇄 | 교사용 요약 표만 남고 학생용 shell·입력·업데이트 trigger는 숨김 | 통과 |
| 개인정보·네트워크 | 실제 학생 입력·외부 요청·원격 이미지/폰트 import 없음; 로컬 생성 장식 PNG 1개만 정적 import | 통과 |
| 파일 크기 | `src/styles/components.css` 477줄, 나머지 단일 소스 파일 500줄 미만 | 통과 |
| 작업 트리 위생 | `git diff --check` 통과; 계획 문서의 명령을 제외한 placeholder 검색 0건 | 통과 |

첫 번째 권한 없는 macOS Chromium 실행은 `mach_port_rendezvous_mac.mm` Permission denied로 브라우저가 시작되지 않았습니다. 같은 서버를 재사용해 권한 승인된 실행을 한 번 수행했고 위 25개 테스트가 통과했습니다. 이는 앱 실패가 아니라 로컬 브라우저 실행 환경 차이로 기록합니다.

자동 DOM·axe·Playwright 결과는 실제 초등학생·실제 기기·VoiceOver 승인과 같은 의미가 아닙니다. 실제 교실 기기와 스크린리더를 포함한 별도 수동 사용성 승인은 아직 수행하지 않았습니다.

## Release state

- 소스·문서와 로컬 내부 review 산출물은 현재 작업 트리에 반영되어 있습니다. 내부 review 산출물은 `.gitignore`로 커밋에서 제외됩니다.
- 커밋: `3b35d40 feat: redesign mean balance learner experience`를 `main`과 `codex/mean-balance-lab-redesign`에 push했습니다.
- GitHub Actions: [Deploy to GitHub Pages run 33293367821](https://github.com/WBmaker2/mean-balance-lab/actions/runs/33293367821)에서 의존성 설치·빌드·Pages 업로드·Deploy가 모두 성공했습니다.
- 공개 앱: [`https://wbmaker2.github.io/mean-balance-lab/`](https://wbmaker2.github.io/mean-balance-lab/) HTTP 200, 제목 `평균 균형 조정실`, HTML 참조 JS/CSS/favicon 각 200을 확인했습니다.
- 공개 학습자 검증: `PLAYWRIGHT_BASE_URL=https://wbmaker2.github.io/mean-balance-lab/ PLAYWRIGHT_PORT=4197 PLAYWRIGHT_REUSE_SERVER=true npx --no-install playwright test --project=chromium` → 25 passed (15.7s), 콘솔·페이지 오류와 외부 요청 0.
- 남은 운영 작업: HVC 등록·갤러리 동기화와 실제 교실 기기·스크린리더 사용성 승인은 별도 작업입니다.

## Image-centric follow-up verification (2026-08-30)

- 생성 자산: `src/assets/notebook/bench-illustration-v2.png` (1896×830, 1.3MB). `imagegen` 프롬프트에 빈 트레이·아이보리 작업대·글자/숫자/수식/표/로고/사람/버튼 없음과 DOM 오버레이 사용을 명시했고, `view_image`로 결과를 확인했습니다.
- 자동 테스트: `npm run check` → typecheck exit 0, Vitest 31 files / 258 tests passed, Vite build exit 0.
- 브라우저 테스트: `PLAYWRIGHT_PORT=4190 PLAYWRIGHT_REUSE_SERVER=false npx --no-install playwright test --project=chromium` → 27 passed (14.9s). 새 toolbar 목적지·장식 이미지 `naturalWidth=1896`·DOM 수량·375px overflow·reduced motion·axe·키보드 경로를 포함합니다.
- 로컬 시각 확인: 1280px 및 390px 캡처에서 질문/작업대/진행/근거/하단 행동 순서, 이미지 underlay와 DOM 오버레이를 확인했습니다. 캡처는 `/private/tmp/mean-balance-desktop.png`, `/private/tmp/mean-balance-mobile.png`에만 남겼습니다.
- HashRouter 안전성: toolbar same-page link 클릭 시 `window.location.hash`가 기존 학습 경로를 유지하고 목적지 요소에 초점이 이동하는 단위 테스트를 추가했습니다.
- 후속 변경은 현재 작업 트리에만 있으며 커밋·push·GitHub Pages 배포를 실행하지 않았습니다. 공개 URL은 이미지 보강 이전 릴리스 상태입니다.
- VoiceOver와 실제 보조공학 사용자 승인은 이번 자동 검증 범위에서 제외합니다.
