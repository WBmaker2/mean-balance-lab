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

    const screenRegion = await screen.findByRole('region', { name: '평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?' });
    expect(screenRegion).toBeVisible();
    expect(screenRegion.closest('.worksheet-page')).not.toBeNull();
    expect(screen.getByRole('region', { name: '오늘의 목표' })).toBeVisible();
    expect(screen.getByRole('region', { name: /다음 미션/ })).toBeVisible();
    expect(screen.getByRole('group', { name: '자료 난이도' })).toBeVisible();
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /미션 시작/ })).toHaveClass('gi-pulse');
  });
});
