import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { getDataset } from '../../content/missions';
import { SituationPanel } from './SituationPanel';

describe('SituationPanel learner copy', () => {
  afterEach(cleanup);

  it('explains the virtual counting model in child-friendly language', () => {
    render(<SituationPanel dataset={getDataset('balance-20-a')} onAdvance={vi.fn()} />);

    expect(screen.getByText('가상 포장 상자 네 개의 구슬을 고르게 나눠 봐요.')).toBeVisible();
    expect(screen.getByText('실제 물건을 재는 것이 아니라, 수를 세어 보는 교육용 가상 모형이에요.')).toBeVisible();
  });
});
