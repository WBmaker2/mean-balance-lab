import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import { createInitialSession, canAdvance, sessionReducer } from './session';

describe('recoverable lab session reducer', () => {
  it('supports one-item movement and undo without losing total', () => {
    const started = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'balance-delivery', datasetId: 'balance-20-a',
    });
    const moved = sessionReducer(started, { type: 'MOVE_ONE', move: { fromIndex: 3, toIndex: 0 } });
    const undone = sessionReducer(moved, { type: 'UNDO_MOVE' });
    expect(undone.activeRun?.artifacts.redistribution?.currentValues).toEqual([2, 4, 6, 8]);
    expect(undone.activeRun?.artifacts.redistribution?.undoStack).toEqual([]);
  });

  it('does not advance until the current artifact is verified', () => {
    const started = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'mean-twins', datasetId: 'twins-4-a',
    });
    const predictionStage = sessionReducer(started, { type: 'ADVANCE_STAGE' });
    expect(predictionStage.activeRun?.stage).toBe('predict');
    expect(canAdvance(predictionStage)).toEqual({ allowed: false, reason: '먼저 평균을 예측해 보세요.' });
  });

  it('increments revisions for rejected submissions', () => {
    const started = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'mean-twins', datasetId: 'twins-4-a',
    });
    const predicted = sessionReducer(started, { type: 'SET_PREDICTION', value: 3 });
    const advanced = sessionReducer(predicted, { type: 'ADVANCE_STAGE' });
    const dataset = getDataset('twins-4-a');
    const rejected = sessionReducer(advanced, {
      type: 'SUBMIT_CALCULATION', target: 'left',
      input: { values: dataset.kind === 'twins' ? dataset.leftValues : [], enteredTotal: 0, enteredCount: 4, enteredMean: 0 },
    });
    expect(rejected.activeRun?.revisions).toBe(1);
    expect(rejected.activeRun?.transientFeedback?.isCorrect).toBe(false);
  });
});
