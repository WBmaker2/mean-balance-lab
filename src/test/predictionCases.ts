import type { DatasetId, MissionId, PredictionValue } from '../domain/types';

type PredictionDatasetKind = 'balance' | 'twins' | 'outlier' | 'representativeness';

export interface PredictionCase {
  missionId: MissionId;
  datasetId: DatasetId;
  kind: PredictionDatasetKind;
  expectedMean: number;
  options: readonly { value: PredictionValue; label: string }[];
  canonical: PredictionValue;
  crossKindValue: PredictionValue;
  arbitraryValues: readonly PredictionValue[];
}

/**
 * Explicit contract table: this is intentionally independent of MISSIONS
 * traversal so a broken mission/dataset lookup cannot make the tests pass.
 */
export const PREDICTION_CASES = [
  {
    missionId: 'balance-delivery', datasetId: 'balance-20-a', kind: 'balance', expectedMean: 5,
    options: [{ value: 4, label: '평균 4' }, { value: 5, label: '평균 5' }, { value: 6, label: '평균 6' }],
    canonical: 5, crossKindValue: 'increase', arbitraryValues: [7, 0],
  },
  {
    missionId: 'balance-delivery', datasetId: 'balance-24-b', kind: 'balance', expectedMean: 6,
    options: [{ value: 5, label: '평균 5' }, { value: 6, label: '평균 6' }, { value: 7, label: '평균 7' }],
    canonical: 6, crossKindValue: 'increase', arbitraryValues: [8, 0],
  },
  {
    missionId: 'mean-twins', datasetId: 'twins-4-a', kind: 'twins', expectedMean: 4,
    options: [{ value: 3, label: '평균 3' }, { value: 4, label: '평균 4' }, { value: 5, label: '평균 5' }],
    canonical: 4, crossKindValue: 'increase', arbitraryValues: [6, 0],
  },
  {
    missionId: 'mean-twins', datasetId: 'twins-6-b', kind: 'twins', expectedMean: 6,
    options: [{ value: 5, label: '평균 5' }, { value: 6, label: '평균 6' }, { value: 7, label: '평균 7' }],
    canonical: 6, crossKindValue: 'increase', arbitraryValues: [8, 0],
  },
  {
    missionId: 'outlier-alert', datasetId: 'outlier-5-a', kind: 'outlier', expectedMean: 5,
    options: [
      { value: 'increase', label: '평균이 커집니다' },
      { value: 'decrease', label: '평균이 작아집니다' },
      { value: 'same', label: '평균이 같습니다' },
    ],
    canonical: 'increase', crossKindValue: 5, arbitraryValues: [0],
  },
  {
    missionId: 'outlier-alert', datasetId: 'outlier-6-b', kind: 'outlier', expectedMean: 6,
    options: [
      { value: 'increase', label: '평균이 커집니다' },
      { value: 'decrease', label: '평균이 작아집니다' },
      { value: 'same', label: '평균이 같습니다' },
    ],
    canonical: 'increase', crossKindValue: 6, arbitraryValues: [0],
  },
  {
    missionId: 'representative-review', datasetId: 'review-cards-a', kind: 'representativeness', expectedMean: 4,
    options: [{ value: 3, label: '평균 3' }, { value: 4, label: '평균 4' }, { value: 5, label: '평균 5' }],
    canonical: 4, crossKindValue: 'increase', arbitraryValues: [6, 0],
  },
  {
    missionId: 'representative-review', datasetId: 'review-baskets-b', kind: 'representativeness', expectedMean: 3,
    options: [{ value: 2, label: '평균 2' }, { value: 3, label: '평균 3' }, { value: 4, label: '평균 4' }],
    canonical: 3, crossKindValue: 'increase', arbitraryValues: [5, 0],
  },
] as const satisfies readonly PredictionCase[];
