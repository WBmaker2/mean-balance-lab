# Task 16 report — 평균 균형 조정실 문서·MVP 검증

검증일: 2026-08-26 (Asia/Seoul)
기준 HEAD: `8657f1d test: cover all dataset prediction boundaries`

## RED → GREEN

- RED: `npm test -- src/content/documentation.test.ts` 실행 시 README가 없어 `ENOENT: no such file or directory, open '.../README.md'`로 실패했습니다. 계획의 문서 계약을 실제 부재 원인으로 확인했습니다.
- GREEN: `README.md` 작성 후 같은 명령이 `Test Files 1 passed, Tests 1 passed`를 보고했습니다.
- `src/content/documentation.test.ts`는 Vitest 변환 환경에서 `new URL(..., import.meta.url)`이 file URL이 되지 않는 문제를 피하기 위해 `process.cwd()` 기준으로 README를 읽고, Node 타입 reference를 파일에 선언했습니다. 패키지·lockfile은 변경하지 않았습니다.

## 구현 문서

- `README.md`: 학습 목표, 4개 미션, A/B 8개 고정 자료의 exact values, 로컬 명령, 키보드·접근성, 저장 범위와 개인정보 제외, 교육용 이산 모형 경계, MVP 제외, 업데이트 내역 정책, 현재 no remote/deploy 범위를 기록했습니다.
- `docs/qa/mvp-checklist.md`: Specification and Traceability 13행을 `요구사항 | 자동 검증 | 수동 확인 | 결과` 열로 기록하고, Completion Gate 16개를 각각 실제 명령·테스트 경로·viewport·관찰 증거와 함께 기록했습니다.
- `src/content/updateHistory.ts`: Asia/Seoul 현재 날짜의 두 literal 항목이 이미 정확하여 변경하지 않았습니다.
- `progress.md`: 변경하지 않았습니다.

## Full gate (계획 순서)

1. 사전 lockfile 증거: `shasum -a 256 package-lock.json` → `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력.
2. `npm ci`: 성공, 128 packages added, audited 129 packages, 0 vulnerabilities.
3. 사후 lockfile 증거: 같은 SHA-256 `d2c6cd586488c3d2134f0a02bab48b2ff0ce899d242565562d9c14c15ba2cbdd`; `git diff -- package-lock.json` 무출력.
4. `npm run typecheck`: 성공.
5. `npm test`: 23 test files passed, 227 tests passed.
6. `CI=1 npm run test:e2e`: 첫 sandbox 실행은 Chromium macOS `bootstrap_check_in ... Permission denied`로 18개 런치 실패. 승인된 권한으로 같은 명령을 재실행하여 18 passed.
7. `npm run build`: 성공. `dist/index.html`, `dist/assets/index-qWhS_shg.js`, `dist/assets/index-CW3jMkM3.css` 생성.
8. 개인정보 scan: `rg -n "이름|학번|성적|키|몸무게|학생.*순위" src`의 3 hit는 `src/domain/evaluation.ts`의 `시키는` 단어 일부가 걸린 주석 1건과 입력 label 부재를 확인하는 부정 테스트 2건입니다. 실제 입력·저장 필드·실존 인물 fixture는 없습니다.
9. production network scan: `rg -n "fetch\(|axios|analytics|gtag|firebase|openai|gemini" src` 무출력. 테스트 listener의 외부 요청 문자열도 production source에는 없습니다.
10. line count: `find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 wc -l` 결과 최대 480줄(`src/app/router.test.tsx`)로 모두 500줄 미만입니다.

## Built preview Chromium evidence

`npm run preview -- --host 127.0.0.1`로 빌드된 `dist`를 127.0.0.1:4173에 시작하고, `node /private/tmp/mean-preview-check.mjs`를 Chromium viewport 1280×800에서 실행했습니다. 읽기 전용으로 다음을 관찰했습니다.

- `document.title`: `평균 균형 조정실`.
- 시작 heading이 보이고, `미션 시작` 후 valid URL은 `http://127.0.0.1:4173/#/mission/balance-delivery/balance-20-a/situation`입니다.
- 새 브라우저 컨텍스트에서 later-stage `/explain` direct reload는 `/predict`로 guard되며 `평균을 먼저 예측해 볼까요?`가 표시됩니다.
- console error 0, page error 0, non-loopback requests `[]`.
- local hashed assets 2개: `index-qWhS_shg.js`, `index-CW3jMkM3.css`.
- 기존 canonical learner E2E에서 4개 A 미션·4개 B challenge·키보드·reload/history·print summary를 검증했습니다. `tests/e2e/responsive-motion.spec.ts`의 print 테스트는 교사용 요약만 visible임을 확인했습니다.
- preview 프로세스는 검증 후 Ctrl-C로 종료했습니다.

## Scope boundary

이번 결과는 로컬 문서·테스트·빌드·preview 검증입니다. 패키지 추가/버전 변경, `npm install`, remote, push, deploy, HVC 등록은 실행하지 않았습니다.
