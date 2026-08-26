import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DotPlot } from './DotPlot';

describe('DotPlot', () => {
  afterEach(cleanup);

  it('exposes the same values visually and as screen-reader text', () => {
    render(<DotPlot values={[1, 3, 5, 7]} label="자료 B" />);

    expect(screen.getByRole('img', { name: '자료 B 점도표: 1, 3, 5, 7' })).toBeVisible();
    expect(screen.getByText('자료 B 값 목록: 1, 3, 5, 7')).toHaveClass('sr-only');
    expect(screen.getByText('1')).toBeVisible();
    expect(screen.getByText('3')).toBeVisible();
    expect(screen.getByText('5')).toBeVisible();
    expect(screen.getByText('7')).toBeVisible();
  });

  it('renders one frequency column and decorative dots for each repeated value', () => {
    const values = [2, 2, 4, 6, 6, 6] as const;
    render(<DotPlot values={values} label="자료 A" />);

    expect(screen.getAllByTestId('dot-column')).toHaveLength(3);
    const column = (value: number) => screen.getAllByTestId('dot-column')
      .find((item) => item.getAttribute('data-value') === String(value));
    expect(column(2)).toHaveAttribute('data-count', '2');
    expect(column(4)).toHaveAttribute('data-count', '1');
    expect(column(6)).toHaveAttribute('data-count', '3');
    expect(screen.getAllByTestId('dot')).toHaveLength(values.length);
    expect(screen.getAllByTestId('dot').every((dot) => dot.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('does not mutate the source values', () => {
    const values = [7, 1, 3, 1];
    render(<DotPlot values={values} label="자료 B" />);
    expect(values).toEqual([7, 1, 3, 1]);
  });
});
