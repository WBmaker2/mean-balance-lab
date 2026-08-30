import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UtilityToolbar } from './UtilityToolbar';

describe('UtilityToolbar', () => {
  afterEach(cleanup);

  it('provides real notebook, record, and settings destinations without fake controls', () => {
    render(<UtilityToolbar />);

    const toolbar = screen.getByRole('navigation', { name: '도구 모음' });
    expect(toolbar).toBeVisible();
    expect(screen.getByRole('link', { name: '노트' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('link', { name: '기록' })).toHaveAttribute('href', '#artifact-records');
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '#app-settings');
    expect(screen.getByText('학생')).toBeVisible();
    expect(screen.queryByRole('button', { name: /북마크|학생/ })).not.toBeInTheDocument();
  });

  it('keeps decorative inline icons out of the accessibility tree', () => {
    render(<UtilityToolbar studentLabel="학습자" />);

    expect(screen.getByText('학습자')).toBeVisible();
    screen.getByRole('navigation', { name: '도구 모음' }).querySelectorAll('svg').forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('scrolls to a same-page destination without replacing the HashRouter route', async () => {
    window.location.hash = '#/mission/balance-delivery/balance-20-a/redistribute';
    render(
      <>
        <main id="main-content" tabIndex={-1}>노트 본문</main>
        <UtilityToolbar />
      </>,
    );

    await userEvent.setup().click(screen.getByRole('link', { name: '노트' }));

    expect(window.location.hash).toBe('#/mission/balance-delivery/balance-20-a/redistribute');
    expect(document.getElementById('main-content')).toHaveFocus();
  });
});
