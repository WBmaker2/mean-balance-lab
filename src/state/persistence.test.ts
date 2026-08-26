import { describe, expect, it } from 'vitest';
import {
  DEVICE_STORAGE_KEY, TAB_STORAGE_KEY, isLabSessionState, loadSession, sanitizeRestoredSession, saveSession,
} from './persistence';
import { invalidShapeSession, stateWithCompletedEvidenceAndWrongFeedback } from '../test/fixtures';

const redistributionState = (confirmed: unknown) => ({
  schemaVersion: 1,
  saveMode: 'tab',
  activeRun: {
    missionId: 'balance-delivery',
    datasetId: 'balance-20-a',
    stage: 'redistribute',
    artifacts: {
      redistribution: {
        initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed,
      },
    },
    revisions: 0,
    transientFeedback: null,
  },
  attempts: {},
  completedRequiredMissions: [],
});

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

  it('keeps storage access failures inside the persistence boundary', () => {
    const blockedStorage = {
      getItem: () => { throw new DOMException('blocked', 'SecurityError'); },
      setItem: () => { throw new DOMException('blocked', 'QuotaExceededError'); },
      removeItem: () => { throw new DOMException('blocked', 'SecurityError'); },
    };

    expect(() => loadSession(blockedStorage, TAB_STORAGE_KEY)).not.toThrow();
    expect(loadSession(blockedStorage, TAB_STORAGE_KEY)).toBeNull();
    expect(() => saveSession(blockedStorage, TAB_STORAGE_KEY, stateWithCompletedEvidenceAndWrongFeedback())).not.toThrow();
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

  it.each([true, false])('restores redistribution confirmed=%s', (confirmed) => {
    const value = redistributionState(confirmed);
    expect(isLabSessionState(value)).toBe(true);
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(value));
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)?.activeRun?.artifacts.redistribution?.confirmed)
      .toBe(confirmed);
  });

  it('rejects a non-boolean redistribution confirmation', () => {
    const value = redistributionState('yes');
    expect(isLabSessionState(value)).toBe(false);
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(value));
    expect(loadSession(sessionStorage, TAB_STORAGE_KEY)).toBeNull();
  });

  it('rejects a verified twin comparison with filtered-empty or cross-kind choices', () => {
    const value = stateWithCompletedEvidenceAndWrongFeedback() as any;
    value.activeRun.missionId = 'mean-twins';
    value.activeRun.datasetId = 'twins-4-a';
    value.activeRun.stage = 'compare';
    value.activeRun.artifacts = {
      calculations: {
        left: { target: 'left', total: 16, count: 4, average: 4, verified: true },
        right: { target: 'right', total: 16, count: 4, average: 4, verified: true },
      },
      comparison: { selectedIds: [], verified: true },
    };
    expect(isLabSessionState(value)).toBe(false);
    value.activeRun.artifacts.comparison = { selectedIds: ['sum-changed-first'], verified: true };
    expect(isLabSessionState(value)).toBe(false);
    value.activeRun.artifacts.comparison = { selectedIds: ['same-mean'], verified: true };
    expect(isLabSessionState(value)).toBe(false);
  });

  it('rejects mixed representative evidence and an old-revision active evidence artifact', () => {
    const mixed = stateWithCompletedEvidenceAndWrongFeedback() as any;
    mixed.activeRun.missionId = 'representative-review';
    mixed.activeRun.datasetId = 'review-cards-a';
    mixed.activeRun.stage = 'explain';
    mixed.activeRun.revisions = 1;
    mixed.activeRun.artifacts = {
      calculations: {
        current: { target: 'current', total: 20, count: 5, average: 4, verified: true },
      },
      evidence: {
        missionId: 'representative-review', datasetId: 'review-cards-a',
        selectedIds: ['mean-use-and-limit', 'mean-always-enough'],
        sentence: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.', level: 2, revisions: 1,
      },
    };
    expect(isLabSessionState(mixed)).toBe(false);
    mixed.activeRun.artifacts.evidence = {
      missionId: 'representative-review', datasetId: 'review-cards-a',
      selectedIds: ['mean-use-and-limit'],
      sentence: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.', level: 2, revisions: 0,
    };
    expect(isLabSessionState(mixed)).toBe(false);
  });
});
