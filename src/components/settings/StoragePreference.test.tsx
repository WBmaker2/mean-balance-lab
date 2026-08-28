import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import App from '../../app/App';
import { createInitialSession } from '../../domain/session';
import { completedBalanceStateWithTwoRetries, completedSession, renderAppAt } from '../../test/fixtures';
import { DEVICE_STORAGE_KEY, TAB_STORAGE_KEY, loadSession } from '../../state/persistence';
import { StoragePreference } from './StoragePreference';

describe('StoragePreference', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('defaults to current-tab storage and explains its boundary', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<StoragePreference mode="tab" onChange={onChange} onClear={onClear} />);

    const checkbox = screen.getByRole('checkbox', { name: '이 기기에 진행 저장' });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('기본 진행은 이 탭에만 남고 탭을 닫으면 사라집니다.')).toBeVisible();
    expect(screen.queryByText('응답은 이 기기에만 남으며 공유되거나 동기화되지 않습니다.')).not.toBeInTheDocument();
  });

  it('calls onChange only after explicit device opt-in', async () => {
    const onChange = vi.fn();
    render(<StoragePreference mode="tab" onChange={onChange} onClear={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole('checkbox', { name: '이 기기에 진행 저장' }));

    expect(onChange).toHaveBeenCalledWith('device');
  });

  it('synchronizes the valid device-mode state to both keys and removes the device key when unchecked', async () => {
    renderAppAt('#/');
    const user = userEvent.setup();
    const checkbox = screen.getByRole('checkbox', { name: '이 기기에 진행 저장' });

    await user.click(checkbox);
    const tabState = sessionStorage.getItem(TAB_STORAGE_KEY);
    const deviceState = localStorage.getItem(DEVICE_STORAGE_KEY);
    expect(tabState).not.toBeNull();
    expect(deviceState).not.toBeNull();
    expect(JSON.parse(tabState!)).toEqual(JSON.parse(deviceState!));
    expect(JSON.parse(tabState!).saveMode).toBe('device');

    await user.click(checkbox);
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(TAB_STORAGE_KEY)!).saveMode).toBe('tab');
  });

  it('shows the device-only disclosure when opted in', () => {
    render(<StoragePreference mode="device" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: '이 기기에 진행 저장' })).toBeChecked();
    expect(screen.getByText('응답은 이 기기에만 남으며 공유되거나 동기화되지 않습니다.')).toBeVisible();
    expect(screen.queryByText('기본 진행은 이 탭에만 남고 탭을 닫으면 사라집니다.')).not.toBeInTheDocument();
  });

  it('requires the exact native confirmation before clearing', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onClear = vi.fn();
    render(<StoragePreference mode="device" onChange={vi.fn()} onClear={onClear} />);

    await userEvent.setup().click(screen.getByRole('button', { name: '모든 진행 지우기' }));

    expect(confirm).toHaveBeenCalledWith('저장된 미션 근거와 수정 기록을 이 기기에서 지울까요?');
    expect(onClear).not.toHaveBeenCalled();
  });

  it('calls onClear after the exact native confirmation is accepted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onClear = vi.fn();
    render(<StoragePreference mode="device" onChange={vi.fn()} onClear={onClear} />);

    await userEvent.setup().click(screen.getByRole('button', { name: '모든 진행 지우기' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not call fetch while starting, saving, restoring, or clearing', async () => {
    const fetch = vi.spyOn(window, 'fetch');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderAppAt('#/');

    await user.click(screen.getByRole('checkbox', { name: '이 기기에 진행 저장' }));
    await user.click(screen.getByRole('button', { name: '미션 시작' }));
    const tabState = sessionStorage.getItem(TAB_STORAGE_KEY);
    expect(tabState).not.toBeNull();
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)).not.toBeNull();
    await user.click(screen.getByRole('link', { name: '처음으로' }));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBeNull();
  });

  it('clears both keys through the provider reset path while preserving cancellation', async () => {
    const seeded = { ...createInitialSession(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAppAt('#/');
    await userEvent.setup().click(screen.getByRole('button', { name: '모든 진행 지우기' }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).not.toBeNull();
  });

  it('keeps confirmed mission-route deletion empty after StrictMode effects settle', async () => {
    const seeded = { ...completedBalanceStateWithTwoRetries(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    window.location.hash = '#/mission/balance-delivery/balance-20-a/mission-result';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);

    expect(await screen.findByRole('heading', { name: '1. 골고루 나누기 결과' })).toBeVisible();
    await user.click(screen.getByText('설정'));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));

    await waitFor(() => expect(window.location.hash).toBe('#/'));
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole('heading', { name: '1. 골고루 나누기 결과' })).not.toBeInTheDocument();
    expect(screen.getByText('다음 미션: 1. 골고루 나누기')).toBeVisible();

    cleanup();
    window.location.hash = '#/';
    render(<StrictMode><App /></StrictMode>);
    await waitFor(() => expect(loadSession(sessionStorage, TAB_STORAGE_KEY)).not.toBeNull());
    const blankTabState = loadSession(sessionStorage, TAB_STORAGE_KEY);
    expect(blankTabState?.activeRun).toBeNull();
    expect(blankTabState?.attempts).toEqual({});
    expect(blankTabState?.completedRequiredMissions).toEqual([]);
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBeNull();
  });

  it('keeps confirmed results-route deletion empty after StrictMode effects settle', async () => {
    const seeded = { ...completedSession(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    window.location.hash = '#/results';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);

    expect(await screen.findByRole('heading', { name: '전체 결과' })).toBeVisible();
    await user.click(screen.getByText('설정'));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));

    await waitFor(() => expect(window.location.hash).toBe('#/'));
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole('heading', { name: '전체 결과' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?' })).toBeVisible();
  });

  it('preserves both keys and the current route when clearing is cancelled', async () => {
    const seeded = { ...completedBalanceStateWithTwoRetries(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    window.location.hash = '#/mission/balance-delivery/balance-20-a/mission-result';
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);

    expect(await screen.findByRole('heading', { name: '1. 골고루 나누기 결과' })).toBeVisible();
    await user.click(screen.getByText('설정'));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    expect(window.location.hash).toBe('#/mission/balance-delivery/balance-20-a/mission-result');
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByRole('heading', { name: '1. 골고루 나누기 결과' })).toBeVisible();
  });

  it('preserves the results route, state, and both keys when clearing is cancelled', async () => {
    const seeded = { ...completedSession(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    window.location.hash = '#/results';
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);

    expect(await screen.findByRole('heading', { name: '전체 결과' })).toBeVisible();
    await user.click(screen.getByText('설정'));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    expect(window.location.hash).toBe('#/results');
    expect(sessionStorage.getItem(TAB_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(DEVICE_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByRole('heading', { name: '전체 결과' })).toBeVisible();
  });

  it('resumes persistence when a new mission is explicitly started after clearing', async () => {
    const seeded = { ...completedBalanceStateWithTwoRetries(), saveMode: 'device' as const };
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(seeded));
    window.location.hash = '#/mission/balance-delivery/balance-20-a/mission-result';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);

    await screen.findByRole('heading', { name: '1. 골고루 나누기 결과' });
    await user.click(screen.getByText('설정'));
    await user.click(screen.getByRole('button', { name: '모든 진행 지우기' }));
    await waitFor(() => expect(window.location.hash).toBe('#/'));
    await user.click(screen.getByRole('button', { name: '미션 시작' }));
    await waitFor(() => {
      expect(loadSession(sessionStorage, TAB_STORAGE_KEY)?.activeRun?.missionId).toBe('balance-delivery');
      expect(loadSession(localStorage, DEVICE_STORAGE_KEY)).toBeNull();
    });
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)?.activeRun?.datasetId).toBe('balance-20-a');
  });
});
