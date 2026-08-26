import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSession } from '../domain/session';
import { completedBalanceStateWithTwoRetries, renderAppAt } from '../test/fixtures';

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

    await user.click(screen.getByRole('button', { name: '평균이 같습니다' }));
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
    expect(screen.getAllByText('16 ÷ 4 = 4')).toHaveLength(2);
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
    expect(screen.getAllByText('20 ÷ 4 = 5')).toHaveLength(2);
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
    expect(await screen.findByRole('heading', { name: '1. 균형 배송 결과' })).toBeVisible();
    expect(window.location.hash).toBe('#/mission/balance-delivery/balance-20-a/mission-result');
  });

  it('opens a verified twin compare run with calculations before the plots', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'mean-twins' as const,
        datasetId: 'twins-4-a' as const,
        stage: 'compare' as const,
        artifacts: {
          prediction: { value: 'same' as const },
          calculations: {
            left: { target: 'left' as const, total: 16, count: 4, average: 4, verified: true },
            right: { target: 'right' as const, total: 16, count: 4, average: 4, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    renderAppAt('#/mission/mean-twins/twins-4-a/compare', initialState);
    expect(await screen.findByRole('heading', { name: '평균 쌍둥이 자료를 비교해 볼까요?' })).toBeVisible();
    expect(window.location.hash).toBe('#/mission/mean-twins/twins-4-a/compare');
    expect(screen.getByText('평균 4·4 / 범위 0·6')).toBeVisible();
  });

  it('advances only after both twin calculations are verified', async () => {
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
    const fillCalculation = async (total: string, count: string, average: string) => {
      const inputs = screen.getAllByRole('spinbutton');
      await user.type(inputs[0]!, total);
      await user.type(inputs[1]!, count);
      await user.type(inputs[2]!, average);
      await user.click(screen.getAllByRole('button', { name: '계산 확인' })[0]!);
    };

    await fillCalculation('16', '4', '4');
    expect(window.location.hash).toContain('/calculate');
    await fillCalculation('16', '4', '4');
    await user.click(screen.getByRole('button', { name: '다음 단계' }));

    expect(window.location.hash).toContain('/compare');
    expect(await screen.findByRole('heading', { name: '평균 쌍둥이 자료를 비교해 볼까요?' })).toBeVisible();
  });

  it('opens outlier comparison only after before and after calculations are verified', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'outlier-alert' as const,
        datasetId: 'outlier-5-a' as const,
        stage: 'calculate' as const,
        artifacts: { prediction: { value: 'increase' as const } },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/outlier-alert/outlier-5-a/calculate', initialState);
    const fill = async (total: string, average: string) => {
      const inputs = screen.getAllByRole('spinbutton');
      await user.type(inputs[0]!, total);
      await user.type(inputs[1]!, '4');
      await user.type(inputs[2]!, average);
      await user.click(screen.getAllByRole('button', { name: '계산 확인' })[0]!);
    };
    await fill('20', '5');
    await fill('24', '6');
    expect(window.location.hash).toContain('/calculate');
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/compare');
    expect(await screen.findByRole('heading', { name: '합계 변화와 평균 변화를 살펴볼까요?' })).toBeVisible();
  });

  it('offers the representative comparison handoff after a verified calculation', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'representative-review' as const,
        datasetId: 'review-cards-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          prediction: { value: 4 as const },
          calculations: { current: { target: 'current' as const, total: 20, count: 5, average: 4, verified: true } },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    renderAppAt('#/mission/representative-review/review-cards-a/calculate', initialState);
    expect(await screen.findByLabelText('평균 계산 방정식')).toHaveTextContent('20 ÷ 5 = 4');
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeVisible();
  });

  it('hands representative review from calculation to compare and then explain', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'representative-review' as const,
        datasetId: 'review-cards-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          prediction: { value: 4 as const },
          calculations: { current: { target: 'current' as const, total: 20, count: 5, average: 4, verified: true } },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/representative-review/review-cards-a/calculate', initialState);
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/compare');
    expect(await screen.findByRole('heading', { name: '평균과 자료의 모습을 비교해 볼까요?' })).toBeVisible();

    await user.click(screen.getByRole('radio', { name: '범위나 각 값을 함께 살펴봐야 합니다.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/explain');
    expect(await screen.findByRole('heading', { name: '근거 문장을 완성해 볼까요?' })).toBeVisible();
  });

  it('hands a verified balance calculation directly to explain', async () => {
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
          calculations: { current: { target: 'current' as const, total: 20, count: 4, average: 5, verified: true } },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/calculate', initialState);
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/explain');
    expect(await screen.findByRole('heading', { name: '근거 문장을 완성해 볼까요?' })).toBeVisible();
  });

  it('does not let an explain deep link bypass the current calculation or comparison stage', async () => {
    const calculationState = {
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
    renderAppAt('#/mission/balance-delivery/balance-20-a/explain', calculationState);
    expect(await screen.findByRole('heading', { name: '평균을 계산해 볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/calculate');
  });

  it('recovers an old-revision evidence mission-result deep link instead of opening results', async () => {
    const initialState = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'representative-review' as const,
        datasetId: 'review-cards-a' as const,
        stage: 'mission-result' as const,
        artifacts: {
          calculations: {
            current: { target: 'current' as const, total: 20, count: 5, average: 4, verified: true },
          },
          evidence: {
            missionId: 'representative-review' as const,
            datasetId: 'review-cards-a' as const,
            selectedIds: ['mean-use-and-limit'] as const,
            sentence: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.',
            level: 2 as const,
            revisions: 0,
          },
        },
        revisions: 1,
        transientFeedback: null,
      },
    };
    renderAppAt('#/mission/representative-review/review-cards-a/mission-result', initialState);
    expect(await screen.findByText('자료를 찾지 못해 시작 화면으로 돌아왔어요.')).toBeVisible();
    expect(window.location.hash).toBe('#/');
    expect(screen.queryByRole('heading', { name: '전체 결과' })).not.toBeInTheDocument();
  });
});
