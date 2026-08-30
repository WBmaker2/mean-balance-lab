/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('documents every required local command and safety boundary', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
  for (const command of [
    'npm ci', 'npm run dev', 'npm run typecheck', 'npm test',
    'npm run test:e2e', 'npm run build', 'npm run preview -- --host 127.0.0.1',
  ]) expect(readme).toContain(command);
  for (const heading of [
    '## 학습 목표', '## 4개 미션과 고정 자료', '## 로컬 설치·실행·검증',
    '## 학습 흐름과 키보드 조작', '## 저장·개인정보·안전',
    '## MVP 범위와 제외 항목', '## 업데이트 내역 정책', '## 현재 운영 범위',
  ]) expect(readme).toContain(heading);
  for (const contract of [
    'A 세트는 필수 학습 경로', 'B 세트는 같은 개념을 다시 적용하는 선택 도전',
    'sessionStorage', 'localStorage', 'Tab', 'Enter', '업데이트 내역',
  ]) expect(readme).toContain(contract);
  for (const dataset of [
    '[2, 4, 6, 8]', '[5, 5, 5, 5]', '[1, 5, 7, 11]', '[6, 6, 6, 6]',
    '[4, 4, 4, 4]', '[1, 3, 5, 7]', '[6, 6, 6, 6]', '[2, 4, 8, 10]',
    '[4, 5, 5, 6]', '[4, 5, 5, 10]', '[5, 6, 6, 7]', '[5, 6, 6, 15]',
    '[2, 2, 2, 2, 12]', '[1, 1, 1, 9]',
  ]) expect(readme).toContain(dataset);
  expect(readme).toContain('서버·로그인·분석 추적·외부 AI API를 사용하지 않습니다.');
  expect(readme).toContain('이름, 학번, 성적, 키, 몸무게를 입력받거나 저장하지 않습니다.');
  expect(readme).toContain('이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.');
  expect(readme).toContain('현재 범위에 포함하지 않습니다.');
  expect(readme).toContain('2026-08-29 리디자인에서는 질문·목표·미션 행동을 카드 계층으로 나누고');
  expect(readme).toContain('2026-08-29 / 개선 / 학습 화면 계층과 모바일 행동 흐름 개선');
  expect(readme).toContain('2026-08-27 / 배포 / GitHub Pages 공개 배포 경로 정리');
  expect(readme).toContain('https://github.com/WBmaker2/mean-balance-lab');
  expect(readme).toContain('https://wbmaker2.github.io/mean-balance-lab/');
  expect(readme).toContain('.github/workflows/deploy-pages.yml');
});
