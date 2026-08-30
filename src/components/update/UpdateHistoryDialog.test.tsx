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

  it('records the 2026-08-30 live basket dot improvement', () => {
    expect(UPDATE_HISTORY[0]).toEqual({
      date: '2026-08-30',
      category: '개선',
      summary: '바구니 동그라미 수량 실시간 시뮬레이션 추가',
    });
  });

  it('keeps literal dated entries for deployment, design, and MVP', () => {
    expect(UPDATE_HISTORY).toEqual([
      { date: '2026-08-30', category: '개선', summary: '바구니 동그라미 수량 실시간 시뮬레이션 추가' },
      { date: '2026-08-30', category: '개선', summary: '빈 트레이 장식 이미지와 DOM 수량 오버레이 보강' },
      { date: '2026-08-30', category: '개선', summary: '교실 측정 노트 작업표 시각 세계와 3열 학습 작업대 적용' },
      { date: '2026-08-29', category: '개선', summary: '학습 화면 계층과 모바일 행동 흐름 개선' },
      { date: '2026-08-28', category: '개선', summary: '배포 환경의 단계 초점 인계 보완' },
      { date: '2026-08-28', category: '개선', summary: '학습 단계 안내와 입력·모바일 화면 개선' },
      { date: '2026-08-27', category: '배포', summary: 'GitHub Pages 공개 배포 경로 정리' },
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
    expect(screen.getAllByText('2026-08-30')).toHaveLength(3);
    expect(screen.getByText('2026-08-29')).toBeVisible();
    expect(screen.getAllByText('2026-08-28')).toHaveLength(2);
    expect(screen.getByText('2026-08-27')).toBeVisible();
    expect(screen.getAllByText('2026-08-26')).toHaveLength(2);
    expect(screen.getByText('배포 환경의 단계 초점 인계 보완')).toBeVisible();
    expect(screen.getByText('학습 단계 안내와 입력·모바일 화면 개선')).toBeVisible();
    expect(screen.getByText('GitHub Pages 공개 배포 경로 정리')).toBeVisible();
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

  it('keeps the trigger in normal flow, at least 44px, and out of current-action emphasis', () => {
    render(<UpdateHistoryDialog />);
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const computed = getComputedStyle(trigger);

    expect(computed.position).toBe('static');
    expect(Number.parseFloat(computed.minWidth)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(computed.minHeight)).toBeGreaterThanOrEqual(44);
    expect(trigger.style.position).toBe('');
    expect(trigger.style.right).toBe('');
    expect(trigger.style.bottom).toBe('');
    expect(trigger).not.toHaveClass('gi-pulse');
    expect(trigger).not.toHaveAttribute('data-current-action');
  });

  it('keeps update history available in the AppShell', () => {
    renderAppAt('#/');

    expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  });

  it('isolates the AppShell background with native inert while open', async () => {
    renderAppAt('#/');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const background = document.getElementById('app-shell-content');

    expect(background).not.toBeNull();
    expect(background).not.toHaveAttribute('inert');
    expect((background as HTMLElement & { inert?: boolean }).inert).not.toBe(true);

    await user.click(trigger);

    expect(background).toHaveAttribute('inert');
    expect((background as HTMLElement & { inert?: boolean }).inert).toBe(true);
    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(trigger).toHaveAttribute('inert');
    expect((trigger as HTMLElement & { inert?: boolean }).inert).toBe(true);
  });

  it('keeps the skip link inside the inert shell boundary and restores navigation after close', async () => {
    renderAppAt('#/');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const skipLink = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    const background = document.getElementById('app-shell-content');

    expect(background).not.toBeNull();
    expect(background).toContainElement(skipLink);

    await user.click(trigger);

    expect(background).toHaveAttribute('inert');
    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(background).toContainElement(skipLink);

    await user.keyboard('{Escape}');

    expect(background).not.toHaveAttribute('inert');
    expect(background).not.toHaveAttribute('aria-hidden');
    skipLink.focus();
    expect(skipLink).toHaveFocus();
    await user.click(skipLink);
    expect(window.location.hash).toBe('#main-content');
  });

  it('blocks programmatic background activation while open and restores it after close', async () => {
    renderAppAt('#/');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const skipLink = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    const backgroundButton = document.createElement('button');
    backgroundButton.type = 'button';
    backgroundButton.textContent = '배경 테스트';
    let backgroundActivations = 0;
    backgroundButton.addEventListener('click', () => {
      backgroundActivations += 1;
    });
    document.getElementById('app-shell-content')?.append(backgroundButton);

    await user.click(trigger);
    window.location.hash = '#/';

    skipLink.click();
    const dispatched = backgroundButton.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    expect(window.location.hash).toBe('#/');
    expect(backgroundActivations).toBe(0);
    expect(dispatched).toBe(false);
    expect(screen.getByRole('dialog', { name: '업데이트 내역' })).toBeVisible();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    await user.click(skipLink);
    expect(window.location.hash).toBe('#main-content');
    await user.click(backgroundButton);
    expect(backgroundActivations).toBe(1);
  });

  it('recaptures forced programmatic focus from the background', async () => {
    renderAppAt('#/');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const backgroundLink = screen.getByRole('link', { name: '처음으로' });

    await user.click(trigger);
    backgroundLink.focus();

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
  });

  it('restores inert and aria-hidden values after close and reopen', async () => {
    const rendered = renderAppAt('#/');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });
    const background = document.getElementById('app-shell-content') as HTMLElement;
    background.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-hidden', 'false');

    await user.click(trigger);
    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(trigger).toHaveAttribute('inert');
    await user.keyboard('{Escape}');

    expect(background).not.toHaveAttribute('inert');
    expect((background as HTMLElement & { inert?: boolean }).inert).toBe(false);
    expect(background).toHaveAttribute('aria-hidden', 'false');
    expect(trigger).not.toHaveAttribute('inert');
    expect((trigger as HTMLElement & { inert?: boolean }).inert).toBe(false);
    expect(trigger).toHaveAttribute('aria-hidden', 'false');
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(background).toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(background).not.toHaveAttribute('inert');
    expect(background).toHaveAttribute('aria-hidden', 'false');
    expect(trigger).toHaveFocus();
    rendered.unmount();
  });

  it('restores the external background when the dialog unmounts while open', async () => {
    const background = document.createElement('div');
    background.id = 'app-shell-content';
    background.setAttribute('aria-hidden', 'false');
    document.body.append(background);
    const host = document.createElement('div');
    document.body.append(host);
    const rendered = render(<UpdateHistoryDialog />, { container: host });
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    expect(background).toHaveAttribute('inert');
    expect(background).toHaveAttribute('aria-hidden', 'true');
    rendered.unmount();

    expect(background).not.toHaveAttribute('inert');
    expect((background as HTMLElement & { inert?: boolean }).inert).toBe(false);
    expect(background).toHaveAttribute('aria-hidden', 'false');
    expect(document.querySelector('[inert]')).toBeNull();

    host.remove();
    background.remove();
  });

  it('renders through the full App entry point without requiring network data', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeVisible();
  });
});
