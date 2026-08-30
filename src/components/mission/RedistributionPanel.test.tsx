import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { RedistributionPanel } from './RedistributionPanel';
import { sessionReducer, type ActiveRun, createInitialSession } from '../../domain/session';
import type { BalanceDataset } from '../../domain/types';

const dataset: BalanceDataset = {
  kind: 'balance', id: 'balance-20-a', label: '기본 구슬 상자',
  context: '가상 포장 상자 네 개의 구슬을 고르게 나눕니다.',
  stages: ['situation', 'predict', 'redistribute', 'calculate', 'explain', 'mission-result'],
  expectedMean: 5, values: [2, 4, 6, 8], targetValues: [5, 5, 5, 5],
};

const makeRun = (values: readonly number[] = dataset.values): ActiveRun => ({
  missionId: 'balance-delivery', datasetId: dataset.id, stage: 'redistribute', revisions: 0,
  transientFeedback: null,
  artifacts: { redistribution: { initialValues: dataset.values, currentValues: values, undoStack: [] } },
});

const renderBalancePanel = (values = dataset.values) => {
  function Harness() {
    const [state, dispatch] = useReducer(sessionReducer, {
      ...createInitialSession(), activeRun: makeRun(values),
    });
    if (!state.activeRun) return null;
    return <RedistributionPanel dataset={dataset} run={state.activeRun} dispatch={dispatch} onAdvance={vi.fn()} />;
  }
  return render(<Harness />);
};

describe('RedistributionPanel', () => {
  afterEach(cleanup);

  it('moves one item using source and destination buttons and announces it', async () => {
    const user = userEvent.setup();
    renderBalancePanel();
    await user.click(screen.getByRole('button', { name: '4번 상자에서 1개 꺼내기' }));
    await user.click(screen.getByRole('button', { name: '1번 상자에 1개 넣기' }));
    expect(screen.getByText('현재 수량 3, 4, 6, 7')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      '4번 상자에서 1개를 1번 상자로 옮겼어요. 현재 수량 3, 4, 6, 7. 전체는 20개로 같아요.',
    );
  });

  it('undoes the latest successful move', async () => {
    const user = userEvent.setup();
    renderBalancePanel();
    await user.click(screen.getByRole('button', { name: '4번 상자에서 1개 꺼내기' }));
    await user.click(screen.getByRole('button', { name: '1번 상자에 1개 넣기' }));
    await user.click(screen.getByRole('button', { name: '마지막 이동 취소' }));
    expect(screen.getByText('현재 수량 2, 4, 6, 8')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('마지막 이동을 취소했어요. 전체는 20개로 같아요.');
  });

  it('disables empty sources and gives an actionable same-box prompt', async () => {
    const user = userEvent.setup();
    renderBalancePanel([0, 4, 6, 10]);
    expect(screen.getByRole('button', { name: '1번 상자에서 1개 꺼내기' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '2번 상자에서 1개 꺼내기' }));
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true'))
      .toHaveLength(1);
    await user.click(screen.getByRole('button', { name: '2번 상자에 1개 넣기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('같은 상자에서는 옮길 수 없어요.');
    expect(screen.getByRole('alert')).toHaveTextContent('다른 상자의 +1 버튼을 눌러 보세요.');
    expect(screen.getByText('현재 수량 0, 4, 6, 10')).toBeVisible();
    expect(screen.getByRole('button', { name: '마지막 이동 취소' })).toBeDisabled();
  });

  it('keeps an incorrect confirmation in one alert without duplicating status text', async () => {
    const user = userEvent.setup();
    renderBalancePanel();

    await user.click(screen.getByRole('button', { name: '고르게 나누기 확인' }));

    expect(screen.getByRole('alert')).toHaveTextContent('아직 상자 수가 같지 않아요.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '4번 상자에서 1개 꺼내기' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('marks exactly one enabled next action', () => {
    renderBalancePanel([5, 5, 5, 5]);
    const currentActions = screen.getAllByRole('button')
      .filter((button) => button.dataset.currentAction === 'true' && !(button as HTMLButtonElement).disabled);
    expect(currentActions).toHaveLength(1);
    expect(currentActions[0]).toHaveAccessibleName(/고르게 나누기 확인/);
  });

  it('keeps confirmation as the sole current action after selecting a source while balanced', async () => {
    const user = userEvent.setup();
    renderBalancePanel([5, 5, 5, 5]);
    await user.click(screen.getByRole('button', { name: '1번 상자에서 1개 꺼내기' }));
    const currentActions = screen.getAllByRole('button')
      .filter((button) => button.dataset.currentAction === 'true' && !(button as HTMLButtonElement).disabled);
    expect(currentActions).toHaveLength(1);
    expect(currentActions[0]).toHaveAccessibleName(/고르게 나누기 확인/);
  });

  it('keeps exactly one enabled recommendation through every source-selection state', async () => {
    const user = userEvent.setup();
    const currentActionCount = () => screen.getAllByRole('button')
      .filter((button) => button.dataset.currentAction === 'true' && !(button as HTMLButtonElement).disabled)
      .length;

    renderBalancePanel([2, 4, 6, 8]);
    expect(currentActionCount()).toBe(1);
    await user.click(screen.getByRole('button', { name: '2번 상자에서 1개 꺼내기' }));
    expect(currentActionCount()).toBe(1);
    await user.click(screen.getByRole('button', { name: '1번 상자에 1개 넣기' }));
    expect(currentActionCount()).toBe(1);

    cleanup();
    renderBalancePanel([1, 5, 5, 9]);
    await user.click(screen.getByRole('button', { name: '1번 상자에서 1개 꺼내기' }));
    expect(currentActionCount()).toBe(1);
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true')[0])
      .toHaveAccessibleName('2번 상자에 1개 넣기');

    cleanup();
    renderBalancePanel([5, 5, 5, 5]);
    expect(currentActionCount()).toBe(1);
  });

  it('shows the selected source before the learner chooses a destination', async () => {
    const user = userEvent.setup();
    renderBalancePanel();

    await user.click(screen.getByRole('button', { name: '4번 상자에서 1개 꺼내기' }));

    const source = screen.getByRole('button', { name: '4번 상자에서 1개 꺼내기' });
    expect(source).toHaveAttribute('aria-pressed', 'true');
    expect(source.closest('article')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByText('선택한 상자: 4번')).toBeVisible();
    expect(screen.getByText('먼저 꺼낼 상자를 골라요. 다음으로 넣을 상자를 골라요.')).toBeVisible();
  });
});
