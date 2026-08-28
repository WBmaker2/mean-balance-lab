import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { completedBalanceStateWithTwoRetries, renderAppAt } from '../../test/fixtures';

describe('StartScreen learner copy', () => {
  afterEach(cleanup);

  it('uses the learner title for the next mission', async () => {
    renderAppAt('#/', completedBalanceStateWithTwoRetries());
    expect(await screen.findByText('다음 미션: 2. 평균이 같아도 다를까요?')).toBeVisible();
  });
});
