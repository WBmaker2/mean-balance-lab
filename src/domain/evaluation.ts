import { getMission, isDatasetId, isMissionId } from '../content/missions';
import {
  buildBalanceCalculationSentence,
  buildBalanceEvidenceSentence,
  buildOutlierEvidenceSentence,
  buildRepresentativeEvidenceSentence,
  buildTwinsEvidenceSentence,
  buildTwinsMeanSentence,
  CALCULATION_COPY,
  COMPARISON_COPY,
  EVIDENCE_FRAGMENTS,
} from '../content/copy';
import { mean, range, sum } from './math';
import type {
  ComparisonChoiceId,
  DatasetId,
  EvidenceChoiceId,
  EvidenceLevel,
  EvaluationResult,
  MissionDataset,
  MissionId,
} from './types';

export const COMPARISON_CHOICE_IDS_BY_KIND: Readonly<Record<MissionDataset['kind'], readonly ComparisonChoiceId[]>> = {
  balance: [],
  twins: ['same-mean', 'different-spread', 'same-shape'],
  outlier: ['sum-changed-first', 'mean-changed-after'],
  representativeness: ['range-or-individual-values', 'mean-always-enough'],
};

export const isAllowedComparisonSelection = (
  dataset: MissionDataset,
  selectedIds: readonly ComparisonChoiceId[],
): boolean => selectedIds.length > 0
  && new Set(selectedIds).size === selectedIds.length
  && selectedIds.every((id) => COMPARISON_CHOICE_IDS_BY_KIND[dataset.kind].includes(id));

export interface CalculationInput {
  values: readonly number[];
  enteredTotal: number;
  enteredCount: number;
  enteredMean: number;
}

const result = (
  isCorrect: boolean,
  message: string,
  nextAction: string,
): EvaluationResult => ({ isCorrect, message, nextAction });

const hasChoice = (
  selectedIds: readonly ComparisonChoiceId[] | readonly EvidenceChoiceId[],
  choice: ComparisonChoiceId | EvidenceChoiceId,
): boolean => selectedIds.includes(choice as never);

export const MISSION_EVIDENCE_IDS: Readonly<Record<MissionId, readonly EvidenceChoiceId[]>> = {
  'balance-delivery': ['redistribution-and-division', 'redistribution-only', 'calculation-only'],
  'mean-twins': ['same-mean-and-different-spread', 'same-mean-only', 'same-shape'],
  'outlier-alert': ['sum-change-and-mean-change', 'direction-only', 'guess-only'],
  'representative-review': ['mean-use-and-limit', 'range-or-individual-values', 'mean-always-enough'],
};

/** 미션별 근거 루브릭의 허용 조합만 통과시키는 공유 계약입니다. */
export const isAllowedEvidenceSelection = (
  missionId: MissionId,
  selectedIds: readonly EvidenceChoiceId[],
): boolean => {
  if (selectedIds.length === 0 || new Set(selectedIds).size !== selectedIds.length) return false;
  if (!selectedIds.every((id) => MISSION_EVIDENCE_IDS[missionId].includes(id))) return false;
  if (missionId !== 'representative-review') return selectedIds.length === 1;
  const selected = new Set(selectedIds);
  if (selected.has('mean-always-enough')) return selectedIds.length === 1;
  return selectedIds.length === 1
    || (selectedIds.length === 2
      && selected.has('mean-use-and-limit')
      && selected.has('range-or-individual-values'));
};

const isMissionEvidenceSelection = (
  missionId: MissionId,
  selectedIds: readonly EvidenceChoiceId[],
): boolean => selectedIds.length > 0
  && selectedIds.every((id) => MISSION_EVIDENCE_IDS[missionId].includes(id));

const isOnlyEvidence = (
  missionId: MissionId,
  selectedIds: readonly EvidenceChoiceId[],
  expected: EvidenceChoiceId,
): boolean => isMissionEvidenceSelection(missionId, selectedIds)
  && new Set(selectedIds).size === 1
  && selectedIds[0] === expected;

const isEvidenceShape = (value: unknown): value is {
  missionId: unknown;
  datasetId: unknown;
  selectedIds: unknown;
  sentence: unknown;
  level: unknown;
  revisions: unknown;
} => typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && Object.keys(value).length === 6
  && ['missionId', 'datasetId', 'selectedIds', 'sentence', 'level', 'revisions']
    .every((key) => key in value);

/** 저장·복원·활성 산출물이 동일한 검수 근거 계약을 쓰도록 합니다. */
export const isCanonicalEvidenceRecord = (
  value: unknown,
  expectedMissionId?: MissionId,
  expectedDatasetId?: DatasetId,
  expectedRevisions?: number,
): value is import('./types').EvidenceRecord => {
  if (!isEvidenceShape(value)
    || typeof value.missionId !== 'string'
    || typeof value.datasetId !== 'string'
    || !isMissionId(value.missionId)
    || !isDatasetId(value.datasetId)) return false;
  const missionId = value.missionId;
  const datasetId = value.datasetId;
  if (expectedMissionId !== undefined && missionId !== expectedMissionId) return false;
  if (expectedDatasetId !== undefined && datasetId !== expectedDatasetId) return false;
  if (!getMission(missionId).datasets.some((dataset) => dataset.id === datasetId)) return false;
  if (!Array.isArray(value.selectedIds)
    || !value.selectedIds.every((id): id is EvidenceChoiceId =>
      typeof id === 'string' && MISSION_EVIDENCE_IDS[missionId].includes(id as EvidenceChoiceId))) return false;
  const selectedIds = value.selectedIds;
  if (!isAllowedEvidenceSelection(missionId, selectedIds)) return false;
  if (value.level !== 1 && value.level !== 2 && value.level !== 3) return false;
  if (typeof value.sentence !== 'string'
    || typeof value.revisions !== 'number'
    || !Number.isInteger(value.revisions)
    || value.revisions < 0
    || (expectedRevisions !== undefined && value.revisions !== expectedRevisions)) return false;
  return value.sentence === buildEvidenceSentence(missionId, datasetId, selectedIds)
    && value.level === deriveEvidenceLevel(missionId, selectedIds);
};

export const evaluateCalculation = (input: CalculationInput): EvaluationResult => {
  const expectedTotal = sum(input.values);
  if (input.enteredTotal !== expectedTotal) {
    return result(false, CALCULATION_COPY.totalMessage, CALCULATION_COPY.totalNextAction);
  }
  if (input.enteredCount !== input.values.length) {
    return result(false, CALCULATION_COPY.countMessage, CALCULATION_COPY.countNextAction);
  }
  if (input.enteredMean !== mean(input.values)) {
    return result(false, CALCULATION_COPY.meanMessage, `${expectedTotal} ÷ ${input.values.length}를 계산해 보세요.`);
  }
  return result(true, CALCULATION_COPY.successMessage, CALCULATION_COPY.successNextAction);
};

const evaluateBalanceComparison = (): EvaluationResult => result(
  false,
  '먼저 재배분한 결과를 살펴보세요.',
  '상자 속 수가 고르게 되었는지 확인해 보세요.',
);

const evaluateTwinsComparison = (
  dataset: Extract<MissionDataset, { kind: 'twins' }>,
  selectedIds: readonly ComparisonChoiceId[],
): EvaluationResult => {
  const sameMean = mean(dataset.leftValues) === mean(dataset.rightValues);
  const differentSpread = range(dataset.leftValues) !== range(dataset.rightValues);
  if (hasChoice(selectedIds, 'same-shape')) {
    return result(false, COMPARISON_COPY.twinsShapeMessage, COMPARISON_COPY.twinsShapeNextAction);
  }
  if (!hasChoice(selectedIds, 'same-mean') || !sameMean) {
    return result(false, '두 자료의 평균을 먼저 비교해 보세요.', COMPARISON_COPY.twinsMeanNextActionDetail);
  }
  if (!hasChoice(selectedIds, 'different-spread') || !differentSpread) {
    return result(false, COMPARISON_COPY.twinsSpreadMessage, COMPARISON_COPY.twinsSpreadNextAction);
  }
  return result(true, COMPARISON_COPY.twinsSuccessMessage, COMPARISON_COPY.evidenceNextAction);
};

const evaluateOutlierComparison = (
  dataset: Extract<MissionDataset, { kind: 'outlier' }>,
  selectedIds: readonly ComparisonChoiceId[],
): EvaluationResult => {
  const sumChanged = sum(dataset.beforeValues) !== sum(dataset.afterValues);
  const meanChanged = mean(dataset.beforeValues) !== mean(dataset.afterValues);
  if (selectedIds[0] !== 'sum-changed-first' || !sumChanged) {
    return result(false, COMPARISON_COPY.outlierSumMessage, COMPARISON_COPY.outlierSumNextAction);
  }
  if (selectedIds[1] !== 'mean-changed-after' || !meanChanged) {
    return result(false, COMPARISON_COPY.outlierMeanMessage, COMPARISON_COPY.outlierMeanNextAction);
  }
  return result(true, COMPARISON_COPY.outlierSuccessMessage, COMPARISON_COPY.evidenceNextAction);
};

const evaluateRepresentativeComparison = (
  selectedIds: readonly ComparisonChoiceId[],
): EvaluationResult => {
  if (hasChoice(selectedIds, 'mean-always-enough')) {
    return result(false, COMPARISON_COPY.representativeAlwaysMessage, COMPARISON_COPY.representativeAlwaysNextAction);
  }
  if (!hasChoice(selectedIds, 'range-or-individual-values')) {
    return result(false, COMPARISON_COPY.representativeRangeMessage, COMPARISON_COPY.representativeRangeNextAction);
  }
  return result(true, COMPARISON_COPY.representativeSuccessMessage, COMPARISON_COPY.evidenceNextAction);
};

/** 비교 데이터의 종류를 기준으로 네 미션의 판정 규칙을 모두 처리합니다. */
export const evaluateComparison = (
  dataset: MissionDataset,
  selectedIds: readonly ComparisonChoiceId[],
): EvaluationResult => {
  if (!isAllowedComparisonSelection(dataset, selectedIds)) {
    return result(false, '비교 선택을 다시 살펴보세요.', '자료를 비교할 근거를 선택해 보세요.');
  }
  switch (dataset.kind) {
    case 'balance':
      return evaluateBalanceComparison();
    case 'twins':
      return evaluateTwinsComparison(dataset, selectedIds);
    case 'outlier':
      return evaluateOutlierComparison(dataset, selectedIds);
    case 'representativeness':
      return evaluateRepresentativeComparison(selectedIds);
  }
};

export const deriveEvidenceLevel = (
  missionId: MissionId,
  selectedIds: readonly EvidenceChoiceId[],
): EvidenceLevel => {
  if (!isAllowedEvidenceSelection(missionId, selectedIds)) return 1;
  switch (missionId) {
    case 'balance-delivery':
      if (isOnlyEvidence(missionId, selectedIds, 'redistribution-and-division')) return 3;
      if (isOnlyEvidence(missionId, selectedIds, 'redistribution-only')) return 2;
      return 1;
    case 'mean-twins':
      if (isOnlyEvidence(missionId, selectedIds, 'same-mean-and-different-spread')) return 3;
      if (isOnlyEvidence(missionId, selectedIds, 'same-mean-only')) return 2;
      return 1;
    case 'outlier-alert':
      if (isOnlyEvidence(missionId, selectedIds, 'sum-change-and-mean-change')) return 3;
      if (isOnlyEvidence(missionId, selectedIds, 'direction-only')) return 2;
      return 1;
    case 'representative-review':
      if (isMissionEvidenceSelection(missionId, selectedIds)
        && new Set(selectedIds).size === 2
        && selectedIds.includes('mean-use-and-limit')
        && selectedIds.includes('range-or-individual-values')) return 3;
      if (isOnlyEvidence(missionId, selectedIds, 'mean-use-and-limit')
        || isOnlyEvidence(missionId, selectedIds, 'range-or-individual-values')) return 2;
      return 1;
  }
};

const sentenceFallback = '선택한 근거를 다시 살펴보고 문장을 완성해 보세요.';

const getDatasetForMission = (missionId: MissionId, datasetId: DatasetId): MissionDataset | undefined =>
  getMission(missionId).datasets.find((dataset) => dataset.id === datasetId);

const buildBalanceSentence = (
  dataset: Extract<MissionDataset, { kind: 'balance' }>,
  selectedIds: readonly EvidenceChoiceId[],
): string => {
  const selected = new Set(selectedIds);
  const total = sum(dataset.values);
  const count = dataset.values.length;
  const expected = mean(dataset.values);
  if (selected.has('redistribution-and-division')) {
    return buildBalanceEvidenceSentence(total, count, expected);
  }
  if (selected.has('redistribution-only')) return EVIDENCE_FRAGMENTS['redistribution-only'];
  if (selected.has('calculation-only')) return buildBalanceCalculationSentence(total, count, expected);
  return sentenceFallback;
};

const buildTwinsSentence = (
  dataset: Extract<MissionDataset, { kind: 'twins' }>,
  selectedIds: readonly EvidenceChoiceId[],
): string => {
  const selected = new Set(selectedIds);
  const leftMean = mean(dataset.leftValues);
  const rightMean = mean(dataset.rightValues);
  const leftRange = range(dataset.leftValues);
  const rightRange = range(dataset.rightValues);
  if (selected.has('same-mean-and-different-spread')) {
    return buildTwinsEvidenceSentence(leftMean, leftRange, rightRange);
  }
  if (selected.has('same-mean-only')) return buildTwinsMeanSentence(leftMean, rightMean);
  if (selected.has('same-shape')) return EVIDENCE_FRAGMENTS['same-shape'];
  return sentenceFallback;
};

const buildOutlierSentence = (
  dataset: Extract<MissionDataset, { kind: 'outlier' }>,
  selectedIds: readonly EvidenceChoiceId[],
): string => {
  const selected = new Set(selectedIds);
  const beforeTotal = sum(dataset.beforeValues);
  const afterTotal = sum(dataset.afterValues);
  const beforeMean = mean(dataset.beforeValues);
  const afterMean = mean(dataset.afterValues);
  if (selected.has('sum-change-and-mean-change')) {
    return buildOutlierEvidenceSentence(
      beforeTotal,
      afterTotal,
      afterTotal - beforeTotal,
      beforeMean,
      afterMean,
      afterMean - beforeMean,
    );
  }
  if (selected.has('direction-only')) return EVIDENCE_FRAGMENTS['direction-only'];
  if (selected.has('guess-only')) return EVIDENCE_FRAGMENTS['guess-only'];
  return sentenceFallback;
};

const buildRepresentativeSentence = (
  dataset: Extract<MissionDataset, { kind: 'representativeness' }>,
  selectedIds: readonly EvidenceChoiceId[],
): string => {
  const selected = new Set(selectedIds);
  if (selected.has('mean-use-and-limit') && selected.has('range-or-individual-values')) {
    return buildRepresentativeEvidenceSentence(dataset.modelSentence);
  }
  if (selected.has('mean-use-and-limit')) return EVIDENCE_FRAGMENTS['mean-use-and-limit'];
  if (selected.has('range-or-individual-values')) return EVIDENCE_FRAGMENTS['range-or-individual-values'];
  if (selected.has('mean-always-enough')) return EVIDENCE_FRAGMENTS['mean-always-enough'];
  return sentenceFallback;
};

/** 학생 입력이 아닌 검토된 선택지와 고정 데이터만으로 설명 문장을 조립합니다. */
export const buildEvidenceSentence = (
  missionId: MissionId,
  datasetId: DatasetId,
  selectedIds: readonly EvidenceChoiceId[],
): string => {
  const dataset = getDatasetForMission(missionId, datasetId);
  if (!dataset) return sentenceFallback;
  switch (missionId) {
    case 'balance-delivery':
      return dataset.kind === 'balance' ? buildBalanceSentence(dataset, selectedIds) : sentenceFallback;
    case 'mean-twins':
      return dataset.kind === 'twins' ? buildTwinsSentence(dataset, selectedIds) : sentenceFallback;
    case 'outlier-alert':
      return dataset.kind === 'outlier' ? buildOutlierSentence(dataset, selectedIds) : sentenceFallback;
    case 'representative-review':
      return dataset.kind === 'representativeness'
        ? buildRepresentativeSentence(dataset, selectedIds)
        : sentenceFallback;
  }
};
