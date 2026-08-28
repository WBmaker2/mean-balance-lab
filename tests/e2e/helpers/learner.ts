import { expect, type Locator, type Page } from '@playwright/test';

type MissionId = 'balance-delivery' | 'mean-twins' | 'outlier-alert' | 'representative-review';
type DatasetId = 'balance-20-a' | 'balance-24-b' | 'twins-4-a' | 'twins-6-b' | 'outlier-5-a' | 'outlier-6-b' | 'review-cards-a' | 'review-baskets-b';

const missions: readonly MissionId[] = ['balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review'];
const missionTitles: Readonly<Record<MissionId, string>> = {
  'balance-delivery': '1. 골고루 나누기', 'mean-twins': '2. 평균이 같아도 다를까요?',
  'outlier-alert': '3. 한 값이 바뀌면?', 'representative-review': '4. 평균만으로 괜찮을까요?',
};
const requiredDatasets: Readonly<Record<MissionId, DatasetId>> = {
  'balance-delivery': 'balance-20-a', 'mean-twins': 'twins-4-a',
  'outlier-alert': 'outlier-5-a', 'representative-review': 'review-cards-a',
};
const situationValues: Readonly<Record<DatasetId, string>> = {
  'balance-20-a': '원자료: 2, 4, 6, 8', 'balance-24-b': '원자료: 1, 5, 7, 11',
  'twins-4-a': '자료 A: 4, 4, 4, 4 / 자료 B: 1, 3, 5, 7', 'twins-6-b': '자료 A: 6, 6, 6, 6 / 자료 B: 2, 4, 8, 10',
  'outlier-5-a': '변경 전: 4, 5, 5, 6 / 변경 후: 4, 5, 5, 10', 'outlier-6-b': '변경 전: 5, 6, 6, 7 / 변경 후: 5, 6, 6, 15',
  'review-cards-a': '자료: 2, 2, 2, 2, 12', 'review-baskets-b': '자료: 1, 1, 1, 9',
};
const expectedMeans: Readonly<Record<DatasetId, number>> = {
  'balance-20-a': 5, 'balance-24-b': 6, 'twins-4-a': 4, 'twins-6-b': 6,
  'outlier-5-a': 5, 'outlier-6-b': 6, 'review-cards-a': 4, 'review-baskets-b': 3,
};

const startNextDataset = async (page: Page, missionId: MissionId, datasetId: DatasetId) => {
  await page.goto('./#/');
  await expect(page.getByText(`다음 미션: ${missionTitles[missionId]}`, { exact: true })).toBeVisible();
  const challenge = datasetId.endsWith('-b');
  const difficulty = page.getByRole('radio', { name: challenge ? '도전(B 세트)' : '기본(A 세트)', exact: true });
  await expect(difficulty).toBeVisible();
  await difficulty.check();
  await expect(page.getByText(challenge ? '도전 자료로 시작' : '기본 자료로 시작', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();
  await expect(page.getByRole('heading', { name: '상황을 살펴볼까요?', exact: true })).toBeVisible();
  await expect(page.getByText(situationValues[datasetId], { exact: true })).toBeVisible();
};

const selectPrediction = async (page: Page, datasetId: DatasetId) => {
  const label = datasetId.startsWith('outlier-') ? '평균이 커집니다' : `평균 ${expectedMeans[datasetId]}`;
  await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('button', { name: '다음 단계', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
};

const moveOne = async (page: Page, source: number, destination: number) => {
  await page.getByRole('button', { name: `${source}번 상자에서 1개 꺼내기`, exact: true }).click();
  await page.getByRole('button', { name: `${destination}번 상자에 1개 넣기`, exact: true }).click();
};

export const startBalanceMission = async (page: Page): Promise<void> => {
  await page.goto('./#/');
  await expect(page.getByText('다음 미션: 1. 골고루 나누기', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: '기본(A 세트)', exact: true }).check();
  await page.getByRole('button', { name: '미션 시작', exact: true }).click();
  await expect(page.getByText(situationValues['balance-20-a'], { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다음: 평균 예측', exact: true }).click();
  await expect(page.getByRole('button', { name: '평균 5', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '평균 5', exact: true }).click();
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  await expect(page.getByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?', exact: true })).toBeVisible();
};

export const completeBalanceWithButtons = async (page: Page): Promise<void> => {
  for (const [source, destination] of [[4, 1], [4, 1], [4, 1], [3, 2]] as const) await moveOne(page, source, destination);
  await expect(page.getByText('현재 수량 5, 5, 5, 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '고르게 나누기 확인', exact: true }).click();
};

const calculationSection = (page: Page, heading: string): Locator =>
  page.getByRole('heading', { name: heading, exact: true }).locator('..');

const submitCalculation = async (page: Page, heading: string, total: number, count: number, average: number) => {
  const section = calculationSection(page, heading);
  await expect(section).toBeVisible();
  await section.getByRole('spinbutton', { name: '합계', exact: true }).fill(String(total));
  await section.getByRole('spinbutton', { name: '자료 개수', exact: true }).fill(String(count));
  await section.getByRole('spinbutton', { name: '평균', exact: true }).fill(String(average));
  await section.getByRole('button', { name: '계산 확인', exact: true }).click();
  await expect(section.getByText(new RegExp(`${total} ÷ ${count} = ${average}`))).toBeVisible();
};

const completeDataset = async (page: Page, missionId: MissionId, datasetId: DatasetId) => {
  await startNextDataset(page, missionId, datasetId);
  await page.getByRole('button', { name: '다음: 평균 예측', exact: true }).click();
  await selectPrediction(page, datasetId);

  if (datasetId.startsWith('balance-')) {
    const moves = datasetId === 'balance-20-a'
      ? [[4, 1], [4, 1], [4, 1], [3, 2]] as const
      : [[4, 1], [4, 1], [4, 1], [4, 1], [4, 1], [3, 2]] as const;
    for (const [source, destination] of moves) await moveOne(page, source, destination);
    const target = datasetId === 'balance-20-a' ? '5, 5, 5, 5' : '6, 6, 6, 6';
    await expect(page.getByText(`현재 수량 ${target}`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '고르게 나누기 확인', exact: true }).click();
    await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
    await submitCalculation(page, '현재 자료의 평균을 계산해 볼까요?', datasetId === 'balance-20-a' ? 20 : 24, 4, expectedMeans[datasetId]);
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  } else if (datasetId.startsWith('twins-')) {
    const total = datasetId === 'twins-4-a' ? 16 : 24;
    await expect(page.getByRole('heading', { name: '두 자료의 평균을 계산해 볼까요?', exact: true })).toBeVisible();
    await submitCalculation(page, '자료 A의 평균을 계산해 볼까요?', total, 4, expectedMeans[datasetId]);
    await submitCalculation(page, '자료 B의 평균을 계산해 볼까요?', total, 4, expectedMeans[datasetId]);
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
    await expect(page.getByText(datasetId === 'twins-4-a'
      ? '자료 A 평균 4, 자료 B 평균 4 / 자료 A 범위 0, 자료 B 범위 6'
      : '자료 A 평균 6, 자료 B 평균 6 / 자료 A 범위 0, 자료 B 범위 8', { exact: true })).toBeVisible();
    await page.getByRole('checkbox', { name: `두 자료의 평균은 모두 ${expectedMeans[datasetId]}입니다.`, exact: true }).check();
    await page.getByRole('checkbox', { name: '자료 B가 자료 A보다 더 흩어져 있습니다.', exact: true }).check();
    await page.getByRole('button', { name: '비교 확인', exact: true }).click();
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  } else if (datasetId.startsWith('outlier-')) {
    const beforeTotal = datasetId === 'outlier-5-a' ? 20 : 24;
    const afterTotal = datasetId === 'outlier-5-a' ? 24 : 32;
    const afterMean = datasetId === 'outlier-5-a' ? 6 : 8;
    await expect(page.getByRole('heading', { name: '변경 전과 후의 평균을 계산해 볼까요?', exact: true })).toBeVisible();
    await submitCalculation(page, '변경 전 자료의 평균을 계산해 볼까요?', beforeTotal, 4, expectedMeans[datasetId]);
    await submitCalculation(page, '변경 후 자료의 평균을 계산해 볼까요?', afterTotal, 4, afterMean);
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
    await expect(page.getByText(`합계 변화: ${beforeTotal} → ${afterTotal}`, { exact: false })).toBeVisible();
    await page.getByRole('button', { name: '변화 확인', exact: true }).click();
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  } else {
    const total = datasetId === 'review-cards-a' ? 20 : 12;
    const count = datasetId === 'review-cards-a' ? 5 : 4;
    await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
    await submitCalculation(page, '현재 자료의 평균을 계산해 볼까요?', total, count, expectedMeans[datasetId]);
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
    await expect(page.getByRole('heading', { name: '평균과 자료의 모습을 비교해 볼까요?', exact: true })).toBeVisible();
    await page.getByRole('radio', { name: '범위나 각 값을 함께 살펴봐야 합니다.', exact: true }).check();
    await page.getByRole('button', { name: '비교 확인', exact: true }).click();
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: '근거 문장을 완성해 볼까요?', exact: true })).toBeVisible();
  const evidence = datasetId.startsWith('balance-') ? '고르게 옮긴 결과와 합계 ÷ 개수를 함께 확인했어요.'
    : datasetId.startsWith('twins-') ? '두 자료의 평균은 같고 흩어진 정도는 달라요.'
      : datasetId.startsWith('outlier-') ? '합계 변화와 평균 변화를 연결했어요.' : null;
  if (evidence) await page.getByRole('radio', { name: evidence, exact: true }).check();
  else {
    await page.getByRole('checkbox', { name: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.', exact: true }).check();
    await page.getByRole('checkbox', { name: '범위와 각 값도 함께 봐야 합니다.', exact: true }).check();
  }
  await page.getByRole('button', { name: '근거 문장 완성', exact: true }).click();
  await expect(page.getByText('근거 문장을 저장했어요.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '미션 결과 보기', exact: true }).click();
  await expect(page.getByRole('heading', { name: `${missionTitles[missionId]} 결과`, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '내가 사용한 근거', exact: true })).toBeVisible();
};

export const completeRequiredDataset = async (page: Page, missionId: MissionId, datasetId: DatasetId): Promise<void> => {
  expect(requiredDatasets[missionId]).toBe(datasetId);
  await completeDataset(page, missionId, datasetId);
  await page.getByRole('button', { name: '활동 마치기', exact: true }).click();
  const index = missions.indexOf(missionId);
  if (index < missions.length - 1) await expect(page.getByText(`다음 미션: ${missionTitles[missions[index + 1]!]}`, { exact: true })).toBeVisible();
  else await expect(page.getByRole('button', { name: '전체 결과 보기', exact: true })).toBeVisible();
};

const reachChallenge = async (page: Page, datasetId: DatasetId) => {
  const missionId = datasetId.startsWith('balance-') ? 'balance-delivery'
    : datasetId.startsWith('twins-') ? 'mean-twins'
      : datasetId.startsWith('outlier-') ? 'outlier-alert' : 'representative-review';
  const index = missions.indexOf(missionId);
  for (let prior = 0; prior < index; prior += 1) {
    const priorMission = missions[prior]!;
    await page.goto('./#/');
    await expect(page.getByText(`다음 미션: ${missionTitles[priorMission]}`, { exact: true })).toBeVisible();
    await completeRequiredDataset(page, priorMission, requiredDatasets[priorMission]);
  }
  await startNextDataset(page, missionId, datasetId);
};

export const expectChallengeValues = async (page: Page, datasetId: DatasetId, values: readonly number[]): Promise<void> => {
  await reachChallenge(page, datasetId);
  await expect(page.getByText(situationValues[datasetId], { exact: true })).toBeVisible();
  await expect(page.getByText(values.join(', '), { exact: false })).toBeVisible();
};

export const expectTwinChallengeValues = async (page: Page, datasetId: DatasetId, left: readonly number[], right: readonly number[]): Promise<void> => {
  await reachChallenge(page, datasetId);
  await expect(page.getByText(`자료 A: ${left.join(', ')} / 자료 B: ${right.join(', ')}`, { exact: true })).toBeVisible();
};

export const expectOutlierChallengeValues = async (page: Page, datasetId: DatasetId, before: readonly number[], after: readonly number[]): Promise<void> => {
  await reachChallenge(page, datasetId);
  await expect(page.getByText(`변경 전: ${before.join(', ')} / 변경 후: ${after.join(', ')}`, { exact: true })).toBeVisible();
};

export const reachCalculationAndSubmitWrongCount = async (page: Page): Promise<void> => {
  await startBalanceMission(page);
  await completeBalanceWithButtons(page);
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
  const section = calculationSection(page, '현재 자료의 평균을 계산해 볼까요?');
  await expect(section).toBeVisible();
  await section.getByRole('spinbutton', { name: '합계', exact: true }).fill('20');
  await section.getByRole('spinbutton', { name: '자료 개수', exact: true }).fill('5');
  await section.getByRole('spinbutton', { name: '평균', exact: true }).fill('5');
  await section.getByRole('button', { name: '계산 확인', exact: true }).click();
  await expect(page.getByText('자료는 몇 개인가요?', { exact: false })).toBeVisible();
};

export const reachCalculationAndSubmitCorrect = async (page: Page): Promise<void> => {
  await startBalanceMission(page);
  await completeBalanceWithButtons(page);
  await expect(page.getByRole('heading', { name: '평균을 계산해 볼까요?', exact: true })).toBeVisible();
  const section = calculationSection(page, '현재 자료의 평균을 계산해 볼까요?');
  await section.getByRole('spinbutton', { name: '합계', exact: true }).fill('20');
  await section.getByRole('spinbutton', { name: '자료 개수', exact: true }).fill('4');
  await section.getByRole('spinbutton', { name: '평균', exact: true }).fill('5');
  await section.getByRole('button', { name: '계산 확인', exact: true }).click();
  await expect(section.getByRole('status').getByText('재배분한 값과 계산한 평균이 같아요.', { exact: true })).toBeVisible();
  await expect(section.getByLabel('평균 계산 방정식')).toBeVisible();
};
