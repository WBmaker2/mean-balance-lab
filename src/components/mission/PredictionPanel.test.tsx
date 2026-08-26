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
});
