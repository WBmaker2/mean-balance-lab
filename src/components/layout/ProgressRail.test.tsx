import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { getDataset, getMission } from '../../content/missions';
import { ProgressRail } from './ProgressRail';

describe('ProgressRail', () => {
  afterEach(cleanup);

  it('marks completed and current stages', () => {
    render(<ProgressRail mission={getMission('balance-delivery')} dataset={getDataset('balance-20-a')} currentStage="calculate" />);
    expect(screen.getByRole('listitem', { name: /완료.*상황/ })).toHaveAttribute('data-stage-status', 'completed');
    expect(screen.getByRole('listitem', { name: /현재 단계.*계산/ })).toHaveAttribute('data-stage-status', 'current');
  });
});
