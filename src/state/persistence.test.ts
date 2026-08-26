import { describe, expect, it } from 'vitest';
import {
  DEVICE_STORAGE_KEY, TAB_STORAGE_KEY, isLabSessionState, loadSession, sanitizeRestoredSession,
} from './persistence';
import { invalidShapeSession, stateWithCompletedEvidenceAndWrongFeedback } from '../test/fixtures';

describe('session persistence guards', () => {
  it('restores completed evidence but clears current-stage judgment', () => {
    const restored = sanitizeRestoredSession(stateWithCompletedEvidenceAndWrongFeedback());
    expect(restored.attempts['balance-20-a']).toBeDefined();
    expect(restored.activeRun?.transientFeedback).toBeNull();
    expect(restored.activeRun?.artifacts.calculations?.current?.verified).toBe(false);
  });

  it('rejects another schema version without throwing', () => {
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({ schemaVersion: 2 }));
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)).toBeNull();
  });

  it('rejects schema-one data with an invalid mission id or negative quantity', () => {
    const value = invalidShapeSession();
    expect(isLabSessionState(value)).toBe(false);
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(value));
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)).toBeNull();
  });

  it('uses separate tab and device keys', () => {
    expect(TAB_STORAGE_KEY).toBe('mean-balance-lab:tab:v1');
    expect(DEVICE_STORAGE_KEY).toBe('mean-balance-lab:device:v1');
  });
});
