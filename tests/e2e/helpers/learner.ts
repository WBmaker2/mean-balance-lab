import { expect, type Page } from '@playwright/test';

export const startBalanceMission = async (page: Page) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: '미션 시작' }).click();
  await expect(page.getByRole('heading', { name: '상황을 살펴볼까요?' })).toBeVisible();
  await page.getByRole('button', { name: '다음: 평균 예측' }).click();
  await page.getByRole('button', { name: '평균이 같습니다' }).click();
  await page.getByRole('button', { name: '다음 단계' }).click();
  await expect(page.getByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?' })).toBeVisible();
};

const moveOne = async (page: Page, source: number, destination: number) => {
  await page.getByRole('button', { name: `${source}번 상자에서 1개 꺼내기` }).click();
  await page.getByRole('button', { name: `${destination}번 상자에 1개 넣기` }).click();
};

export const completeBalanceWithButtons = async (page: Page) => {
  await moveOne(page, 4, 1);
  await moveOne(page, 4, 1);
  await moveOne(page, 4, 1);
  await moveOne(page, 3, 2);
  await page.getByRole('button', { name: '고르게 나누기 확인' }).click();
};
