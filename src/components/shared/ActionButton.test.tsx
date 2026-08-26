import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('marks only an enabled next action and provides a reduced-motion label', () => {
    render(
      <>
        <ActionButton emphasis="next">계속</ActionButton>
        <ActionButton emphasis="next" disabled>잠김</ActionButton>
        <ActionButton emphasis="normal">보조 행동</ActionButton>
      </>,
    );

    expect(screen.getAllByRole('button').filter((button) => button.dataset.currentAction === 'true'))
      .toHaveLength(1);
    expect(screen.getByRole('button', { name: /계속/ })).toHaveClass('gi-pulse');
    expect(screen.getByText('다음 행동')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '잠김' })).not.toHaveAttribute('data-current-action');
  });
});
