export type MissionId =
  | 'balance-delivery'
  | 'mean-twins'
  | 'outlier-alert'
  | 'representative-review';

export type DatasetId =
  | 'balance-20-a'
  | 'balance-24-b'
  | 'twins-4-a'
  | 'twins-6-b'
  | 'outlier-5-a'
  | 'outlier-6-b'
  | 'review-cards-a'
  | 'review-baskets-b';

export type LearningStage =
  | 'situation'
  | 'predict'
  | 'redistribute'
  | 'calculate'
  | 'compare'
  | 'explain'
  | 'mission-result';

export type BoxPattern = 'dots' | 'stripes' | 'grid' | 'waves';
export type SaveMode = 'tab' | 'device';
export type EvidenceLevel = 1 | 2 | 3;
export type CalculationTarget = 'current' | 'left' | 'right' | 'before' | 'after';
export type PredictionValue = number | 'increase' | 'decrease' | 'same';

export type ComparisonChoiceId =
  | 'same-mean'
  | 'different-spread'
  | 'same-shape'
  | 'sum-changed-first'
  | 'mean-changed-after'
  | 'range-or-individual-values'
  | 'mean-always-enough';

export interface BaseDataset {
  id: DatasetId;
  label: string;
  context: string;
  stages: readonly LearningStage[];
  expectedMean: number;
}

export interface BalanceDataset extends BaseDataset {
  kind: 'balance';
  values: readonly number[];
  targetValues: readonly number[];
}

export interface TwinDataset extends BaseDataset {
  kind: 'twins';
  leftValues: readonly number[];
  rightValues: readonly number[];
}

export interface OutlierDataset extends BaseDataset {
  kind: 'outlier';
  beforeValues: readonly number[];
  afterValues: readonly number[];
  changedIndex: number;
}

export interface ReviewDataset extends BaseDataset {
  kind: 'representativeness';
  values: readonly number[];
  acceptedEvidenceIds: readonly EvidenceChoiceId[];
  modelSentence: string;
}

export type MissionDataset =
  | BalanceDataset
  | TwinDataset
  | OutlierDataset
  | ReviewDataset;

export interface MissionDefinition {
  id: MissionId;
  title: string;
  learningGoal: string;
  requiredDatasetId: DatasetId;
  datasets: readonly MissionDataset[];
}

export type EvidenceChoiceId =
  | 'redistribution-and-division'
  | 'redistribution-only'
  | 'calculation-only'
  | 'same-mean-and-different-spread'
  | 'same-mean-only'
  | 'same-shape'
  | 'sum-change-and-mean-change'
  | 'direction-only'
  | 'guess-only'
  | 'mean-use-and-limit'
  | 'range-or-individual-values'
  | 'mean-always-enough';

export interface EvaluationResult {
  isCorrect: boolean;
  message: string;
  nextAction: string;
}

export interface EvidenceRecord {
  missionId: MissionId;
  datasetId: DatasetId;
  selectedIds: readonly EvidenceChoiceId[];
  sentence: string;
  level: EvidenceLevel;
  revisions: number;
}
