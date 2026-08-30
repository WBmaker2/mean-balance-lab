import { getDataset, getMission, isDatasetId, isMissionId } from '../content/missions';
import {
  evaluateCalculation, evaluateComparison, isAllowedComparisonSelection, isCanonicalEvidenceRecord,
} from './evaluation';
import { isBalanced, moveOne, sum, type QuantityMove } from './math';
import { isAllowedPrediction } from './prediction';
import type {
  CalculationTarget, ComparisonChoiceId, DatasetId, EvidenceRecord,
  EvaluationResult, LearningStage, MissionId, PredictionValue, SaveMode,
} from './types';
import type { CalculationInput } from './evaluation';

export interface CalculationArtifact {
  target: CalculationTarget;
  total: number;
  count: number;
  average: number;
  verified: boolean;
}

export interface StageArtifacts {
  prediction?: { value: PredictionValue };
  redistribution?: {
    initialValues: readonly number[];
    currentValues: readonly number[];
    undoStack: readonly (readonly number[])[];
    confirmed?: boolean;
  };
  calculations?: Partial<Record<CalculationTarget, CalculationArtifact>>;
  comparison?: { selectedIds: readonly ComparisonChoiceId[]; verified: boolean };
  evidence?: EvidenceRecord;
}

export type AdvanceGate = { allowed: true } | { allowed: false; reason: string };

export interface ActiveRun {
  missionId: MissionId;
  datasetId: DatasetId;
  stage: LearningStage;
  artifacts: StageArtifacts;
  revisions: number;
  transientFeedback: EvaluationResult | null;
}

export interface LabSessionState {
  schemaVersion: 1;
  saveMode: SaveMode;
  activeRun: ActiveRun | null;
  attempts: Partial<Record<DatasetId, EvidenceRecord>>;
  completedRequiredMissions: readonly MissionId[];
}

export type LabAction =
  | { type: 'START_DATASET'; missionId: MissionId; datasetId: DatasetId }
  | { type: 'SET_PREDICTION'; value: PredictionValue }
  | { type: 'MOVE_ONE'; move: QuantityMove }
  | { type: 'UNDO_MOVE' }
  | { type: 'RESET_REDISTRIBUTION' }
  | { type: 'CONFIRM_REDISTRIBUTION' }
  | { type: 'SUBMIT_CALCULATION'; target: CalculationTarget; input: CalculationInput }
  | { type: 'SET_COMPARISON'; selectedIds: readonly ComparisonChoiceId[] }
  | { type: 'SUBMIT_EVIDENCE'; record: EvidenceRecord }
  | { type: 'UPDATE_EVIDENCE_ATTEMPT'; record: EvidenceRecord }
  | { type: 'ADVANCE_STAGE' }
  | { type: 'SET_SAVE_MODE'; mode: SaveMode }
  | { type: 'RESET_ACTIVE_DATASET' }
  | { type: 'RESET_ALL' };

const failure = (message: string, nextAction: string): EvaluationResult => ({
  isCorrect: false, message, nextAction,
});

const makeActiveRun = (missionId: MissionId, datasetId: DatasetId): ActiveRun => {
  const dataset = getDataset(datasetId);
  const artifacts: StageArtifacts = dataset.kind === 'balance'
    ? { redistribution: { initialValues: [...dataset.values], currentValues: [...dataset.values], undoStack: [] } }
    : {};
  return { missionId, datasetId, stage: 'situation', artifacts, revisions: 0, transientFeedback: null };
};

export const createInitialSession = (): LabSessionState => ({
  schemaVersion: 1,
  saveMode: 'tab',
  activeRun: null,
  attempts: {},
  completedRequiredMissions: [],
});

const withRun = (state: LabSessionState, run: ActiveRun): LabSessionState => ({ ...state, activeRun: run });

const incrementRevision = (run: ActiveRun, transientFeedback: EvaluationResult): ActiveRun => ({
  ...run,
  revisions: run.revisions + 1,
  transientFeedback,
});

const valuesForTarget = (run: ActiveRun, target: CalculationTarget): readonly number[] | null => {
  const dataset = getDataset(run.datasetId);
  if (dataset.kind === 'balance' || dataset.kind === 'representativeness') {
    if (target !== 'current') return null;
    return dataset.kind === 'balance'
      ? run.artifacts.redistribution?.currentValues ?? dataset.values
      : dataset.values;
  }
  if (dataset.kind === 'twins') {
    if (target === 'left') return dataset.leftValues;
    if (target === 'right') return dataset.rightValues;
    return null;
  }
  if (target === 'before') return dataset.beforeValues;
  if (target === 'after') return dataset.afterValues;
  return null;
};

const requiredTargets = (run: ActiveRun): readonly CalculationTarget[] => {
  const kind = getDataset(run.datasetId).kind;
  if (kind === 'twins') return ['left', 'right'];
  if (kind === 'outlier') return ['before', 'after'];
  return ['current'];
};

export const canAdvance = (state: LabSessionState): AdvanceGate => {
  const run = state.activeRun;
  if (!run) return { allowed: false, reason: '먼저 미션 자료를 선택해 보세요.' };
  switch (run.stage) {
    case 'situation':
      return { allowed: true };
    case 'predict':
      return run.artifacts.prediction
        ? { allowed: true }
        : { allowed: false, reason: '먼저 평균을 예측해 보세요.' };
    case 'redistribute': {
      const redistribution = run.artifacts.redistribution;
      if (!redistribution) return { allowed: false, reason: '자료를 고르게 옮겨 보세요.' };
      if (sum(redistribution.currentValues) !== sum(redistribution.initialValues)) {
        return { allowed: false, reason: '전체 양을 그대로 보존해 보세요.' };
      }
      return isBalanced(redistribution.currentValues)
        && redistribution.confirmed === true
        ? { allowed: true }
        : { allowed: false, reason: '자료를 고르게 옮겨 보세요.' };
    }
    case 'calculate': {
      const missing = requiredTargets(run).filter((target) => run.artifacts.calculations?.[target]?.verified !== true);
      if (missing.length === 0) {
        return { allowed: true };
      }
      if (missing.length > 1) {
        const kind = getDataset(run.datasetId).kind;
        if (kind === 'twins') return { allowed: false, reason: '자료 A와 자료 B의 평균을 각각 계산해 보세요.' };
        if (kind === 'outlier') return { allowed: false, reason: '변경 전과 후의 평균을 각각 계산해 보세요.' };
      }
      return { allowed: false, reason: '평균 계산을 확인해 보세요.' };
    }
    case 'compare':
      return run.artifacts.comparison?.verified === true
        && evaluateComparison(getDataset(run.datasetId), run.artifacts.comparison.selectedIds).isCorrect
        ? { allowed: true }
        : { allowed: false, reason: '비교할 근거를 선택해 보세요.' };
    case 'explain':
      return run.artifacts.evidence
        && isCanonicalEvidenceRecord(run.artifacts.evidence, run.missionId, run.datasetId, run.revisions)
        ? { allowed: true }
        : { allowed: false, reason: '근거 문장을 완성해 보세요.' };
    case 'mission-result':
      return run.artifacts.evidence
        && isCanonicalEvidenceRecord(run.artifacts.evidence, run.missionId, run.datasetId, run.revisions)
        ? { allowed: true }
        : { allowed: false, reason: '근거 문장을 다시 확인해 보세요.' };
  }
};

const markRequiredMission = (state: LabSessionState, run: ActiveRun): LabSessionState => {
  const mission = getMission(run.missionId);
  if (run.datasetId !== mission.requiredDatasetId || state.completedRequiredMissions.includes(run.missionId)) return state;
  return { ...state, completedRequiredMissions: [...state.completedRequiredMissions, run.missionId] };
};

const resetActive = (state: LabSessionState): LabSessionState =>
  state.activeRun ? { ...state, activeRun: makeActiveRun(state.activeRun.missionId, state.activeRun.datasetId) } : state;

const isEvidenceSubmission = (run: ActiveRun, record: EvidenceRecord): boolean => {
  return isCanonicalEvidenceRecord(record, run.missionId, run.datasetId, run.revisions);
};

const clearActiveEvidence = (run: ActiveRun): ActiveRun => {
  if (!run.artifacts.evidence) return run;
  const { evidence: _evidence, ...artifacts } = run.artifacts;
  return { ...run, artifacts };
};

export const sessionReducer = (state: LabSessionState, action: LabAction): LabSessionState => {
  switch (action.type) {
    case 'START_DATASET': {
      if (!isMissionId(action.missionId) || !isDatasetId(action.datasetId)) return state;
      const mission = getMission(action.missionId);
      if (!mission.datasets.some((dataset) => dataset.id === action.datasetId)) return state;
      return { ...state, activeRun: makeActiveRun(action.missionId, action.datasetId) };
    }
    case 'SET_PREDICTION': {
      if (!state.activeRun || state.activeRun.stage !== 'predict') return state;
      if (!isAllowedPrediction(getDataset(state.activeRun.datasetId), action.value)) return state;
      return withRun(state, {
        ...state.activeRun,
        artifacts: { ...state.activeRun.artifacts, prediction: { value: action.value } },
        transientFeedback: null,
      });
    }
    case 'MOVE_ONE': {
      const run = state.activeRun;
      const redistribution = run?.artifacts.redistribution;
      if (!run || run.stage !== 'redistribute' || !redistribution) return state;
      const result = moveOne(redistribution.currentValues, action.move);
      if (!result.ok) return state;
      return withRun(state, {
        ...run,
        artifacts: {
          ...run.artifacts,
          redistribution: {
            initialValues: redistribution.initialValues,
            currentValues: result.values,
            undoStack: [...redistribution.undoStack, [...redistribution.currentValues]],
          },
        },
        transientFeedback: null,
      });
    }
    case 'UNDO_MOVE': {
      const run = state.activeRun;
      const redistribution = run?.artifacts.redistribution;
      if (!run || run.stage !== 'redistribute' || !redistribution || redistribution.undoStack.length === 0) return state;
      const stack = [...redistribution.undoStack];
      const previous = stack.pop();
      if (!previous) return state;
      return withRun(state, {
        ...run,
        artifacts: {
          ...run.artifacts,
          redistribution: { ...redistribution, currentValues: previous, undoStack: stack },
        },
      });
    }
    case 'RESET_REDISTRIBUTION': {
      const run = state.activeRun;
      const redistribution = run?.artifacts.redistribution;
      if (!run || run.stage !== 'redistribute' || !redistribution) return state;
      return withRun(state, {
        ...run,
        artifacts: {
          ...run.artifacts,
          redistribution: {
            initialValues: [...redistribution.initialValues],
            currentValues: [...redistribution.initialValues],
            undoStack: [],
          },
        },
        transientFeedback: null,
      });
    }
    case 'CONFIRM_REDISTRIBUTION': {
      const run = state.activeRun;
      const redistribution = run?.artifacts.redistribution;
      if (!run || run.stage !== 'redistribute' || !redistribution) return state;
      if (sum(redistribution.currentValues) !== sum(redistribution.initialValues)
        || !isBalanced(redistribution.currentValues)) return state;
      return withRun(state, {
        ...run,
        artifacts: {
          ...run.artifacts,
          redistribution: { ...redistribution, confirmed: true },
        },
        transientFeedback: null,
      });
    }
    case 'SUBMIT_CALCULATION': {
      const run = state.activeRun;
      if (!run) return state;
      if (run.stage !== 'calculate') {
        return withRun(state, incrementRevision(run, failure('아직 계산 단계가 아니에요.', '계산 단계에서 평균을 확인해 보세요.')));
      }
      const canonicalValues = valuesForTarget(run, action.target);
      if (!canonicalValues) {
        return withRun(state, incrementRevision(run, failure('평균 계산을 다시 확인해 보세요.', '현재 자료의 평균을 계산해 보세요.')));
      }
      const result = evaluateCalculation({ ...action.input, values: canonicalValues });
      const artifact: CalculationArtifact = {
        target: action.target,
        total: action.input.enteredTotal,
        count: action.input.enteredCount,
        average: action.input.enteredMean,
        verified: result.isCorrect,
      };
      const calculations = { ...(run.artifacts.calculations ?? {}), [action.target]: artifact };
      const nextRun = { ...run, artifacts: { ...run.artifacts, calculations }, transientFeedback: result };
      return result.isCorrect ? withRun(state, nextRun) : withRun(state, incrementRevision(nextRun, result));
    }
    case 'SET_COMPARISON': {
      const run = state.activeRun;
      if (!run) return state;
      if (run.stage !== 'compare') {
        return withRun(state, incrementRevision(run, failure('아직 비교 단계가 아니에요.', '비교 단계에서 자료를 살펴보세요.')));
      }
      const selectedIds = [...new Set(action.selectedIds)];
      const dataset = getDataset(run.datasetId);
      if (!isAllowedComparisonSelection(dataset, selectedIds)) {
        return withRun(state, incrementRevision(run, failure('비교 선택을 다시 살펴보세요.', '자료를 비교할 근거를 선택해 보세요.')));
      }
      const result = evaluateComparison(dataset, selectedIds);
      const nextRun = {
        ...run,
        artifacts: { ...run.artifacts, comparison: { selectedIds, verified: result.isCorrect } },
        transientFeedback: result,
      };
      return result.isCorrect ? withRun(state, nextRun) : withRun(state, incrementRevision(nextRun, result));
    }
    case 'SUBMIT_EVIDENCE': {
      const run = state.activeRun;
      if (!run) return state;
      if (run.stage !== 'explain') {
        return withRun(state, incrementRevision(run, failure('아직 설명 단계가 아니에요.', '설명 단계에서 근거 문장을 완성해 보세요.')));
      }
      if (!isEvidenceSubmission(run, action.record)) {
        const rejectedRun = clearActiveEvidence(run);
        return withRun(state, incrementRevision(rejectedRun, failure('근거 문장을 다시 살펴보세요.', '선택한 근거로 문장을 완성해 보세요.')));
      }
      const attempts = { ...state.attempts, [run.datasetId]: action.record };
      return withRun({ ...state, attempts }, { ...run, artifacts: { ...run.artifacts, evidence: action.record }, transientFeedback: null });
    }
    case 'UPDATE_EVIDENCE_ATTEMPT': {
      const existing = state.attempts[action.record.datasetId];
      if (!existing || existing.datasetId !== action.record.datasetId
        || !isCanonicalEvidenceRecord(existing, existing.missionId, existing.datasetId, existing.revisions)) return state;
      if (!isCanonicalEvidenceRecord(action.record, existing.missionId, existing.datasetId, existing.revisions)) return state;
      const activeRun = state.activeRun;
      const sameActiveEvidence = activeRun
        && activeRun.missionId === existing.missionId
        && activeRun.datasetId === existing.datasetId
        && activeRun.artifacts.evidence
        && isCanonicalEvidenceRecord(activeRun.artifacts.evidence, activeRun.missionId, activeRun.datasetId, activeRun.revisions)
        && activeRun.revisions === existing.revisions;
      return {
        ...state,
        attempts: { ...state.attempts, [action.record.datasetId]: action.record },
        ...(sameActiveEvidence && activeRun
          ? { activeRun: { ...activeRun, artifacts: { ...activeRun.artifacts, evidence: action.record } } }
          : {}),
      };
    }
    case 'ADVANCE_STAGE': {
      const run = state.activeRun;
      if (!run || !canAdvance(state).allowed) return state;
      const stages = getDataset(run.datasetId).stages;
      const index = stages.indexOf(run.stage);
      const nextStage = stages[index + 1];
      if (!nextStage) return state;
      const nextRun = { ...run, stage: nextStage, transientFeedback: null };
      return nextStage === 'mission-result' ? markRequiredMission(withRun(state, nextRun), nextRun) : withRun(state, nextRun);
    }
    case 'SET_SAVE_MODE':
      return { ...state, saveMode: action.mode };
    case 'RESET_ACTIVE_DATASET':
      return resetActive(state);
    case 'RESET_ALL':
      return createInitialSession();
    default:
      return state;
  }
};
