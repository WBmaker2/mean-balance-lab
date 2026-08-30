import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDataset } from '../../content/missions';
import type { LabAction } from '../../domain/session';
import { PredictionPanel } from './PredictionPanel';

const renderPanel = (datasetId: Parameters<typeof getDataset>[0]) => {
  const dispatch = vi.fn<(action: LabAction) => void>();
  render(<PredictionPanel dataset={getDataset(datasetId)} prediction={undefined} dispatch={dispatch} onAdvance={vi.fn()} />);
  return dispatch;
};

describe('PredictionPanel', () => {
  afterEach(cleanup);

  it('offers natural-number predictions centered on the expected mean for balance', async () => {
    const dispatch = renderPanel('balance-20-a');
    expect(screen.getByRole('button', { name: '평균 4' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균 5' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균 6' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '평균이 커집니다' })).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: '평균 5' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_PREDICTION', value: 5 });
  });

  it('uses directional predictions only for outlier datasets', () => {
    renderPanel('outlier-5-a');
    expect(screen.getByRole('button', { name: '평균이 커집니다' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균이 작아집니다' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균이 같습니다' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '평균 5' })).not.toBeInTheDocument();
  });

  it('keeps exactly one enabled current action before and after a prediction', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    const { rerender } = render(
      <PredictionPanel dataset={getDataset('balance-20-a')} prediction={undefined} dispatch={vi.fn()} onAdvance={onAdvance} />,
    );

    const currentActions = () => screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true');
    expect(currentActions()).toHaveLength(1);
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다음 단계' })).toHaveAttribute('data-current-action', 'true');
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true' && button.textContent?.includes('평균')))
      .toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(onAdvance).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('먼저 평균을 예측해 보세요.');
    expect(currentActions()).toHaveLength(1);

    rerender(
      <PredictionPanel dataset={getDataset('balance-20-a')} prediction={5} dispatch={vi.fn()} onAdvance={onAdvance} />,
    );
    expect(currentActions()).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(currentActions()).toHaveLength(1);
  });

  it('does not style any prediction choice as a current action', () => {
    renderPanel('outlier-5-a');
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', '평균 변화 방향 예측');
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true'))
      .toHaveLength(1);
    expect(screen.getByRole('button', { name: '다음 단계' })).toHaveAttribute('data-current-action', 'true');
    expect(screen.getAllByRole('button', { name: /평균/ }).every((button) => button.dataset.currentAction !== 'true')).toBe(true);
  });

  it('keeps the selected prediction visibly identified after focus moves', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn<(action: LabAction) => void>();
    const { rerender } = render(
      <PredictionPanel dataset={getDataset('balance-20-a')} prediction={undefined} dispatch={dispatch} onAdvance={vi.fn()} />,
    );

    const selected = screen.getByRole('button', { name: '평균 5' });
    await user.click(selected);
    rerender(
      <PredictionPanel dataset={getDataset('balance-20-a')} prediction={5} dispatch={dispatch} onAdvance={vi.fn()} />,
    );

    const selectedAfterRerender = screen.getByRole('button', { name: '평균 5' });
    expect(selectedAfterRerender).toHaveAttribute('aria-pressed', 'true');
    expect(selectedAfterRerender).toHaveAttribute('data-selected', 'true');
    expect(selectedAfterRerender).toHaveClass('choice-selected');
  });

  it('uses short, actionable feedback after an outlier prediction', async () => {
    const user = userEvent.setup();
    const view = render(
      <PredictionPanel
        dataset={getDataset('outlier-5-a')}
        prediction={undefined}
        dispatch={vi.fn()}
        onAdvance={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '평균이 커집니다' }));
    view.rerender(
      <PredictionPanel
        dataset={getDataset('outlier-5-a')}
        prediction="increase"
        dispatch={vi.fn()}
        onAdvance={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      '바뀐 값이 커졌는지 작아졌는지 다시 살펴봐요. 합계와 평균의 숫자는 계산 단계에서 확인해요.',
    );
  });
});
