import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import { createInitialSession, canAdvance, sessionReducer } from './session';
import { buildEvidenceSentence, deriveEvidenceLevel } from './evaluation';

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

  it('requires redistribution confirmation before advancing to calculation', () => {
    let state = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'balance-delivery', datasetId: 'balance-20-a',
    });
    state = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    state = sessionReducer(state, { type: 'SET_PREDICTION', value: 5 });
    state = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    state = {
      ...state,
      activeRun: state.activeRun ? {
        ...state.activeRun,
        artifacts: {
          ...state.activeRun.artifacts,
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [],
          },
        },
      } : null,
    };
    expect(canAdvance(state)).toEqual({ allowed: false, reason: '자료를 고르게 옮겨 보세요.' });
    const confirmed = sessionReducer(state, { type: 'CONFIRM_REDISTRIBUTION' });
    expect(confirmed.activeRun?.artifacts.redistribution?.confirmed).toBe(true);
    const advanced = sessionReducer(confirmed, { type: 'ADVANCE_STAGE' });
    expect(advanced.activeRun?.stage).toBe('calculate');
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

  it('never trusts forged calculation values supplied by an action', () => {
    const started = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'mean-twins', datasetId: 'twins-4-a',
    });
    const predicting = sessionReducer(started, { type: 'ADVANCE_STAGE' });
    const calculating = sessionReducer(
      sessionReducer(predicting, { type: 'SET_PREDICTION', value: 4 }),
      { type: 'ADVANCE_STAGE' },
    );
    const forged = sessionReducer(calculating, {
      type: 'SUBMIT_CALCULATION', target: 'left',
      input: { values: [1, 1, 1, 1], enteredTotal: 4, enteredCount: 4, enteredMean: 1 },
    });
    expect(forged.activeRun?.artifacts.calculations?.left?.verified).toBe(false);
    expect(forged.activeRun?.revisions).toBe(1);
  });

  it('does not pre-seed later artifacts from an owning-stage mismatch', () => {
    const started = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'mean-twins', datasetId: 'twins-4-a',
    });
    const predictionAttempt = sessionReducer(started, {
      type: 'SUBMIT_CALCULATION', target: 'left',
      input: { values: [4, 4, 4, 4], enteredTotal: 16, enteredCount: 4, enteredMean: 4 },
    });
    const comparisonAttempt = sessionReducer(predictionAttempt, {
      type: 'SET_COMPARISON', selectedIds: ['same-mean', 'different-spread'],
    });
    expect(comparisonAttempt.activeRun?.artifacts.calculations).toBeUndefined();
    expect(comparisonAttempt.activeRun?.artifacts.comparison).toBeUndefined();
    expect(comparisonAttempt.activeRun?.revisions).toBe(2);
  });

  it('does not undo a redistribution after leaving its owning stage', () => {
    let state = sessionReducer(createInitialSession(), {
      type: 'START_DATASET', missionId: 'balance-delivery', datasetId: 'balance-20-a',
    });
    state = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    state = sessionReducer(state, { type: 'SET_PREDICTION', value: 5 });
    state = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    for (const move of [
      { fromIndex: 3, toIndex: 0 }, { fromIndex: 3, toIndex: 0 },
      { fromIndex: 2, toIndex: 0 }, { fromIndex: 3, toIndex: 1 },
    ]) state = sessionReducer(state, { type: 'MOVE_ONE', move });
    state = sessionReducer(state, { type: 'CONFIRM_REDISTRIBUTION' });
    state = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    const beforeUndo = state.activeRun?.artifacts.redistribution;
    const rejected = sessionReducer(state, { type: 'UNDO_MOVE' });
    expect(rejected.activeRun?.stage).toBe('calculate');
    expect(rejected.activeRun?.artifacts.redistribution).toEqual(beforeUndo);
    expect(rejected.activeRun?.revisions).toBe(state.activeRun?.revisions);
    expect(rejected.activeRun?.transientFeedback).toBe(state.activeRun?.transientFeedback);
  });

  it('advances a verified outlier calculation into compare', () => {
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'outlier-alert' as const,
        datasetId: 'outlier-5-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          calculations: {
            before: { target: 'before' as const, total: 20, count: 4, average: 5, verified: true },
            after: { target: 'after' as const, total: 24, count: 4, average: 6, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    expect(canAdvance(state)).toEqual({ allowed: true });
    expect(sessionReducer(state, { type: 'ADVANCE_STAGE' }).activeRun?.stage).toBe('compare');
  });

  it('rejects cross-kind comparison choices without creating a comparison artifact', () => {
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'outlier-alert' as const,
        datasetId: 'outlier-5-a' as const,
        stage: 'compare' as const,
        artifacts: {
          calculations: {
            before: { target: 'before' as const, total: 20, count: 4, average: 5, verified: true },
            after: { target: 'after' as const, total: 24, count: 4, average: 6, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const rejected = sessionReducer(state, {
      type: 'SET_COMPARISON', selectedIds: ['same-mean'],
    });
    expect(rejected.activeRun?.artifacts.comparison).toBeUndefined();
    expect(rejected.activeRun?.revisions).toBe(1);
    expect(rejected.activeRun?.transientFeedback?.isCorrect).toBe(false);
  });

  it('records outlier comparison choices in sum-then-mean order and advances', () => {
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'outlier-alert' as const,
        datasetId: 'outlier-5-a' as const,
        stage: 'compare' as const,
        artifacts: {
          prediction: { value: 'increase' as const },
          calculations: {
            before: { target: 'before' as const, total: 20, count: 4, average: 5, verified: true },
            after: { target: 'after' as const, total: 24, count: 4, average: 6, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const compared = sessionReducer(state, {
      type: 'SET_COMPARISON', selectedIds: ['sum-changed-first', 'mean-changed-after'],
    });
    expect(compared.activeRun?.artifacts.comparison).toEqual({
      selectedIds: ['sum-changed-first', 'mean-changed-after'], verified: true,
    });
    expect(canAdvance(compared)).toEqual({ allowed: true });
    const reversed = sessionReducer(state, {
      type: 'SET_COMPARISON', selectedIds: ['mean-changed-after', 'sum-changed-first'],
    });
    expect(reversed.activeRun?.artifacts.comparison?.verified).toBe(false);
  });

  it('accepts only a canonical evidence record at explain and preserves revisions', () => {
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'explain' as const,
        artifacts: {
          calculations: {
            current: { target: 'current' as const, total: 20, count: 4, average: 5, verified: true },
          },
        },
        revisions: 2,
        transientFeedback: null,
      },
    };
    const selectedIds = ['redistribution-and-division'] as const;
    const record = {
      missionId: 'balance-delivery' as const,
      datasetId: 'balance-20-a' as const,
      selectedIds,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', selectedIds),
      level: deriveEvidenceLevel('balance-delivery', selectedIds),
      revisions: 2,
    };
    const submitted = sessionReducer(state, { type: 'SUBMIT_EVIDENCE', record });
    expect(submitted.activeRun?.artifacts.evidence).toEqual(record);
    expect(submitted.attempts['balance-20-a']).toEqual(record);
    expect(submitted.activeRun?.revisions).toBe(2);

    const forged = sessionReducer(state, {
      type: 'SUBMIT_EVIDENCE',
      record: { ...record, sentence: '학생이 쓴 임의의 문장', revisions: 0 },
    });
    expect(forged.activeRun?.artifacts.evidence).toBeUndefined();
    expect(forged.activeRun?.revisions).toBe(3);
  });

  it('allows balance and representative calculation handoffs without opening mission result', () => {
    const base = createInitialSession();
    const balance = {
      ...base,
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
          },
          calculations: {
            current: { target: 'current' as const, total: 20, count: 4, average: 5, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    const representative = {
      ...base,
      activeRun: {
        missionId: 'representative-review' as const,
        datasetId: 'review-cards-a' as const,
        stage: 'calculate' as const,
        artifacts: {
          calculations: {
            current: { target: 'current' as const, total: 20, count: 5, average: 4, verified: true },
          },
        },
        revisions: 0,
        transientFeedback: null,
      },
    };
    expect(sessionReducer(balance, { type: 'ADVANCE_STAGE' }).activeRun?.stage).toBe('explain');
    expect(sessionReducer(representative, { type: 'ADVANCE_STAGE' }).activeRun?.stage).toBe('compare');
  });
});
