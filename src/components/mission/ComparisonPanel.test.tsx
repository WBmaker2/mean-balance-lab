import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { getDataset } from '../../content/missions';
import { createInitialSession, sessionReducer } from '../../domain/session';
import type { ReviewDataset, TwinDataset } from '../../domain/types';
import { ComparisonPanel } from './ComparisonPanel';

const dataset = getDataset('twins-4-a') as TwinDataset;

const renderTwinsComparison = (datasetId: 'twins-4-a' | 'twins-6-b' = 'twins-4-a') => {
  const twinDataset = getDataset(datasetId) as TwinDataset;
  function Harness() {
    const [state, dispatch] = useReducer(sessionReducer, {
      ...createInitialSession(),
      activeRun: {
        missionId: 'mean-twins', datasetId, stage: 'compare', revisions: 0,
        artifacts: {
          calculations: {
            left: {
              target: 'left', total: twinDataset.leftValues.reduce((a, b) => a + b, 0),
              count: twinDataset.leftValues.length, average: 0, verified: true,
            },
            right: {
              target: 'right', total: twinDataset.rightValues.reduce((a, b) => a + b, 0),
              count: twinDataset.rightValues.length, average: 0, verified: true,
            },
          },
        },
        transientFeedback: null,
      },
    });
    const run = state.activeRun;
    if (!run) return null;
    return <ComparisonPanel dataset={twinDataset} artifacts={run.artifacts} dispatch={dispatch} feedback={run.transientFeedback} />;
  }
  return render(<Harness />);
};

describe('ComparisonPanel', () => {
  afterEach(cleanup);

  it('shows exact domain-derived means and ranges before the plots', () => {
    renderTwinsComparison();

    expect(screen.getByText('자료 A 평균 4, 자료 B 평균 4 / 자료 A 범위 0, 자료 B 범위 6')).toBeVisible();
    const summary = screen.getByText('자료 A 평균 4, 자료 B 평균 4 / 자료 A 범위 0, 자료 B 범위 6');
    const plots = screen.getByRole('img', { name: '자료 A 점도표: 4, 4, 4, 4' });
    expect(summary.compareDocumentPosition(plots) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('img', { name: '자료 B 점도표: 1, 3, 5, 7' })).toBeVisible();
  });

  it('shows representative review values as a dot plot before the choice', () => {
    const representative = getDataset('review-cards-a') as ReviewDataset;
    render(
      <ComparisonPanel
        dataset={representative}
        artifacts={{}}
        dispatch={() => undefined}
      />,
    );

    expect(screen.getByRole('img', { name: '대표값 자료 점도표: 2, 2, 2, 2, 12' })).toBeVisible();
  });

  it('requires both same mean and different spread evidence', async () => {
    const user = userEvent.setup();
    renderTwinsComparison('twins-4-a');

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 평균은 모두 4예요.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    expect(screen.getByText('점들이 얼마나 흩어져 있는지도 살펴보세요.')).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: '자료 B가 자료 A보다 더 흩어져 있어요.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    expect(screen.getByText('평균은 같지만 자료의 모양은 다를 수 있어요.')).toBeVisible();
  });

  it('focuses the plot explanation for the same-shape misconception', async () => {
    const user = userEvent.setup();
    renderTwinsComparison();

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 모양은 같아요.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));

    expect(screen.getByText('평균이 같아도 각 값과 흩어진 정도는 다를 수 있어요.')).toBeVisible();
    expect(screen.getByRole('note', { name: '점도표 설명' })).toHaveFocus();
  });

  it('normalizes duplicate selected ids before dispatching and keeps one current action', async () => {
    const user = userEvent.setup();
    renderTwinsComparison();

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 평균은 모두 4예요.' }));
    await user.click(screen.getByRole('checkbox', { name: '자료 B가 자료 A보다 더 흩어져 있어요.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));

    const currentActions = screen.getAllByRole('button').filter(
      (button) => button.dataset.currentAction === 'true' && !(button as HTMLButtonElement).disabled,
    );
    expect(currentActions).toHaveLength(1);
  });

  it('restores a verified comparison safely without showing a retry', () => {
    function Restored() {
      return (
        <ComparisonPanel
          dataset={dataset}
          artifacts={{
            calculations: {
              left: { target: 'left', total: 16, count: 4, average: 4, verified: true },
              right: { target: 'right', total: 16, count: 4, average: 4, verified: true },
            },
            comparison: { selectedIds: ['same-mean', 'different-spread'], verified: true },
          }}
          dispatch={() => undefined}
        />
      );
    }
    render(<Restored />);
    expect(screen.getByText('평균은 같지만 자료의 모양은 다를 수 있어요.')).toBeVisible();
    expect(screen.queryByRole('button', { name: '비교 확인' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true'))
      .toHaveLength(1);
  });

  it('does not turn filtered-empty forged IDs into a verified comparison', () => {
    render(
      <ComparisonPanel
        dataset={dataset}
        artifacts={{
          calculations: {
            left: { target: 'left', total: 16, count: 4, average: 4, verified: true },
            right: { target: 'right', total: 16, count: 4, average: 4, verified: true },
          },
          comparison: { selectedIds: ['sum-changed-first'], verified: true },
        }}
        dispatch={() => undefined}
      />,
    );
    expect(screen.queryByText('평균은 같지만 자료의 모양은 다를 수 있어요.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비교 확인' })).toBeVisible();
  });
});
