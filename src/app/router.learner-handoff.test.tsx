import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSession } from '../domain/session';
import { completedBalanceStateWithTwoRetries, completedSession, renderAppAt, sessionWithThreeRequiredMissions } from '../test/fixtures';

describe('learning router handoff', () => {
  afterEach(cleanup);

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
    expect(screen.getByText('자료 A 평균 4, 자료 B 평균 4 / 자료 A 범위 0, 자료 B 범위 6')).toBeVisible();
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

    await user.click(screen.getByRole('radio', { name: '범위나 각 값을 함께 살펴봐야 해요.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(window.location.hash).toContain('/explain');
    expect(await screen.findByRole('heading', { name: '근거 문장을 완성해 볼까요?' })).toBeVisible();
  });

  it('connects saved evidence to the mission result and then starts the next required mission', async () => {
    const state = completedBalanceStateWithTwoRetries();
    const explainState = {
      ...state,
      activeRun: { ...state.activeRun!, stage: 'explain' as const },
    };
    const user = userEvent.setup();
    renderAppAt('#/mission/balance-delivery/balance-20-a/explain', explainState);

    await user.click(screen.getByRole('button', { name: '미션 결과 보기' }));
    expect(window.location.hash).toBe('#/mission/balance-delivery/balance-20-a/mission-result');
    expect(await screen.findByRole('heading', { name: '1. 골고루 나누기 결과' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: '활동 마치기' }));
    expect(window.location.hash).toBe('#/');
    expect(await screen.findByText('다음 미션: 2. 평균이 같아도 다를까요?')).toBeVisible();
  });

  it('returns to the missing mission when completion IDs lack its canonical attempt', async () => {
    const completeIdsButMissingAttempt = {
      ...completedSession(),
      attempts: sessionWithThreeRequiredMissions().attempts,
    };
    renderAppAt('#/', completeIdsButMissingAttempt);

    expect(await screen.findByText('다음 미션: 4. 평균만으로 괜찮을까요?')).toBeVisible();
    expect(screen.queryByRole('button', { name: '전체 결과 보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미션 시작' })).toBeVisible();
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
