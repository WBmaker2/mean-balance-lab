import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSession } from '../domain/session';
import { completedBalanceStateWithTwoRetries, completedSession, renderAppAt, sessionWithThreeRequiredMissions } from '../test/fixtures';

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

  it('opens calculation after a twin prediction while later stages stay locked', async () => {
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

    await user.click(screen.getByRole('button', { name: '평균 4' }));
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/calculate');
    expect(screen.getByRole('heading', { name: '두 자료의 평균을 계산해 볼까요?' })).toBeVisible();
    expect(screen.getAllByLabelText('합계')).toHaveLength(2);
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

  it('keeps the learner in redistribution after resetting the live simulation', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'redistribute' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [3, 4, 6, 7], undoStack: [[2, 4, 6, 8]],
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/redistribute', initialState);

    await user.click(screen.getByRole('button', { name: '처음 상태로 되돌리기' }));

    expect(window.location.hash).toContain('/redistribute');
    expect(screen.getByText('현재 수량 2, 4, 6, 8')).toBeVisible();
    expect(screen.getByRole('button', { name: '고르게 나누기 확인' })).toBeVisible();
  });

  it('hands a balanced redistribution off to calculation after confirmation', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'redistribute' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [],
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/redistribute', initialState);

    await user.click(screen.getByRole('button', { name: '고르게 나누기 확인' }));
    expect(window.location.hash).toContain('/calculate');
    expect(await screen.findByRole('heading', { name: '평균을 계산해 볼까요?' })).toBeVisible();
    expect(screen.getByLabelText('합계')).toBeVisible();
  });

  it('maps both twin datasets to separate calculation targets in sequence', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'mean-twins' as const,
        datasetId: 'twins-4-a' as const,
        stage: 'calculate' as const,
        artifacts: { prediction: { value: 'same' as const } },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/mean-twins/twins-4-a/calculate', initialState);
    const inputs = () => screen.getAllByRole('spinbutton') as HTMLInputElement[];

    expect(screen.getAllByLabelText('합계')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '계산 확인' })).toHaveLength(2);
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true')).toHaveLength(1);
    await user.type(inputs()[0]!, '16');
    await user.type(inputs()[1]!, '4');
    await user.type(inputs()[2]!, '4');
    await user.click(screen.getAllByRole('button', { name: '계산 확인' })[0]!);
    expect(screen.getAllByText(/16 ÷ 4 = 4/)).toHaveLength(2);
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true')).toHaveLength(1);
    expect(inputs()).toHaveLength(3);
    expect(inputs()[0]).toBeEnabled();
  });

  it('does not render an empty redistribution screen for a fresh deep link', async () => {
    renderAppAt('#/mission/balance-delivery/balance-20-a/redistribute', createInitialSession());

    expect(await screen.findByRole('heading', { name: '상황을 살펴볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/situation');
  });

  it('aligns an ahead calculation URL with a restored redistribution run', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'redistribute' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    renderAppAt('#/mission/balance-delivery/balance-20-a/calculate', initialState);

    expect(await screen.findByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/redistribute');
    expect(screen.getByRole('button', { name: '고르게 나누기 확인' })).toBeVisible();
  });

  it('keeps a restored calculate run on the calculation screen and accepts the answer', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/calculate', initialState);
    const inputs = screen.getAllByRole('spinbutton');
    await user.type(inputs[0]!, '20');
    await user.type(inputs[1]!, '4');
    await user.type(inputs[2]!, '5');
    await user.click(screen.getByRole('button', { name: '계산 확인' }));
    expect(screen.getAllByText(/20 ÷ 4 = 5/)).toHaveLength(2);
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeVisible();
  });

  it('routes an unconfirmed balanced run back to redistribution', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'redistribute' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: { initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [] },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    renderAppAt('#/mission/balance-delivery/balance-20-a/calculate', initialState);
    expect(await screen.findByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/redistribute');
  });

  it.each([
    '#/mission/balance-delivery/balance-20-a/calculate',
    '#/mission/balance-delivery/balance-20-a/redistribute',
  ])('recovers an internally inconsistent calculate run without a redirect loop (%s)', async (hash) => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          prediction: { value: 5 as const },
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [],
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    renderAppAt(hash, initialState);
    expect(await screen.findByText('자료를 찾지 못해 시작 화면으로 돌아왔어요.')).toBeVisible();
    expect(window.location.hash).toBe('#/');
    expect(screen.queryByRole('heading', { name: '평균을 계산해 볼까요?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '구슬을 고르게 옮겨 볼까요?' })).not.toBeInTheDocument();
  });

  it.each([
    '#/mission/balance-delivery/balance-20-a/mission-result',
    '#/mission/balance-delivery/balance-20-a/redistribute',
  ])('settles a complete mission-result run on the mission summary (%s)', async (hash) => {
    renderAppAt(hash, completedBalanceStateWithTwoRetries());
    expect(await screen.findByRole('heading', { name: '1. 골고루 나누기 결과' })).toBeVisible();
    expect(window.location.hash).toBe('#/mission/balance-delivery/balance-20-a/mission-result');
  });
});
