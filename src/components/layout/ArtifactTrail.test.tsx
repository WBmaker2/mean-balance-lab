import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ArtifactTrail } from './ArtifactTrail';
import { verifiedBalanceArtifacts } from '../../test/fixtures';

describe('ArtifactTrail', () => {
  afterEach(cleanup);

  it('keeps verified prior artifacts visible after stage advance', () => {
    render(<ArtifactTrail artifacts={verifiedBalanceArtifacts()} revisions={2} />);

    expect(screen.getByRole('region', { name: '지금까지 남긴 자료' })).toHaveClass('notebook-evidence');
    expect(screen.getByText('예측: 평균 5')).toBeVisible();
    expect(screen.getByText('재배분: 5, 5, 5, 5')).toBeVisible();
    expect(screen.getByText('현재 자료 계산: 20 ÷ 4 = 5')).toBeVisible();
    expect(screen.getByText('수정 횟수: 2')).toBeVisible();
    expect(screen.getByText('예측: 평균 5').closest('li')).toHaveAttribute('data-artifact-kind', 'prediction');
    expect(screen.getByText('재배분: 5, 5, 5, 5').closest('li')).toHaveAttribute('data-artifact-kind', 'redistribution');
  });

  it('labels both verified calculations', () => {
    render(<ArtifactTrail artifacts={{ calculations: {
      left: { target: 'left', total: 16, count: 4, average: 4, verified: true },
      right: { target: 'right', total: 16, count: 4, average: 4, verified: true },
    } }} />);
    expect(screen.getByText('자료 A 계산: 16 ÷ 4 = 4')).toBeVisible();
    expect(screen.getByText('자료 B 계산: 16 ÷ 4 = 4')).toBeVisible();
    expect(screen.getByText('자료 A 계산: 16 ÷ 4 = 4').closest('li')).toHaveAttribute('data-artifact-kind', 'calculation');
  });

  it('omits unanswered artifact rows', () => {
    render(<ArtifactTrail artifacts={{}} />);

    expect(screen.queryByText(/예측:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/재배분:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/÷/)).not.toBeInTheDocument();
  });

  it.each([
    ['increase', '평균이 커집니다'],
    ['decrease', '평균이 작아집니다'],
    ['same', '평균이 같습니다'],
  ] as const)('keeps the stored prediction label after moving stages (%s)', (value, label) => {
    render(<ArtifactTrail artifacts={{ prediction: { value } }} />);
    expect(screen.getByText(`예측: ${label}`)).toBeVisible();
  });
});
