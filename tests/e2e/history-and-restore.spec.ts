import { expect, test } from '@playwright/test';
import { reachCalculationAndSubmitCorrect, reachCalculationAndSubmitWrongCount, completeBalanceWithButtons, startBalanceMission } from './helpers/learner';

const readTabPayload = async (page: import('@playwright/test').Page) => page.evaluate(() => {
  const raw = sessionStorage.getItem('mean-balance-lab:tab:v1');
  return raw ? JSON.parse(raw) : null;
});

test('reload clears a wrong judgment but keeps completed evidence', async ({ page }) => {
  await reachCalculationAndSubmitWrongCount(page);
  await expect(page.getByText('다음 행동: 자료는 몇 개인가요?', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('자료는 몇 개인가요?', { exact: false })).toHaveCount(0);
  await expect(page.getByText('예측: 평균 5', { exact: true })).toBeVisible();
  await expect(page.getByText('재배분: 5, 5, 5, 5', { exact: true })).toBeVisible();
  await expect.poll(() => readTabPayload(page)).toMatchObject({ activeRun: { transientFeedback: null } });
  const payload = await readTabPayload(page);
  expect(payload?.activeRun?.transientFeedback).toBeNull();
});

test('reload clears a verified calculation and requires the form again', async ({ page }) => {
  await reachCalculationAndSubmitCorrect(page);
  await page.reload();
  await expect.poll(() => readTabPayload(page)).toMatchObject({
    activeRun: { transientFeedback: null, artifacts: { calculations: { current: { verified: false } } } },
  });
  const payload = await readTabPayload(page);
  expect(payload?.activeRun?.transientFeedback).toBeNull();
  expect(payload?.activeRun?.artifacts?.calculations?.current?.verified).toBe(false);
  await expect(page.getByText('계산이 맞아요.', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('평균 계산 방정식')).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: '합계', exact: true })).toBeVisible();
});

test('active calculation history returns to canonical calculate stage', async ({ page }) => {
  await startBalanceMission(page);
  await completeBalanceWithButtons(page);
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/mission\/balance-delivery\/balance-20-a\/calculate$/);
  await page.goto('./#/mission/balance-delivery/balance-20-a/explain');
  await expect(page).toHaveURL(/\/mission\/balance-delivery\/balance-20-a\/calculate$/);
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '근거 문장을 완성해 볼까요?', exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/mission\/balance-delivery\/balance-20-a\/calculate$/);
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '근거 문장을 완성해 볼까요?', exact: true })).toHaveCount(0);
});

test('direct navigation without a run cannot expose a locked later stage', async ({ page }) => {
  await page.goto('./#/mission/balance-delivery/balance-20-a/explain');
  await expect(page).toHaveURL(/\/mission\/balance-delivery\/balance-20-a\/predict$/);
  await expect(page.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?', exact: true })).toBeVisible();
  await page.goto('./#/mission/balance-delivery/balance-20-a/explain');
  await expect(page).not.toHaveURL(/\/explain$/);
  await expect(page.getByRole('heading', { name: '근거 문장을 완성해 볼까요?', exact: true })).toHaveCount(0);

  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: '평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?', exact: true })).toBeVisible();
});
