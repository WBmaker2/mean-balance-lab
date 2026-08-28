import { expect, test } from '@playwright/test';
import {
  completeRequiredDataset, expectChallengeValues, expectOutlierChallengeValues, expectTwinChallengeValues,
} from './helpers/learner';

test('completes all required missions without drag and shows evidence-first results', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') externalRequests.push(request.url());
  });

  await page.goto('./#/');
  await completeRequiredDataset(page, 'balance-delivery', 'balance-20-a');
  await completeRequiredDataset(page, 'mean-twins', 'twins-4-a');
  await completeRequiredDataset(page, 'outlier-alert', 'outlier-5-a');
  await completeRequiredDataset(page, 'representative-review', 'review-cards-a');

  await page.getByRole('button', { name: '전체 결과 보기', exact: true }).click();
  const evidenceHeadings = page.getByRole('heading', { name: '내가 사용한 근거', exact: true });
  await expect(evidenceHeadings).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) await expect(evidenceHeadings.nth(index)).toBeVisible();
  await expect(page.getByText('이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.', { exact: true })).toBeVisible();
  await expect(page.locator('[draggable="true"]')).toHaveCount(0);
  expect(externalRequests).toEqual([]);
});

test('opens the balance optional challenge with its exact values', async ({ page }) => {
  await expectChallengeValues(page, 'balance-24-b', [1, 5, 7, 11]);
});

test('opens the twins optional challenge with its exact values', async ({ page }) => {
  await expectTwinChallengeValues(page, 'twins-6-b', [6, 6, 6, 6], [2, 4, 8, 10]);
});

test('opens the outlier optional challenge with its exact values', async ({ page }) => {
  await expectOutlierChallengeValues(page, 'outlier-6-b', [5, 6, 6, 7], [5, 6, 6, 15]);
});

test('opens the representativeness optional challenge with its exact values', async ({ page }) => {
  await expectChallengeValues(page, 'review-baskets-b', [1, 1, 1, 9]);
});
