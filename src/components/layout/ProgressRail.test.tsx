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

  it('summarizes progress and the current learner action', () => {
    render(<ProgressRail mission={getMission('balance-delivery')} dataset={getDataset('balance-20-a')} currentStage="calculate" />);

    expect(screen.getByRole('navigation', { name: '미션 진행' })).toHaveClass('notebook-rail');
    expect(screen.getByText('4/6 단계')).toBeVisible();
    expect(screen.getByText('현재 단계: 계산')).toBeVisible();
    expect(screen.getByText('전체 양 ÷ 자료 개수로 평균을 계산해요.')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current') === 'step')).toHaveLength(1);
  });
});
