import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BalanceIllustration } from './BalanceIllustration';

describe('BalanceIllustration', () => {
  afterEach(cleanup);

  it('uses the local image only as decoration and keeps all learning data in the DOM', () => {
    render(
      <BalanceIllustration initialValues={[2, 4, 6, 8]} currentValues={[5, 5, 5, 5]} meanValue={5} balanced />,
    );

    const image = document.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('처음 수량: 2, 4, 6, 8')).toBeVisible();
    expect(screen.getByText('현재 수량: 5, 5, 5, 5')).toBeVisible();
    expect(screen.getByText('평균: 5')).toBeVisible();
    expect(screen.getByText('고르게 나뉘었어요.')).toBeVisible();
    expect(document.querySelectorAll('.quantity-dot')).toHaveLength(20);
    expect(document.querySelector('[data-visualization="quantity-dots"]'))
      .toHaveAttribute('data-current-values', '5,5,5,5');
  });

  it('states when the current values are not balanced', () => {
    render(
      <BalanceIllustration initialValues={[2, 4, 6, 8]} currentValues={[3, 4, 6, 7]} meanValue={5} balanced={false} />,
    );

    expect(screen.getByText('아직 고르게 나뉘지 않았어요.')).toBeVisible();
    expect(screen.getByRole('figure', { name: '구슬 분배 작업대' })).toHaveAttribute('data-balanced', 'false');
    expect(document.querySelectorAll('.quantity-dot')).toHaveLength(20);
  });

  it('keeps each basket dot count aligned with the current values after one move', () => {
    render(
      <BalanceIllustration initialValues={[2, 4, 6, 8]} currentValues={[3, 4, 6, 7]} meanValue={5} balanced={false} />,
    );

    expect(document.querySelector('[data-visualization="quantity-dots"]'))
      .toHaveAttribute('data-current-values', '3,4,6,7');
    expect(Array.from(document.querySelectorAll('[data-dot-count]'))
      .map((basket) => basket.getAttribute('data-dot-count')))
      .toEqual(['3', '4', '6', '7']);
    expect(document.querySelectorAll('.quantity-dot')).toHaveLength(20);
  });
});
