import { useEffect, useState, type Dispatch } from 'react';
import type { LabAction } from '../../domain/session';
import type { MissionDataset, PredictionValue } from '../../domain/types';
import { predictionOptions } from '../../domain/prediction';
import { ActionButton } from '../shared/ActionButton';
import { SectionIntro } from '../shared/SectionIntro';

interface PredictionPanelProps {
  dataset: MissionDataset;
  prediction: PredictionValue | undefined;
  dispatch: Dispatch<LabAction>;
  onAdvance: () => void;
}

export const PredictionPanel = ({ dataset, prediction, dispatch, onAdvance }: PredictionPanelProps) => {
  const choices = predictionOptions(dataset);
  const [predictionError, setPredictionError] = useState(false);

  useEffect(() => {
    setPredictionError(false);
  }, [dataset.id]);

  const selectPrediction = (value: PredictionValue) => {
    setPredictionError(false);
    dispatch({ type: 'SET_PREDICTION', value });
  };

  const advance = () => {
    if (prediction === undefined) {
      setPredictionError(true);
      return;
    }
    onAdvance();
  };

  return (
    <section className="stage-panel stage-panel-predict" data-stage="predict" aria-labelledby="prediction-heading">
      <SectionIntro
        id="prediction-heading"
        title="평균을 먼저 예측해 볼까요?"
        description="계산하기 전에 평균이 어떻게 될지 골라 보세요."
        tone="orange"
      />
      <div className="choice-group" role="group" aria-label={dataset.kind === 'outlier' ? '평균 변화 방향 예측' : '평균값 예측'}>
        {choices.map(({ value, label }) => (
          <ActionButton
            emphasis="normal"
            key={value}
            type="button"
            aria-pressed={prediction === value}
            data-selected={prediction === value ? 'true' : undefined}
            className={prediction === value ? 'choice-selected' : ''}
            onClick={() => selectPrediction(value)}
          >
            {label}
          </ActionButton>
        ))}
      </div>
      {dataset.kind === 'outlier' && prediction !== undefined ? (
        <p role="status">가상 자료에서 바꾼 값이 커졌는지 작아졌는지를 다시 살펴보세요. 합계와 평균의 숫자는 계산 단계에서 확인해요.</p>
      ) : null}
      {predictionError ? <p role="alert" aria-live="assertive">먼저 평균을 예측해 보세요.</p> : null}
      <div className="action-group">
        <ActionButton type="button" emphasis="next" onClick={advance}>다음 단계</ActionButton>
      </div>
    </section>
  );
};
