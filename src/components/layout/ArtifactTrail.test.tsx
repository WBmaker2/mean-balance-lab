import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ArtifactTrail } from './ArtifactTrail';
import { verifiedBalanceArtifacts } from '../../test/fixtures';

describe('ArtifactTrail', () => {
  afterEach(cleanup);

  it('keeps verified prior artifacts visible after stage advance', () => {
    render(<ArtifactTrail artifacts={verifiedBalanceArtifacts()} revisions={2} />);

    expect(screen.getByText('예측: 평균 5')).toBeVisible();
    expect(screen.getByText('재배분: 5, 5, 5, 5')).toBeVisible();
    expect(screen.getByText('20 ÷ 4 = 5')).toBeVisible();
    expect(screen.getByText('수정 횟수: 2')).toBeVisible();
  });

  it('omits unanswered artifact rows', () => {
    render(<ArtifactTrail artifacts={{}} />);

    expect(screen.queryByText(/예측:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/재배분:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/÷/)).not.toBeInTheDocument();
  });
});
