import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QuantityDots } from './QuantityDots';

describe('QuantityDots', () => {
  afterEach(cleanup);

  it('renders one decorative dot for each item in every basket and updates with values', () => {
    const { container, rerender } = render(
      <QuantityDots values={[2, 4, 6, 8]} label="현재 수량" />,
    );
    const visualization = container.querySelector('[data-visualization="quantity-dots"]');

    expect(visualization).toHaveAttribute('aria-hidden', 'true');
    expect(visualization?.querySelectorAll('.quantity-dot')).toHaveLength(20);
    expect(Array.from(visualization?.querySelectorAll('[data-dot-count]') ?? [])
      .map((basket) => basket.getAttribute('data-dot-count')))
      .toEqual(['2', '4', '6', '8']);

    rerender(<QuantityDots values={[3, 4, 6, 7]} label="현재 수량" />);

    expect(visualization?.querySelectorAll('.quantity-dot')).toHaveLength(20);
    expect(Array.from(visualization?.querySelectorAll('[data-dot-count]') ?? [])
      .map((basket) => basket.getAttribute('data-dot-count')))
      .toEqual(['3', '4', '6', '7']);
  });

  it('keeps the label on the visual layer for debugging without exposing it as learner copy', () => {
    const { container } = render(<QuantityDots values={[5, 5, 5, 5]} label="현재 수량" />);
    const visualization = container.querySelector('[data-visualization="quantity-dots"]');

    expect(visualization).toHaveAttribute('data-label', '현재 수량');
    expect(visualization?.querySelectorAll('[data-basket-index]')).toHaveLength(4);
  });
});
