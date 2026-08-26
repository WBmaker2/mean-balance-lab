import { describe, expect, it } from 'vitest';
import { PREDICTION_CASES } from '../test/predictionCases';
import { createInitialSession, sessionReducer } from './session';
import { isLabSessionState, loadSession } from '../state/persistence';

const predictionState = (testCase: (typeof PREDICTION_CASES)[number]) => {
  const started = sessionReducer(createInitialSession(), {
    type: 'START_DATASET', missionId: testCase.missionId, datasetId: testCase.datasetId,
  });
  return sessionReducer(started, { type: 'ADVANCE_STAGE' });
};

const predictionPayload = (testCase: (typeof PREDICTION_CASES)[number], value: unknown) => ({
  schemaVersion: 1,
  saveMode: 'tab',
  activeRun: {
    missionId: testCase.missionId,
    datasetId: testCase.datasetId,
    stage: 'predict',
    artifacts: { prediction: { value } },
    revisions: 0,
    transientFeedback: null,
  },
  attempts: {},
  completedRequiredMissions: [],
});

describe('prediction boundaries', () => {
  it.each(PREDICTION_CASES)('$datasetId stores its canonical prediction and rejects invalid values', (testCase) => {
    const canonicalState = predictionState(testCase);
    const accepted = sessionReducer(canonicalState, { type: 'SET_PREDICTION', value: testCase.canonical });
    expect(accepted.activeRun?.artifacts.prediction).toEqual({ value: testCase.canonical });

    for (const value of [testCase.crossKindValue, ...testCase.arbitraryValues]) {
      const state = predictionState(testCase);
      const rejected = sessionReducer(state, { type: 'SET_PREDICTION', value });
      expect(rejected).toBe(state);
    }
  });

  it.each(PREDICTION_CASES)('$datasetId rejects cross-kind and arbitrary forged predictions on restore', (testCase) => {
    expect(isLabSessionState(predictionPayload(testCase, testCase.canonical))).toBe(true);
    for (const value of [testCase.crossKindValue, ...testCase.arbitraryValues]) {
      const forged = predictionPayload(testCase, value);
      expect(isLabSessionState(forged)).toBe(false);
      const storage = new Map<string, string>([['prediction', JSON.stringify(forged)]]);
      expect(loadSession({
        getItem: (key) => storage.get(key) ?? null,
        setItem: () => undefined,
        removeItem: () => undefined,
      }, 'prediction')).toBeNull();
    }
  });
});
