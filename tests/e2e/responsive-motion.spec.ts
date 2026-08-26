import { expect, test } from '@playwright/test';
import { completeBalanceWithButtons, startBalanceMission } from './helpers/learner';

const completedState = {
  schemaVersion: 1,
  saveMode: 'device',
  activeRun: null,
  attempts: {
    'balance-20-a': { missionId: 'balance-delivery', datasetId: 'balance-20-a', selectedIds: ['redistribution-and-division'], sentence: '고르게 옮긴 결과, 전체 양 20을 자료 4개로 나누어 평균 5를 확인했어요.', level: 3, revisions: 0 },
    'twins-4-a': { missionId: 'mean-twins', datasetId: 'twins-4-a', selectedIds: ['same-mean-and-different-spread'], sentence: '두 자료의 평균은 4으로 같지만, 범위는 0과 6로 달라요.', level: 3, revisions: 0 },
    'outlier-5-a': { missionId: 'outlier-alert', datasetId: 'outlier-5-a', selectedIds: ['sum-change-and-mean-change'], sentence: '전체 양이 20에서 24로 4 늘고 평균이 5에서 6로 1 늘었어요.', level: 3, revisions: 0 },
    'review-cards-a': { missionId: 'representative-review', datasetId: 'review-cards-a', selectedIds: ['mean-use-and-limit', 'range-or-individual-values'], sentence: '평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.', level: 3, revisions: 0 },
  },
  completedRequiredMissions: ['balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review'],
} as const;

test('patterns are visible and labelled for every balance box', async ({ page }) => {
  await startBalanceMission(page);
  const boxes = page.locator('[class*="box-pattern-"]');
  await expect(boxes).toHaveCount(4);
  await expect(boxes.nth(0)).toHaveCSS('background-image', /gradient/);
  for (let index = 1; index <= 4; index += 1) {
    await expect(page.getByRole('heading', { name: `${index}번 상자` })).toBeVisible();
  }
});

test('large text keeps the page within the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const assertNoOverflow = async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  };
  await assertNoOverflow();
  await startBalanceMission(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  await assertNoOverflow();
  await completeBalanceWithButtons(page);
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  await assertNoOverflow();
});

test('visible interactive controls meet the 44px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await startBalanceMission(page);
  const undersized = await page.locator('button, input, select, summary, a').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    })
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    })
    .map((element) => ({ tag: element.tagName, text: element.textContent?.trim() })));
  expect(undersized).toEqual([]);
});

test('keeps teacher summary as the only visible print content', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate((state) => {
    sessionStorage.clear();
    localStorage.setItem('mean-balance-lab:device:v1', JSON.stringify(state));
  }, completedState);
  await page.reload();
  await page.goto('/#/results');
  await expect(page.getByRole('heading', { name: '교사용 활동 요약' })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.teacher-summary')).toBeVisible();
  await expect(page.getByRole('button', { name: '교사용 요약 인쇄' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '처음부터 다시' })).not.toBeVisible();
  await expect(page.locator('header')).not.toBeVisible();
});
