import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { getDataset } from '../../content/missions';
import { createInitialSession, sessionReducer } from '../../domain/session';
import type { TwinDataset } from '../../domain/types';
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

    expect(screen.getByText('평균 4·4 / 범위 0·6')).toBeVisible();
    const summary = screen.getByText('평균 4·4 / 범위 0·6');
    const plots = screen.getByRole('img', { name: '자료 A 점도표: 4, 4, 4, 4' });
    expect(summary.compareDocumentPosition(plots) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('img', { name: '자료 B 점도표: 1, 3, 5, 7' })).toBeVisible();
  });

  it('requires both same mean and different spread evidence', async () => {
    const user = userEvent.setup();
    renderTwinsComparison('twins-4-a');

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 평균은 모두 4입니다.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    expect(screen.getByText('점들이 얼마나 퍼져 있는지도 살펴보세요.')).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: '자료 B가 자료 A보다 더 퍼져 있습니다.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));
    expect(screen.getByText('평균은 같지만 자료의 모양은 다를 수 있어요.')).toBeVisible();
  });

  it('focuses the plot explanation for the same-shape misconception', async () => {
    const user = userEvent.setup();
    renderTwinsComparison();

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 모양은 같습니다.' }));
    await user.click(screen.getByRole('button', { name: '비교 확인' }));

    expect(screen.getByText('평균이 같아도 각 값과 퍼짐은 다를 수 있어요.')).toBeVisible();
    expect(screen.getByRole('note', { name: '점도표 설명' })).toHaveFocus();
  });

  it('normalizes duplicate selected ids before dispatching and keeps one current action', async () => {
    const user = userEvent.setup();
    renderTwinsComparison();

    await user.click(screen.getByRole('checkbox', { name: '두 자료의 평균은 모두 4입니다.' }));
    await user.click(screen.getByRole('checkbox', { name: '자료 B가 자료 A보다 더 퍼져 있습니다.' }));
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
});
