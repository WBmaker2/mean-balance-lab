import { describe, expect, it } from 'vitest';
import { createInitialSession, sessionReducer, type LabAction } from './session';

describe('session action boundary', () => {
  it('ignores a forged former RESTORE action without changing the original state', () => {
    const state = createInitialSession();
    const forgedState = {
      ...state,
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'predict' as const,
        artifacts: { prediction: { value: 5 as const } },
        revisions: 0,
        transientFeedback: { isCorrect: false, message: '위조 피드백', nextAction: '무시' },
      },
    };
    const forgedAction = { type: 'RESTORE', state: forgedState } as unknown as LabAction;
    expect(sessionReducer(state, forgedAction)).toBe(state);
    expect(sessionReducer(state, forgedAction).activeRun).toBeNull();
  });
});
