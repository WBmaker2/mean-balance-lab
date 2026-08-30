import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { completedBalanceStateWithTwoRetries, renderAppAt } from '../../test/fixtures';

describe('StartScreen learner copy', () => {
  afterEach(cleanup);

  it('uses the learner title for the next mission', async () => {
    renderAppAt('#/', completedBalanceStateWithTwoRetries());
    expect(await screen.findByText('다음 미션: 2. 평균이 같아도 다를까요?')).toBeVisible();
  });

  it('separates the question, goals, next mission, difficulty, and one primary action', async () => {
    renderAppAt('#/');

    const screenRegion = await screen.findByRole('region', { name: '평균은 여러 값을 어떻게 나타내고, 값 하나가 달라지면 평균은 어떻게 달라질까요?' });
    expect(screenRegion).toBeVisible();
    expect(screenRegion.closest('.worksheet-page')).not.toBeNull();
    expect(screen.getByRole('region', { name: '오늘의 목표' })).toBeVisible();
    expect(screen.getByText('다음 행동: 자료를 고르고 미션 시작을 눌러요.')).toBeVisible();
    expect(screen.getByText('평균을 전체 양을 고르게 나눈 값으로 설명해 봐요.')).toBeVisible();
    expect(screen.getByText('자료의 합계와 개수로 평균을 구하고, 고르게 나눈 결과와 연결해 봐요.')).toBeVisible();
    expect(screen.getByText('평균이 같아도 자료의 모양이 다를 수 있음을 구분해 봐요.')).toBeVisible();
    expect(screen.getByText('평균의 도움과 한계를 근거와 함께 판단해 봐요.')).toBeVisible();
    expect(screen.getByRole('region', { name: /다음 미션/ })).toBeVisible();
    expect(screen.getByRole('group', { name: '자료 선택' })).toBeVisible();
    expect(screen.getByRole('radio', { name: '기본 자료' })).toBeVisible();
    expect(screen.getByRole('radio', { name: '도전 자료' })).toBeVisible();
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /미션 시작/ })).toHaveClass('gi-pulse');
  });
});
