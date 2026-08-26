import type { MissionDataset, PredictionValue } from './types';

export interface PredictionOption {
  value: PredictionValue;
  label: string;
}

const isPositiveNatural = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

/** 자료 종류별로 학습자가 선택할 수 있는 예측 값의 단일 계약입니다. */
export const predictionOptions = (dataset: MissionDataset): readonly PredictionOption[] => {
  if (dataset.kind === 'outlier') {
    return [
      { value: 'increase', label: '평균이 커집니다' },
      { value: 'decrease', label: '평균이 작아집니다' },
      { value: 'same', label: '평균이 같습니다' },
    ];
  }
  return [
    { value: dataset.expectedMean - 1, label: `평균 ${dataset.expectedMean - 1}` },
    { value: dataset.expectedMean, label: `평균 ${dataset.expectedMean}` },
    { value: dataset.expectedMean + 1, label: `평균 ${dataset.expectedMean + 1}` },
  ];
};

export const isAllowedPrediction = (dataset: MissionDataset, value: unknown): value is PredictionValue => {
  if (dataset.kind === 'outlier') return value === 'increase' || value === 'decrease' || value === 'same';
  return isPositiveNatural(value)
    && [dataset.expectedMean - 1, dataset.expectedMean, dataset.expectedMean + 1].includes(value);
};
