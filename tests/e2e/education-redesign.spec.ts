import { expect, test } from '@playwright/test';

test('keeps the start screen focused on one clear next action', async ({ page }) => {
  await page.goto('./#/');

  await expect(page.getByRole('region', { name: '평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?' })).toBeVisible();
  await expect(page.getByRole('region', { name: '오늘의 목표' })).toBeVisible();
  await expect(page.getByRole('region', { name: /다음 미션/ })).toBeVisible();
  await expect(page.getByRole('group', { name: '자료 난이도' })).toBeVisible();
  await expect(page.locator('[data-current-action="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '미션 시작', exact: true })).toHaveClass(/gi-pulse/);
});

test('shows the current stage action and hands focus to the next stage', async ({ page }) => {
  await page.goto('./#/');
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();

  await expect(page.getByText('1/6 단계', { exact: true })).toBeVisible();
  await expect(page.getByText('현재 단계: 상황', { exact: true })).toBeVisible();
  await expect(page.locator('[data-stage="situation"]')).toHaveCount(1);
  await expect(page.locator('[data-current-action="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: '다음: 평균 예측', exact: true }).click();

  await expect(page).toHaveURL(/\/predict$/);
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByText('현재 단계: 예측', { exact: true })).toBeVisible();
  await expect(page.getByText('평균이 어떻게 될지 먼저 골라 봐요.', { exact: true })).toBeVisible();
});

test('keeps the update control in normal flow on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./#/');

  const trigger = page.getByRole('button', { name: '업데이트 내역' });
  const triggerBox = await trigger.boundingBox();
  const settingsBox = await page.locator('.app-settings').boundingBox();
  const footerBox = await page.locator('footer').boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(settingsBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(await trigger.evaluate((element) => getComputedStyle(element).position)).toBe('static');
  expect((triggerBox?.y ?? 0) >= (settingsBox?.y ?? 0) + (settingsBox?.height ?? 0)).toBe(true);
  expect((triggerBox?.y ?? 0) >= (footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('keeps the redesigned learner path local and button based', async ({ page }, testInfo) => {
  const externalRequests: string[] = [];
  const appOrigin = new URL(testInfo.project.use.baseURL ?? page.url()).origin;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== appOrigin) externalRequests.push(request.url());
  });

  await page.goto('./#/');
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();
  await expect(page.locator('[draggable="true"]')).toHaveCount(0);
  await expect(page.locator('button[data-current-action="true"]')).toHaveCount(1);
  expect(externalRequests).toEqual([]);
});
