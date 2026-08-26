import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSession } from '../domain/session';
import { renderAppAt } from '../test/fixtures';

describe('learning router', () => {
  afterEach(cleanup);

  it('redirects an unverified deep link to the first allowed stage', async () => {
    renderAppAt('#/mission/mean-twins/twins-4-a/compare');

    expect(await screen.findByRole('heading', { name: '평균을 먼저 예측해 볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/predict');
  });

  it('recovers from an unknown mission and shows the start message', async () => {
    renderAppAt('#/mission/not-a-mission/twins-4-a/predict');

    expect(await screen.findByText('자료를 찾지 못해 시작 화면으로 돌아왔어요.')).toBeVisible();
    expect(window.location.hash).toBe('#/');
  });

  it('keeps the prediction stage active while later stages are locked', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'mean-twins' as const,
        datasetId: 'twins-4-a' as const,
        stage: 'predict' as const,
        artifacts: {},
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/mean-twins/twins-4-a/predict', initialState);

    await user.click(screen.getByRole('button', { name: '평균이 같습니다' }));
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/predict');
    expect(screen.getByRole('heading', { name: '평균을 먼저 예측해 볼까요?' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: '평균이 커집니다' }));
    expect(screen.getByRole('button', { name: '평균이 커집니다' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens redistribution after a balance prediction while later stages stay locked', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'predict' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: { initialValues: [2, 4, 6, 8], currentValues: [2, 4, 6, 8], undoStack: [] },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/predict', initialState);

    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/redistribute');
    expect(screen.getByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?' })).toBeVisible();
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true'))
      .toHaveLength(1);
  });

  it('does not render an empty redistribution screen for a fresh deep link', async () => {
    renderAppAt('#/mission/balance-delivery/balance-20-a/redistribute', createInitialSession());

    expect(await screen.findByRole('heading', { name: '상황을 살펴볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/situation');
  });
});
