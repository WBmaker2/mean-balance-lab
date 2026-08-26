import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDataset } from '../../content/missions';
import type { OutlierDataset } from '../../domain/types';
import { ComparisonPanel } from './ComparisonPanel';
import { PredictionPanel } from './PredictionPanel';
import { OutlierDeltaPanel } from './OutlierDeltaPanel';

const renderOutlierDelta = (datasetId: 'outlier-5-a' | 'outlier-6-b' = 'outlier-5-a') => {
  const dataset = getDataset(datasetId) as OutlierDataset;
  const onConfirm = vi.fn();
  render(<OutlierDeltaPanel dataset={dataset} prediction={{ value: 'increase' }} onConfirm={onConfirm} />);
  return { onConfirm };
};

describe('OutlierDeltaPanel', () => {
  afterEach(cleanup);

  it.each([
    ['outlier-5-a', '합계 변화: 20 → 24, 4 증가', '평균 변화: 5 → 6, 1 증가'],
    ['outlier-6-b', '합계 변화: 24 → 32, 8 증가', '평균 변화: 6 → 8, 2 증가'],
  ] as const)('shows sum delta before mean delta for %s', (datasetId, sumText, meanText) => {
    renderOutlierDelta(datasetId);
    const sumNode = screen.getByText(sumText);
    const meanNode = screen.getByText(meanText);
    expect(sumNode.compareDocumentPosition(meanNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('connects the changed total across four values to the mean delta', () => {
    renderOutlierDelta('outlier-5-a');
    expect(screen.getByText('합계가 4 늘고 자료가 4개라서 평균은 1 늘었어요.')).toBeVisible();
    expect(screen.getByText('4 ÷ 4 = 1')).toBeVisible();
  });

  it('names the value as changed in a virtual dataset', () => {
    renderOutlierDelta('outlier-5-a');
    expect(screen.getByText(/가상 자료에서 바꾼 값/)).toBeVisible();
    expect(screen.queryByText(/실제 관측/)).not.toBeInTheDocument();
  });

  it('calls onConfirm from an ActionButton', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderOutlierDelta();
    await user.click(screen.getByRole('button', { name: '변화 확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps one enabled current action after a verified restore', () => {
    const dataset = getDataset('outlier-5-a') as OutlierDataset;
    render(
      <ComparisonPanel
        dataset={dataset}
        artifacts={{
          prediction: { value: 'increase' },
          calculations: {
            before: { target: 'before', total: 20, count: 4, average: 5, verified: true },
            after: { target: 'after', total: 24, count: 4, average: 6, verified: true },
          },
          comparison: { selectedIds: ['sum-changed-first', 'mean-changed-after'], verified: true },
        }}
        dispatch={() => undefined}
      />,
    );
    expect(screen.getAllByRole('button').filter(
      (button) => button.dataset.currentAction === 'true' && !(button as HTMLButtonElement).disabled,
    )).toHaveLength(1);
    expect(screen.queryByText(/틀렸습니다|다시 확인/)).not.toBeInTheDocument();
  });

  it('offers only the three direction choices and non-numeric guidance', () => {
    const dataset = getDataset('outlier-5-a') as OutlierDataset;
    render(<PredictionPanel dataset={dataset} prediction="decrease" dispatch={vi.fn()} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button', { name: '평균이 커집니다' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균이 작아집니다' })).toBeVisible();
    expect(screen.getByRole('button', { name: '평균이 같습니다' })).toBeVisible();
    expect(screen.getByText(/바꾼 값이 커졌는지 작아졌는지를 다시 살펴보세요/)).toBeVisible();
    expect(screen.queryByText(/20|24|5|6/)).not.toBeInTheDocument();
  });
});
