import { expect, test } from '@playwright/test';
import { reachCalculationAndSubmitWrongCount } from './helpers/learner';

test('reload clears a wrong judgment but keeps completed evidence', async ({ page }) => {
  await reachCalculationAndSubmitWrongCount(page);
  await expect(page.getByText('자료는 몇 개인가요?', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('자료는 몇 개인가요?', { exact: true })).toHaveCount(0);
  await expect(page.getByText('예측: 평균 5', { exact: true })).toBeVisible();
  await expect(page.getByText('재배분: 5, 5, 5, 5', { exact: true })).toBeVisible();
});

test('direct and back navigation cannot expose a locked later stage', async ({ page }) => {
  await page.goto('/#/mission/balance-delivery/balance-20-a/explain');
  await expect(page).toHaveURL(/\/mission\/balance-delivery\/balance-20-a\/predict$/);
  await expect(page.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?', exact: true })).toBeVisible();
  await page.goto('/#/mission/balance-delivery/balance-20-a/explain');
  await expect(page).not.toHaveURL(/\/explain$/);
  await expect(page.getByRole('heading', { name: '근거 문장을 완성해 볼까요?', exact: true })).toHaveCount(0);

  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: '평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?', exact: true })).toBeVisible();
});
