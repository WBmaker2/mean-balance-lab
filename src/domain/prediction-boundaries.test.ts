import { describe, expect, it } from 'vitest';
import { createInitialSession, sessionReducer } from './session';
import { isLabSessionState, loadSession } from '../state/persistence';

const predictionState = (missionId: 'balance-delivery' | 'outlier-alert', datasetId: 'balance-20-a' | 'outlier-5-a') => {
  const started = sessionReducer(createInitialSession(), { type: 'START_DATASET', missionId, datasetId });
  return sessionReducer(started, { type: 'ADVANCE_STAGE' });
};

describe('prediction boundaries', () => {
  it('ignores a directional value for balance and an arbitrary number for outlier', () => {
    const balance = predictionState('balance-delivery', 'balance-20-a');
    const balanceRejected = sessionReducer(balance, { type: 'SET_PREDICTION', value: 'increase' });
    expect(balanceRejected).toBe(balance);

    const outlier = predictionState('outlier-alert', 'outlier-5-a');
    const outlierRejected = sessionReducer(outlier, { type: 'SET_PREDICTION', value: 5 });
    expect(outlierRejected).toBe(outlier);
  });

  it('rejects cross-kind predictions at the persisted-state boundary', () => {
    const balance = predictionState('balance-delivery', 'balance-20-a');
    const balancePayload = structuredClone({
      schemaVersion: 1, saveMode: 'tab', activeRun: {
        missionId: 'balance-delivery', datasetId: 'balance-20-a', stage: 'predict',
        artifacts: { prediction: { value: 'increase' } }, revisions: 0, transientFeedback: null,
      }, attempts: {}, completedRequiredMissions: [],
    });
    expect(balance.activeRun?.artifacts.prediction).toBeUndefined();
    expect(isLabSessionState(balancePayload)).toBe(false);

    const outlierPayload = {
      schemaVersion: 1, saveMode: 'tab', activeRun: {
        missionId: 'outlier-alert', datasetId: 'outlier-5-a', stage: 'predict',
        artifacts: { prediction: { value: 5 } }, revisions: 0, transientFeedback: null,
      }, attempts: {}, completedRequiredMissions: [],
    };
    expect(isLabSessionState(outlierPayload)).toBe(false);

    const storage = new Map<string, string>([['prediction', JSON.stringify(outlierPayload)]]);
    expect(loadSession({
      getItem: (key) => storage.get(key) ?? null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }, 'prediction')).toBeNull();
  });
});
