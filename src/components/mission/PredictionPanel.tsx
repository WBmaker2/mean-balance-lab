import type { Dispatch } from 'react';
import type { LabAction } from '../../domain/session';
import type { MissionDataset, PredictionValue } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';

interface PredictionPanelProps {
  dataset: MissionDataset;
  prediction: PredictionValue | undefined;
  dispatch: Dispatch<LabAction>;
  onAdvance: () => void;
}

export const PredictionPanel = ({ prediction, dispatch, onAdvance }: PredictionPanelProps) => {
  const choices = [
    ['increase', '평균이 커집니다'],
    ['decrease', '평균이 작아집니다'],
    ['same', '평균이 같습니다'],
  ] as const;
  return (
    <section aria-labelledby="prediction-heading">
      <h1 id="prediction-heading">평균을 먼저 예측해 볼까요?</h1>
      <p>계산하기 전에 평균이 어떻게 될지 골라 보세요.</p>
      <div role="group" aria-label="평균 변화 예측">
        {choices.map(([value, label]) => (
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
      <ActionButton type="button" emphasis="next" disabled={prediction === undefined} onClick={onAdvance}>다음 단계</ActionButton>
    </section>
  );
};
