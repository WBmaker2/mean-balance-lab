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

  it('rejects a verified calculation forged with non-canonical totals', () => {
    const value = stateWithCompletedEvidenceAndWrongFeedback() as any;
    value.activeRun.stage = 'explain';
    value.activeRun.artifacts.calculations.current.total = 99;
    expect(isLabSessionState(value)).toBe(false);
  });

  it('rejects an irrelevant verified calculation target after comparison', () => {
    const value = stateWithCompletedEvidenceAndWrongFeedback() as any;
    value.activeRun.stage = 'compare';
    value.activeRun.missionId = 'mean-twins';
    value.activeRun.datasetId = 'twins-4-a';
    value.activeRun.artifacts = {
      calculations: {
        current: { target: 'current', total: 16, count: 4, average: 4, verified: true },
      },
    };
    expect(isLabSessionState(value)).toBe(false);
  });
});
