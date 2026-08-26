import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSession } from '../../domain/session';
import { renderAppAt } from '../../test/fixtures';
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
});
