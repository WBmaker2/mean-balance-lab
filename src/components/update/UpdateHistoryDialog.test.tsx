import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../app/App';
import { UPDATE_HISTORY } from '../../content/updateHistory';
import { renderAppAt } from '../../test/fixtures';
import { UpdateHistoryDialog } from './UpdateHistoryDialog';

describe('UpdateHistoryDialog', () => {
  afterEach(() => {
    cleanup();
    window.location.hash = '#/';
  });

  it('keeps two literal dated entries for the initial design and MVP', () => {
    expect(UPDATE_HISTORY).toEqual([
      { date: '2026-08-26', category: '개발', summary: '평균 균형 조정실 MVP 구현' },
      { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
    ]);
    expect(UPDATE_HISTORY.every((entry) => !entry.date.includes('T'))).toBe(true);
  });

  it('opens from the update button and renders named dated entries', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '업데이트 내역' }));

    const dialog = screen.getByRole('dialog', { name: '업데이트 내역' });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const title = screen.getByRole('heading', { name: '업데이트 내역' });
    expect(title.tagName).toBe('H2');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    expect(screen.getAllByText('2026-08-26')).toHaveLength(2);
    expect(screen.getByText('평균 균형 조정실 MVP 구현')).toBeVisible();
    expect(screen.getByText('최초 설계 문서 작성')).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible();
  });

  it('puts initial focus on the visible close button', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '업데이트 내역' }));

    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
  });

  it('closes with Escape and restores focus to the trigger', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from its visible close button and restores trigger focus', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('contains Tab and Shift+Tab within the dialog', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '업데이트 내역' }));
    const close = screen.getByRole('button', { name: '닫기' });
    expect(close).toHaveFocus();

    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });

  it('supports repeated open and close cycles with stable focus', async () => {
    render(<UpdateHistoryDialog />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    for (let cycle = 0; cycle < 2; cycle += 1) {
      await user.click(trigger);
      expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(trigger).toHaveFocus();
    }
  });

  it('keeps the trigger fixed, at least 44px, and out of current-action emphasis', () => {
    render(<UpdateHistoryDialog />);
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const computed = getComputedStyle(trigger);

    expect(computed.position).toBe('fixed');
    expect(Number.parseFloat(computed.minWidth)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(computed.minHeight)).toBeGreaterThanOrEqual(44);
    expect(trigger.style.right).not.toBe('');
    expect(trigger.style.bottom).not.toBe('');
    expect(trigger).not.toHaveClass('gi-pulse');
    expect(trigger).not.toHaveAttribute('data-current-action');
  });

  it('keeps update history available in the AppShell', () => {
    renderAppAt('#/');

    expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  });

  it('renders through the full App entry point without requiring network data', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  });
});
