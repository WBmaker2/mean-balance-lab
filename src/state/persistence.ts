import {
  evaluateComparison, isAllowedComparisonSelection, isCanonicalEvidenceRecord,
} from '../domain/evaluation';
import { getDataset, getMission, isDatasetId, isLearningStage, isMissionId } from '../content/missions';
import { mean, sum } from '../domain/math';
import { isAllowedPrediction } from '../domain/prediction';
import type {
  CalculationTarget, ComparisonChoiceId, DatasetId,
  EvaluationResult, MissionId, SaveMode,
} from '../domain/types';
import type { ActiveRun, CalculationArtifact, LabSessionState, StageArtifacts } from '../domain/session';

export const TAB_STORAGE_KEY = 'mean-balance-lab:tab:v1';
export const DEVICE_STORAGE_KEY = 'mean-balance-lab:device:v1';

export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const expected = new Set(keys);
  return Object.keys(value).length === expected.size && Object.keys(value).every((key) => expected.has(key));
};

const isNatural = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isString = (value: unknown): value is string => typeof value === 'string';
const isSaveMode = (value: unknown): value is SaveMode => value === 'tab' || value === 'device';

const calculationTargets = new Set<CalculationTarget>(['current', 'left', 'right', 'before', 'after']);

const isEvaluationResult = (value: unknown): value is EvaluationResult => {
  if (!isRecord(value) || !hasExactKeys(value, ['isCorrect', 'message', 'nextAction'])) return false;
  return typeof value.isCorrect === 'boolean' && isString(value.message) && isString(value.nextAction);
};

const isCalculationArtifact = (value: unknown, target: CalculationTarget): value is CalculationArtifact => {
  if (!isRecord(value) || !hasExactKeys(value, ['target', 'total', 'count', 'average', 'verified'])) return false;
  return value.target === target && isNatural(value.total) && isNatural(value.count)
    && isNatural(value.average) && typeof value.verified === 'boolean';
};

const requiredCalculationTargets = (datasetId: DatasetId): readonly CalculationTarget[] => {
  const kind = getDataset(datasetId).kind;
  if (kind === 'twins') return ['left', 'right'];
  if (kind === 'outlier') return ['before', 'after'];
  return ['current'];
};

const canonicalValuesForTarget = (
  datasetId: DatasetId,
  target: CalculationTarget,
  redistribution: Record<string, unknown> | undefined,
): readonly number[] | null => {
  const dataset = getDataset(datasetId);
  if (dataset.kind === 'balance') {
    if (target !== 'current' || !redistribution || !Array.isArray(redistribution.currentValues)) return null;
    return redistribution.currentValues.every(isNatural) ? redistribution.currentValues : null;
  }
  if (dataset.kind === 'representativeness') return target === 'current' ? dataset.values : null;
  if (dataset.kind === 'twins') {
    if (target === 'left') return dataset.leftValues;
    if (target === 'right') return dataset.rightValues;
    return null;
  }
  if (target === 'before') return dataset.beforeValues;
  if (target === 'after') return dataset.afterValues;
  return null;
};

const isArtifacts = (value: unknown, run: {
  missionId: MissionId;
  datasetId: DatasetId;
  stage: import('../domain/types').LearningStage;
  revisions: number;
}): value is StageArtifacts => {
  if (!isRecord(value)) return false;
  const allowed = ['prediction', 'redistribution', 'calculations', 'comparison', 'evidence'];
  if (!Object.keys(value).every((key) => allowed.includes(key))) return false;
  if ('prediction' in value) {
    if (!isRecord(value.prediction) || !hasExactKeys(value.prediction, ['value'])
      || !isAllowedPrediction(getDataset(run.datasetId), value.prediction.value)) return false;
  }
  if ('redistribution' in value) {
    const redistribution = value.redistribution;
    if (!isRecord(redistribution)) return false;
    const redistributionKeys = ['initialValues', 'currentValues', 'undoStack'];
    const hasConfirmed = Object.keys(redistribution).includes('confirmed');
    if (!(hasExactKeys(redistribution, redistributionKeys)
      || (hasConfirmed && hasExactKeys(redistribution, [...redistributionKeys, 'confirmed'])))) return false;
    if (hasConfirmed && typeof redistribution.confirmed !== 'boolean') return false;
    const initial = redistribution.initialValues;
    const current = redistribution.currentValues;
    const undo = redistribution.undoStack;
    if (!Array.isArray(initial) || !Array.isArray(current) || !Array.isArray(undo)
      || initial.length === 0 || initial.length !== current.length
      || !initial.every(isNatural) || !current.every(isNatural) || !undo.every((snapshot) =>
        Array.isArray(snapshot) && snapshot.length === initial.length && snapshot.every(isNatural))) return false;
    const dataset = getDataset(run.datasetId);
    if (dataset.kind !== 'balance'
      || initial.length !== dataset.values.length
      || !initial.every((item, index) => item === dataset.values[index])
      || initial.reduce((a: number, b: number) => a + b, 0) !== current.reduce((a: number, b: number) => a + b, 0)
      || !undo.every((snapshot) => snapshot.reduce((a: number, b: number) => a + b, 0)
        === initial.reduce((a: number, b: number) => a + b, 0))) return false;
  }
  if ('calculations' in value) {
    if (!isRecord(value.calculations)) return false;
    for (const [target, artifact] of Object.entries(value.calculations)) {
      if (!calculationTargets.has(target as CalculationTarget) || !isCalculationArtifact(artifact, target as CalculationTarget)) return false;
      const canonical = canonicalValuesForTarget(run.datasetId, target as CalculationTarget,
        'redistribution' in value && isRecord(value.redistribution) ? value.redistribution : undefined);
      if (!canonical) return false;
      if (artifact.verified && (artifact.total !== sum(canonical)
        || artifact.count !== canonical.length || artifact.average !== mean(canonical))) return false;
    }
    if (['compare', 'explain', 'mission-result'].includes(run.stage)) {
      const expected = requiredCalculationTargets(run.datasetId);
      const actual = Object.keys(value.calculations) as CalculationTarget[];
      if (actual.length !== expected.length || !expected.every((target) => actual.includes(target))) return false;
      const calculations = value.calculations;
      if (!expected.every((target) => isRecord(calculations[target]) && calculations[target].verified === true)) return false;
    }
  }
  if (['compare', 'explain', 'mission-result'].includes(run.stage)) {
    const calculations = value.calculations;
    if (!isRecord(calculations)) return false;
  }
  if ('comparison' in value) {
    const comparison = value.comparison;
    if (!isRecord(comparison) || !hasExactKeys(comparison, ['selectedIds', 'verified'])
      || !Array.isArray(comparison.selectedIds) || new Set(comparison.selectedIds).size !== comparison.selectedIds.length
      || typeof comparison.verified !== 'boolean') return false;
    const dataset = getDataset(run.datasetId);
    const selectedIds = comparison.selectedIds as ComparisonChoiceId[];
    if (!isAllowedComparisonSelection(dataset, selectedIds)) return false;
    if (comparison.verified && !evaluateComparison(dataset, selectedIds).isCorrect) return false;
  }
  if ('evidence' in value) {
    if (!['explain', 'mission-result'].includes(run.stage)
      || !isCanonicalEvidenceRecord(value.evidence, run.missionId, run.datasetId, run.revisions)) return false;
  }
  return true;
};

const getMissionForDataset = (datasetId: DatasetId): MissionId => {
  const mission = [
    'balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review',
  ].map((id) => getMission(id as MissionId)).find((item) => item.datasets.some((dataset) => dataset.id === datasetId));
  if (!mission) throw new Error(`Unknown dataset: ${datasetId}`);
  return mission.id;
};

const isActiveRun = (value: unknown): value is ActiveRun => {
  if (!isRecord(value) || !hasExactKeys(value, ['missionId', 'datasetId', 'stage', 'artifacts', 'revisions', 'transientFeedback'])) return false;
  if (!isMissionId(value.missionId as string) || !isDatasetId(value.datasetId as string) || !isLearningStage(value.stage as string)) return false;
  const missionId = value.missionId as MissionId;
  const datasetId = value.datasetId as DatasetId;
  const stage = value.stage as import('../domain/types').LearningStage;
  const mission = getMission(missionId);
  const dataset = mission.datasets.find((item) => item.id === datasetId);
  if (!dataset || !dataset.stages.includes(stage)) return false;
  return isNatural(value.revisions) && (value.transientFeedback === null || isEvaluationResult(value.transientFeedback))
    && isArtifacts(value.artifacts, { missionId, datasetId, stage, revisions: value.revisions });
};

export const isLabSessionState = (value: unknown): value is LabSessionState => {
  if (!isRecord(value) || !hasExactKeys(value, ['schemaVersion', 'saveMode', 'activeRun', 'attempts', 'completedRequiredMissions'])) return false;
  if (value.schemaVersion !== 1 || !isSaveMode(value.saveMode) || !(value.activeRun === null || isActiveRun(value.activeRun))) return false;
  if (!isRecord(value.attempts) || !Array.isArray(value.completedRequiredMissions)) return false;
  if (new Set(value.completedRequiredMissions).size !== value.completedRequiredMissions.length
    || !value.completedRequiredMissions.every((id) => isMissionId(id as string))) return false;
  for (const [datasetId, record] of Object.entries(value.attempts)) {
    if (!isDatasetId(datasetId) || !isCanonicalEvidenceRecord(record, getMissionForDataset(datasetId), datasetId)) return false;
  }
  return true;
};

export const sanitizeRestoredSession = (state: LabSessionState): LabSessionState => {
  if (!state.activeRun) return {
    ...state, attempts: { ...state.attempts }, completedRequiredMissions: [...state.completedRequiredMissions],
  };
  const run = state.activeRun;
  const artifacts: StageArtifacts = { ...run.artifacts };
  if (run.artifacts.prediction) artifacts.prediction = { value: run.artifacts.prediction.value };
  if (run.artifacts.redistribution) {
    const confirmed = run.artifacts.redistribution.confirmed;
    artifacts.redistribution = {
      initialValues: [...run.artifacts.redistribution.initialValues],
      currentValues: [...run.artifacts.redistribution.currentValues],
      undoStack: run.artifacts.redistribution.undoStack.map((snapshot) => [...snapshot]),
      ...(confirmed !== undefined ? { confirmed } : {}),
    };
  }
  if (run.artifacts.calculations) {
    const calculations = Object.fromEntries(Object.entries(run.artifacts.calculations).map(([target, artifact]) => [
      target, artifact ? { ...artifact, ...(run.stage === 'calculate' ? { verified: false } : {}) } : artifact,
    ])) as NonNullable<StageArtifacts['calculations']>;
    artifacts.calculations = calculations;
  }
  if (run.artifacts.comparison) artifacts.comparison = {
    selectedIds: [...run.artifacts.comparison.selectedIds], verified: run.artifacts.comparison.verified,
  };
  if (run.artifacts.evidence) artifacts.evidence = {
    ...run.artifacts.evidence, selectedIds: [...run.artifacts.evidence.selectedIds],
  };
  return {
    ...state,
    activeRun: { ...run, artifacts, transientFeedback: null },
    attempts: Object.fromEntries(Object.entries(state.attempts).map(([id, record]) => [
      id, record ? { ...record, selectedIds: [...record.selectedIds] } : record,
    ])),
    completedRequiredMissions: [...state.completedRequiredMissions],
  };
};

export const loadSession = (storage: WebStorageLike, key: string): LabSessionState | null => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isLabSessionState(parsed) ? sanitizeRestoredSession(parsed) : null;
  } catch {
    return null;
  }
};

export const saveSession = (storage: WebStorageLike, key: string, state: LabSessionState): void => {
  if (!isLabSessionState(state)) return;
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage can be unavailable or full. The activity remains usable in memory.
  }
};
