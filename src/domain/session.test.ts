import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import { createInitialSession, canAdvance, sessionReducer } from './session';
import { buildEvidenceSentence, deriveEvidenceLevel } from './evaluation';
import { isLabSessionState, loadSession, saveSession } from '../state/persistence';

describe('recoverable lab session reducer', () => {
  it('updates only an existing canonical evidence attempt without changing revisions', () => {
    const original = {
      missionId: 'balance-delivery' as const,
      datasetId: 'balance-20-a' as const,
      selectedIds: ['redistribution-only'] as const,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', ['redistribution-only']),
      level: deriveEvidenceLevel('balance-delivery', ['redistribution-only']),
      revisions: 2,
    };
    const updated = {
      ...original,
      selectedIds: ['redistribution-and-division'] as const,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', ['redistribution-and-division']),
      level: deriveEvidenceLevel('balance-delivery', ['redistribution-and-division']),
    };
    const state = {
      ...createInitialSession(),
      attempts: { 'balance-20-a': original },
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'mission-result' as const,
        artifacts: { evidence: original },
        revisions: 2,
        transientFeedback: null,
      },
    };
    const next = sessionReducer(state, { type: 'UPDATE_EVIDENCE_ATTEMPT', record: updated });
    expect(next.attempts['balance-20-a']).toEqual(updated);
    expect(next.activeRun?.artifacts.evidence).toEqual(updated);
    expect(next.activeRun?.revisions).toBe(2);
  });

  it('advances a canonical explanation to the mission-result stage and records the required mission', () => {
    const selectedIds = ['redistribution-and-division'] as const;
    const record = {
      missionId: 'balance-delivery' as const,
      datasetId: 'balance-20-a' as const,
      selectedIds,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', selectedIds),
      level: deriveEvidenceLevel('balance-delivery', selectedIds),
      revisions: 0,
    };
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'explain' as const,
        artifacts: { evidence: record }, revisions: 0, transientFeedback: null,
      },
    };
    const next = sessionReducer(state, { type: 'ADVANCE_STAGE' });
    expect(next.activeRun?.stage).toBe('mission-result');
    expect(next.completedRequiredMissions).toEqual(['balance-delivery']);
  });

  it('rejects edits for missing, forged, or revision-mismatched attempts', () => {
    const original = {
      missionId: 'balance-delivery' as const,
      datasetId: 'balance-20-a' as const,
      selectedIds: ['redistribution-only'] as const,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', ['redistribution-only']),
      level: deriveEvidenceLevel('balance-delivery', ['redistribution-only']),
      revisions: 2,
    };
    const state = { ...createInitialSession(), attempts: { 'balance-20-a': original } };
    const forged = { ...original, sentence: '임의 문장' };
    expect(sessionReducer(state, { type: 'UPDATE_EVIDENCE_ATTEMPT', record: forged }).attempts).toEqual(state.attempts);
    expect(sessionReducer(createInitialSession(), { type: 'UPDATE_EVIDENCE_ATTEMPT', record: original }).attempts).toEqual({});
    expect(sessionReducer(state, {
      type: 'UPDATE_EVIDENCE_ATTEMPT',
      record: { ...original, revisions: 3 },
    }).attempts).toEqual(state.attempts);
  });
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
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
          },
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

  it('removes stale active evidence after a rejected update but preserves the historical attempt', () => {
    const historical = {
      missionId: 'balance-delivery' as const,
      datasetId: 'balance-20-a' as const,
      selectedIds: ['redistribution-and-division'] as const,
      sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', ['redistribution-and-division']),
      level: 3 as const,
      revisions: 0,
    };
    const state = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'balance-delivery' as const,
        datasetId: 'balance-20-a' as const,
        stage: 'explain' as const,
        artifacts: {
          redistribution: {
            initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
          },
          calculations: {
            current: { target: 'current' as const, total: 20, count: 4, average: 5, verified: true },
          },
          evidence: { ...historical, revisions: 1 },
        },
        revisions: 1,
        transientFeedback: null,
      },
      attempts: { 'balance-20-a': historical },
    };
    const rejected = sessionReducer(state, {
      type: 'SUBMIT_EVIDENCE',
      record: { ...historical, sentence: '임의 문장', revisions: 1 },
    });
    expect(rejected.activeRun?.artifacts.evidence).toBeUndefined();
    expect(rejected.activeRun?.revisions).toBe(2);
    expect(rejected.activeRun?.transientFeedback).toEqual({
      isCorrect: false,
      message: '근거 문장을 다시 살펴보세요.',
      nextAction: '선택한 근거로 문장을 완성해 보세요.',
    });
    expect(rejected.attempts['balance-20-a']).toEqual(historical);
    expect(isLabSessionState(rejected)).toBe(true);
    const storage = new Map<string, string>();
    const webStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    };
    saveSession(webStorage, 'mean-balance-lab:test', rejected);
    expect(loadSession(webStorage, 'mean-balance-lab:test')).not.toBeNull();
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

  it('rejects mixed representative evidence and old-revision evidence at explain/result gates', () => {
    const base = {
      ...createInitialSession(),
      activeRun: {
        missionId: 'representative-review' as const,
        datasetId: 'review-cards-a' as const,
        stage: 'explain' as const,
        artifacts: {
          calculations: {
            current: { target: 'current' as const, total: 20, count: 5, average: 4, verified: true },
          },
        },
        revisions: 1,
        transientFeedback: null,
      },
    };
    const mixed = {
      missionId: 'representative-review' as const,
      datasetId: 'review-cards-a' as const,
      selectedIds: ['mean-use-and-limit', 'mean-always-enough'] as const,
      sentence: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.',
      level: 2 as const,
      revisions: 1,
    };
    const rejectedMixed = sessionReducer(base, { type: 'SUBMIT_EVIDENCE', record: mixed });
    expect(rejectedMixed.activeRun?.artifacts.evidence).toBeUndefined();
    expect(rejectedMixed.activeRun?.revisions).toBe(2);

    const valid = {
      ...mixed,
      selectedIds: ['mean-use-and-limit'] as const,
      sentence: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.',
      level: 2 as const,
      revisions: 0,
    };
    const oldRevision = { ...base, activeRun: { ...base.activeRun, artifacts: { ...base.activeRun.artifacts, evidence: valid } } };
    expect(canAdvance(oldRevision)).toEqual({ allowed: false, reason: '근거 문장을 완성해 보세요.' });
    const resultRun = { ...oldRevision, activeRun: { ...oldRevision.activeRun, stage: 'mission-result' as const } };
    expect(canAdvance(resultRun)).toEqual({ allowed: false, reason: '근거 문장을 다시 확인해 보세요.' });
  });

});
