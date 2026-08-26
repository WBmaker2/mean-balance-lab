import { getDataset, getMission, isDatasetId, isMissionId } from '../content/missions';
import { buildEvidenceSentence, deriveEvidenceLevel, evaluateCalculation, evaluateComparison } from './evaluation';
import { isBalanced, moveOne, sum, type QuantityMove } from './math';
import type {
  CalculationTarget, ComparisonChoiceId, DatasetId, EvidenceChoiceId, EvidenceRecord,
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
  | { type: 'SUBMIT_CALCULATION'; target: CalculationTarget; input: CalculationInput }
  | { type: 'SET_COMPARISON'; selectedIds: readonly ComparisonChoiceId[] }
  | { type: 'SUBMIT_EVIDENCE'; record: EvidenceRecord }
  | { type: 'ADVANCE_STAGE' }
  | { type: 'SET_SAVE_MODE'; mode: SaveMode }
  | { type: 'RESET_ACTIVE_DATASET' }
  | { type: 'RESET_ALL' }
  | { type: 'RESTORE'; state: LabSessionState };

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
        ? { allowed: true }
        : { allowed: false, reason: '자료를 고르게 옮겨 보세요.' };
    }
    case 'calculate': {
      const missing = requiredTargets(run).filter((target) => run.artifacts.calculations?.[target]?.verified !== true);
      if (missing.length === 0) return { allowed: true };
      if (missing.length > 1) {
        const kind = getDataset(run.datasetId).kind;
        if (kind === 'twins') return { allowed: false, reason: '자료 A와 자료 B의 평균을 각각 계산해 보세요.' };
        if (kind === 'outlier') return { allowed: false, reason: '변경 전과 후의 평균을 각각 계산해 보세요.' };
      }
      return { allowed: false, reason: '평균 계산을 확인해 보세요.' };
    }
    case 'compare':
      return run.artifacts.comparison?.verified
        ? { allowed: true }
        : { allowed: false, reason: '비교할 근거를 선택해 보세요.' };
    case 'explain':
      return run.artifacts.evidence
        ? { allowed: true }
        : { allowed: false, reason: '근거 문장을 완성해 보세요.' };
    case 'mission-result':
      return { allowed: true };
  }
};

const markRequiredMission = (state: LabSessionState, run: ActiveRun): LabSessionState => {
  const mission = getMission(run.missionId);
  if (run.datasetId !== mission.requiredDatasetId || state.completedRequiredMissions.includes(run.missionId)) return state;
  return { ...state, completedRequiredMissions: [...state.completedRequiredMissions, run.missionId] };
};

const resetActive = (state: LabSessionState): LabSessionState =>
  state.activeRun ? { ...state, activeRun: makeActiveRun(state.activeRun.missionId, state.activeRun.datasetId) } : state;

const comparisonChoices = new Set<ComparisonChoiceId>([
  'same-mean', 'different-spread', 'same-shape', 'sum-changed-first', 'mean-changed-after',
  'range-or-individual-values', 'mean-always-enough',
]);

const evidenceChoicesByMission: Readonly<Record<MissionId, readonly EvidenceChoiceId[]>> = {
  'balance-delivery': ['redistribution-and-division', 'redistribution-only', 'calculation-only'],
  'mean-twins': ['same-mean-and-different-spread', 'same-mean-only', 'same-shape'],
  'outlier-alert': ['sum-change-and-mean-change', 'direction-only', 'guess-only'],
  'representative-review': ['mean-use-and-limit', 'range-or-individual-values', 'mean-always-enough'],
};

const isEvidenceSubmission = (run: ActiveRun, record: EvidenceRecord): boolean => {
  if (record.missionId !== run.missionId || record.datasetId !== run.datasetId) return false;
  if (record.selectedIds.length === 0 || new Set(record.selectedIds).size !== record.selectedIds.length) return false;
  if (!record.selectedIds.every((id) => evidenceChoicesByMission[run.missionId].includes(id))) return false;
  const expectedSentence = buildEvidenceSentence(run.missionId, run.datasetId, record.selectedIds);
  return record.sentence === expectedSentence && record.level === deriveEvidenceLevel(run.missionId, record.selectedIds);
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
      if (!action.selectedIds.every((id) => comparisonChoices.has(id))) {
        return withRun(state, incrementRevision(run, failure('비교 선택을 다시 살펴보세요.', '자료를 비교할 근거를 선택해 보세요.')));
      }
      const result = evaluateComparison(getDataset(run.datasetId), action.selectedIds);
      const nextRun = {
        ...run,
        artifacts: { ...run.artifacts, comparison: { selectedIds: [...action.selectedIds], verified: result.isCorrect } },
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
        return withRun(state, incrementRevision(run, failure('근거 문장을 다시 살펴보세요.', '선택한 근거로 문장을 완성해 보세요.')));
      }
      const attempts = { ...state.attempts, [run.datasetId]: action.record };
      return withRun({ ...state, attempts }, { ...run, artifacts: { ...run.artifacts, evidence: action.record }, transientFeedback: null });
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
    case 'RESTORE':
      return action.state;
  }
};
