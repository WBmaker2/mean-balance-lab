import { buildEvidenceSentence, deriveEvidenceLevel } from '../domain/evaluation';
import { getDataset, getMission, isDatasetId, isLearningStage, isMissionId } from '../content/missions';
import { mean, sum } from '../domain/math';
import type {
  CalculationTarget, ComparisonChoiceId, DatasetId, EvidenceChoiceId, EvidenceRecord,
  EvaluationResult, MissionId, PredictionValue, SaveMode,
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

const comparisonChoices = new Set<ComparisonChoiceId>([
  'same-mean', 'different-spread', 'same-shape', 'sum-changed-first', 'mean-changed-after',
  'range-or-individual-values', 'mean-always-enough',
]);
const evidenceChoices = new Set<EvidenceChoiceId>([
  'redistribution-and-division', 'redistribution-only', 'calculation-only',
  'same-mean-and-different-spread', 'same-mean-only', 'same-shape',
  'sum-change-and-mean-change', 'direction-only', 'guess-only',
  'mean-use-and-limit', 'range-or-individual-values', 'mean-always-enough',
]);
const evidenceChoicesByMission: Readonly<Record<MissionId, readonly EvidenceChoiceId[]>> = {
  'balance-delivery': ['redistribution-and-division', 'redistribution-only', 'calculation-only'],
  'mean-twins': ['same-mean-and-different-spread', 'same-mean-only', 'same-shape'],
  'outlier-alert': ['sum-change-and-mean-change', 'direction-only', 'guess-only'],
  'representative-review': ['mean-use-and-limit', 'range-or-individual-values', 'mean-always-enough'],
};
const calculationTargets = new Set<CalculationTarget>(['current', 'left', 'right', 'before', 'after']);

const isPrediction = (value: unknown): value is PredictionValue =>
  (isNatural(value) || value === 'increase' || value === 'decrease' || value === 'same');

const isEvaluationResult = (value: unknown): value is EvaluationResult => {
  if (!isRecord(value) || !hasExactKeys(value, ['isCorrect', 'message', 'nextAction'])) return false;
  return typeof value.isCorrect === 'boolean' && isString(value.message) && isString(value.nextAction);
};

const isEvidenceRecord = (
  value: unknown,
  expectedMissionId?: MissionId,
  expectedDatasetId?: DatasetId,
): value is EvidenceRecord => {
  if (!isRecord(value) || !hasExactKeys(value, ['missionId', 'datasetId', 'selectedIds', 'sentence', 'level', 'revisions'])) return false;
  if (!isMissionId(value.missionId as string) || !isDatasetId(value.datasetId as string)) return false;
  const missionId = value.missionId as MissionId;
  const datasetId = value.datasetId as DatasetId;
  if (expectedMissionId && missionId !== expectedMissionId) return false;
  if (expectedDatasetId && datasetId !== expectedDatasetId) return false;
  const mission = getMission(missionId);
  if (!mission.datasets.some((dataset) => dataset.id === datasetId)) return false;
  if (!Array.isArray(value.selectedIds) || value.selectedIds.length === 0) return false;
  if (new Set(value.selectedIds).size !== value.selectedIds.length
    || !value.selectedIds.every((id) => evidenceChoices.has(id as EvidenceChoiceId)
      && evidenceChoicesByMission[missionId].includes(id as EvidenceChoiceId))) return false;
  if (value.level !== 1 && value.level !== 2 && value.level !== 3) return false;
  if (!isNatural(value.revisions) || !isString(value.sentence)) return false;
  return value.sentence === buildEvidenceSentence(missionId, datasetId, value.selectedIds as EvidenceChoiceId[])
    && value.level === deriveEvidenceLevel(missionId, value.selectedIds as EvidenceChoiceId[]);
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

const isArtifacts = (value: unknown, run: { datasetId: DatasetId; stage: import('../domain/types').LearningStage }): value is StageArtifacts => {
  if (!isRecord(value)) return false;
  const allowed = ['prediction', 'redistribution', 'calculations', 'comparison', 'evidence'];
  if (!Object.keys(value).every((key) => allowed.includes(key))) return false;
  if ('prediction' in value) {
    if (!isRecord(value.prediction) || !hasExactKeys(value.prediction, ['value']) || !isPrediction(value.prediction.value)) return false;
  }
  if ('redistribution' in value) {
    const redistribution = value.redistribution;
    if (!isRecord(redistribution) || !hasExactKeys(redistribution, ['initialValues', 'currentValues', 'undoStack'])) return false;
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
      || !comparison.selectedIds.every((id) => comparisonChoices.has(id as ComparisonChoiceId))
      || typeof comparison.verified !== 'boolean') return false;
  }
  if ('evidence' in value && !isEvidenceRecord(value.evidence, getMissionForDataset(run.datasetId), run.datasetId)) return false;
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
    && isArtifacts(value.artifacts, { datasetId, stage });
};

export const isLabSessionState = (value: unknown): value is LabSessionState => {
  if (!isRecord(value) || !hasExactKeys(value, ['schemaVersion', 'saveMode', 'activeRun', 'attempts', 'completedRequiredMissions'])) return false;
  if (value.schemaVersion !== 1 || !isSaveMode(value.saveMode) || !(value.activeRun === null || isActiveRun(value.activeRun))) return false;
  if (!isRecord(value.attempts) || !Array.isArray(value.completedRequiredMissions)) return false;
  if (new Set(value.completedRequiredMissions).size !== value.completedRequiredMissions.length
    || !value.completedRequiredMissions.every((id) => isMissionId(id as string))) return false;
  for (const [datasetId, record] of Object.entries(value.attempts)) {
    if (!isDatasetId(datasetId) || !isEvidenceRecord(record, getMissionForDataset(datasetId), datasetId)) return false;
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
    artifacts.redistribution = {
      initialValues: [...run.artifacts.redistribution.initialValues],
      currentValues: [...run.artifacts.redistribution.currentValues],
      undoStack: run.artifacts.redistribution.undoStack.map((snapshot) => [...snapshot]),
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
