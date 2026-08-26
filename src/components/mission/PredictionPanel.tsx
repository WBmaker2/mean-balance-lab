import type { Dispatch } from 'react';
import type { LabAction } from '../../domain/session';
import type { MissionDataset, PredictionValue } from '../../domain/types';
import { predictionOptions } from '../../domain/prediction';
import { ActionButton } from '../shared/ActionButton';

interface PredictionPanelProps {
  dataset: MissionDataset;
  prediction: PredictionValue | undefined;
  dispatch: Dispatch<LabAction>;
  onAdvance: () => void;
}

export const PredictionPanel = ({ dataset, prediction, dispatch, onAdvance }: PredictionPanelProps) => {
  const choices = predictionOptions(dataset);
  return (
    <section aria-labelledby="prediction-heading">
      <h1 id="prediction-heading">평균을 먼저 예측해 볼까요?</h1>
      <p>계산하기 전에 평균이 어떻게 될지 골라 보세요.</p>
      <div role="group" aria-label={dataset.kind === 'outlier' ? '평균 변화 방향 예측' : '평균값 예측'}>
        {choices.map(({ value, label }) => (
          <ActionButton
            emphasis="normal"
            key={value}
            type="button"
            aria-pressed={prediction === value}
            onClick={() => dispatch({ type: 'SET_PREDICTION', value })}
          >
            {label}
          </ActionButton>
        ))}
      </div>
      {dataset.kind === 'outlier' && prediction !== undefined ? (
        <p role="status">가상 자료에서 바꾼 값이 커졌는지 작아졌는지를 다시 살펴보세요. 합계와 평균의 숫자는 계산 단계에서 확인해요.</p>
      ) : null}
      <ActionButton type="button" emphasis="next" disabled={prediction === undefined} onClick={onAdvance}>다음 단계</ActionButton>
    </section>
  );
};
