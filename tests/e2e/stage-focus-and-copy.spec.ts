import { expect, test } from '@playwright/test';

test('moves focus to main when the learner enters the next stage', async ({ page }) => {
  await page.goto('./#/');
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();
  await page.getByRole('button', { name: '다음: 평균 예측', exact: true }).click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?', exact: true })).toBeVisible();
});

test('keeps the start screen free from draggable controls and duplicate current actions', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.locator('[data-current-action="true"]')).toHaveCount(1);
  await expect(page.locator('[draggable="true"]')).toHaveCount(0);
});
