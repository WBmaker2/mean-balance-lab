import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { completeBalanceWithButtons, startBalanceMission } from './helpers/learner';

const tabTo = async (page: import('@playwright/test').Page, target: import('@playwright/test').Locator) => {
  for (let index = 0; index < 100; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab sequence did not reach the requested control');
};

test('has no serious axe violations and exposes one current action', async ({ page }) => {
  await page.goto('/#/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual([]);
  await expect(page.locator('[data-current-action="true"]')).toHaveCount(1);
});

test('completes the balance step at 375px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await startBalanceMission(page);
  await completeBalanceWithButtons(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('keeps one enabled prediction action through empty, feedback, and selected states', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();
  await page.getByRole('button', { name: '다음: 평균 예측', exact: true }).click();
  const currentActions = () => page.locator('[data-current-action="true"]');
  const next = page.getByRole('button', { name: '다음 단계', exact: true });

  await expect(currentActions()).toHaveCount(1);
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole('alert')).toHaveText('먼저 평균을 예측해 보세요.');
  await expect(page).toHaveURL(/\/predict$/);
  await expect(currentActions()).toHaveCount(1);

  await page.getByRole('button', { name: '평균 5', exact: true }).click();
  await expect(currentActions()).toHaveCount(1);
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page).toHaveURL(/\/redistribute$/);
  await expect(currentActions()).toHaveCount(1);
});

test.use({ reducedMotion: 'reduce' });
test('replaces pulse animation with border and next-action text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/');
  const action = page.locator('[data-current-action="true"]');
  await expect(action).toHaveCSS('animation-name', 'none');
  await expect(action.locator('.reduced-motion-next')).toBeVisible();
  await expect(action).toHaveCSS('outline-width', '4px');
});

test('supports keyboard-only balance flow with live updates and mission result', async ({ page }) => {
  await page.goto('/#/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const start = page.getByRole('button', { name: '미션 시작' });
  await tabTo(page, start);
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: '다음: 평균 예측' }));
  await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('button', { name: '평균 5' }));
  await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('button', { name: '다음 단계' }));
  await page.keyboard.press('Enter');

  const keyboardMove = async (source: number, destination: number) => {
    await tabTo(page, page.getByRole('button', { name: `${source}번 상자에서 1개 꺼내기` }));
    await page.keyboard.press('Enter');
    await tabTo(page, page.getByRole('button', { name: `${destination}번 상자에 1개 넣기` }));
    await page.keyboard.press('Space');
  };
  await keyboardMove(4, 1);
  await expect(page.getByRole('status')).toContainText('4번 상자에서 1개를 1번 상자로 옮겼어요');
  await tabTo(page, page.getByRole('button', { name: '마지막 이동 취소' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('마지막 이동을 취소했어요');
  for (const [source, destination] of [[4, 1], [4, 1], [4, 1], [3, 2]] as const) {
    await keyboardMove(source, destination);
  }
  await tabTo(page, page.getByRole('button', { name: '고르게 나누기 확인' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();

  for (const [label, value] of [['합계', '20'], ['자료 개수', '4'], ['평균', '5']] as const) {
    const field = page.getByRole('spinbutton', { name: label, exact: true });
    await tabTo(page, field);
    await page.keyboard.type(value);
  }
  await tabTo(page, page.getByRole('button', { name: '계산 확인' }));
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: '다음 단계' }));
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('radio', { name: /고르게 옮긴 결과와 합계/ }));
  await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('button', { name: '근거 문장 완성' }));
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: '미션 결과 보기' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '1. 균형 배송 결과' })).toBeVisible();
});

test('keeps update history focus inside the dialog and restores it on Escape', async ({ page }) => {
  await page.goto('/#/');
  const trigger = page.getByRole('button', { name: '업데이트 내역' });
  await tabTo(page, trigger);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: '업데이트 내역' });
  const close = dialog.getByRole('button', { name: '닫기' });
  await expect(close).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
