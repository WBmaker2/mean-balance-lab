import { expect, test } from '@playwright/test';
import { completeBalanceWithButtons, completeRequiredDataset, startBalanceMission } from './helpers/learner';

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
  const printViewports = [
    { width: 375, height: 812 },
    { width: 375, height: 3000 },
    { width: 1440, height: 900 },
  ] as const;
  await page.goto('/#/');
  await completeRequiredDataset(page, 'balance-delivery', 'balance-20-a');
  await completeRequiredDataset(page, 'mean-twins', 'twins-4-a');
  await completeRequiredDataset(page, 'outlier-alert', 'outlier-5-a');
  await completeRequiredDataset(page, 'representative-review', 'review-cards-a');
  await page.getByRole('button', { name: '전체 결과 보기', exact: true }).click();
  await expect(page).toHaveURL(/\/results$/);

  const extents: Array<{ bodyHeight: number; rootHeight: number; summaryHeight: number; shellAllowance: number; width: number }> = [];
  for (const viewport of printViewports) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.teacher-summary')).toBeVisible();
    await expect(page.getByRole('heading', { name: '교사용 활동 요약' })).toBeVisible();
    await expect(page.getByRole('region', { name: '교사용 요약 표' })).toBeVisible();
    const studentResultRemoved = await page.locator('.full-result > :not(.teacher-summary)').evaluateAll((elements) =>
      elements.length > 0 && elements.every((element) => getComputedStyle(element).display === 'none'));
    expect(studentResultRemoved).toBe(true);
    for (const selector of ['.teacher-summary-controls', 'header', 'footer', '.app-settings', '.update-history-trigger', '.update-history-dialog']) {
      await expect(page.locator(selector)).not.toBeVisible();
    }
    extents.push({ ...await page.evaluate(() => {
      const root = document.querySelector('#root');
      const main = document.querySelector('main');
      const result = document.querySelector('.full-result');
      const summary = document.querySelector('.teacher-summary');
      const mainStyle = main ? getComputedStyle(main) : null;
      const resultStyle = result ? getComputedStyle(result) : null;
      const summaryStyle = summary ? getComputedStyle(summary) : null;
      const px = (value: string | undefined) => Number.parseFloat(value ?? '0');
      const shellAllowance = mainStyle && resultStyle && summaryStyle
        ? px(mainStyle.paddingTop) + px(mainStyle.paddingBottom)
          + px(resultStyle.paddingTop) + px(resultStyle.paddingBottom)
          + px(resultStyle.borderTopWidth) + px(resultStyle.borderBottomWidth)
          + px(summaryStyle.marginTop)
        : 0;
      return {
        bodyHeight: document.body.scrollHeight,
        rootHeight: root?.scrollHeight ?? 0,
        summaryHeight: summary?.getBoundingClientRect().height ?? 0,
        shellAllowance,
      };
    }), width: viewport.width });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const tableRect = await page.locator('.teacher-summary table').boundingBox();
    const summaryRect = await page.locator('.teacher-summary').boundingBox();
    expect(tableRect).not.toBeNull();
    expect(summaryRect).not.toBeNull();
    expect((tableRect?.x ?? 0) + (tableRect?.width ?? 0)).toBeLessThanOrEqual((summaryRect?.x ?? 0) + (summaryRect?.width ?? 0) + 1);
  }
  const [shortPrintExtent, tallPrintExtent] = extents;
  for (const extent of extents) {
    const maxExtent = Math.ceil(extent.summaryHeight + extent.shellAllowance);
    expect(extent.bodyHeight).toBeLessThanOrEqual(maxExtent);
    expect(extent.rootHeight).toBeLessThanOrEqual(maxExtent);
  }
  expect(tallPrintExtent.bodyHeight).toBe(shortPrintExtent.bodyHeight);
  expect(tallPrintExtent.rootHeight).toBe(shortPrintExtent.rootHeight);
  expect(extents[2]?.width).toBe(1440);
});
