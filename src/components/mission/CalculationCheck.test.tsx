import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalculationInput } from '../../domain/evaluation';
import type { CalculationTarget, EvaluationResult } from '../../domain/types';
import { CalculationCheck } from './CalculationCheck';

const values = [2, 4, 6, 8] as const;

const renderCalculation = (
  feedback: EvaluationResult | null = null,
  onSubmit: (target: CalculationTarget, input: CalculationInput) => void = vi.fn(),
) => render(
  <CalculationCheck target="current" values={values} onSubmit={onSubmit} feedback={feedback} />,
);

describe('CalculationCheck', () => {
  afterEach(cleanup);

  it('checks total, count, and mean in learning order', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderCalculation(null, onSubmit);

    await user.type(screen.getByLabelText('합계'), '20');
    await user.type(screen.getByLabelText('자료 개수'), '4');
    await user.type(screen.getByLabelText('평균'), '5');
    await user.click(screen.getByRole('button', { name: '계산 확인' }));

    expect(onSubmit).toHaveBeenCalledWith('current', {
      values: [2, 4, 6, 8], enteredTotal: 20, enteredCount: 4, enteredMean: 5,
    });
  });

  it('shows an actionable retry and focuses the first incorrect field', async () => {
    const user = userEvent.setup();
    renderCalculation({
      isCorrect: false,
      message: '자료의 합을 다시 확인해 보세요.',
      nextAction: '전체 양을 다시 더해 보세요.',
    });

    expect(screen.getByText(/전체 양을 다시 더해 보세요\./)).toBeVisible();
    expect(screen.queryByText('틀렸습니다')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계산 다시 확인' })).toHaveAttribute('data-current-action', 'true');
    expect(document.querySelectorAll('[data-current-action="true"]')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '계산 다시 확인' }));
    expect(screen.getByLabelText('합계')).toHaveFocus();
  });

  it('renders the canonical equation after success and exposes only next step', () => {
    renderCalculation({
      isCorrect: true,
      message: '계산이 맞아요.',
      nextAction: '다음 단계로 가 보세요.',
    });

    expect(screen.getByText('20 ÷ 4 = 5')).toBeVisible();
    expect(screen.getByRole('button', { name: '다음 단계' })).toHaveAttribute('data-current-action', 'true');
    expect(screen.queryByRole('button', { name: '계산 확인' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-current-action="true"]')).toHaveLength(1);
  });

  it('uses numeric labeled inputs without leaking the answer as defaults', () => {
    renderCalculation();

    for (const label of ['합계', '자료 개수', '평균']) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveValue(null);
      expect(input).not.toHaveAttribute('placeholder', expect.stringContaining('20'));
      expect(input).not.toHaveAttribute('placeholder', expect.stringContaining('4'));
      expect(input).not.toHaveAttribute('placeholder', expect.stringContaining('5'));
    }
  });
});
