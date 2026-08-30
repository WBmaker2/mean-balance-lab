import { useMemo } from 'react';
import { describeDelta } from '../../domain/math';
import type { OutlierDataset, PredictionValue } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';
import { SectionIntro } from '../shared/SectionIntro';

export interface OutlierDeltaPanelProps {
  dataset: OutlierDataset;
  prediction?: PredictionValue | { value: PredictionValue } | undefined;
  onConfirm: () => void;
  onAdvance?: () => void;
  verified?: boolean;
}

const predictionLabel = (prediction: OutlierDeltaPanelProps['prediction']): string => {
  const value = prediction && typeof prediction === 'object' ? prediction.value : prediction;
  if (value === 'increase') return '평균이 커집니다';
  if (value === 'decrease') return '평균이 작아집니다';
  if (value === 'same') return '평균이 같습니다';
  return '선택하지 않았어요';
};

const deltaText = (delta: number): string => {
  if (delta > 0) return `${delta} 증가`;
  if (delta < 0) return `${Math.abs(delta)} 감소`;
  return '변화 없음';
};

export const OutlierDeltaPanel = ({
  dataset, prediction, onConfirm, onAdvance, verified = false,
}: OutlierDeltaPanelProps) => {
  const delta = useMemo(
    () => describeDelta(dataset.beforeValues, dataset.afterValues),
    [dataset.beforeValues, dataset.afterValues],
  );
  const count = dataset.beforeValues.length;

  return (
    <section className="stage-panel stage-panel-compare" data-stage="compare" aria-labelledby="outlier-delta-heading">
      <SectionIntro
        id="outlier-delta-heading"
        title="합계 변화와 평균 변화를 살펴볼까요?"
        description="가상 자료에서 바꾼 값의 변화가 전체 양과 평균에 어떻게 이어지는지 살펴보세요."
        tone="orange"
      />
      <p className="prediction-badge">내 예측: {predictionLabel(prediction)}</p>

      <section className="concept-step" aria-label="합계 변화">
        <h2>먼저 합계 변화를 확인해요</h2>
        <p>합계 변화: {delta.sumBefore} → {delta.sumAfter}, {deltaText(delta.sumDelta)}</p>
      </section>

      <section className="concept-step" aria-label="평균 변화">
        <h2>그다음 평균 변화를 확인해요</h2>
        <p>평균 변화: {delta.meanBefore} → {delta.meanAfter}, {deltaText(delta.meanDelta)}</p>
        <p>합계가 {delta.sumDelta > 0 ? delta.sumDelta : Math.abs(delta.sumDelta)} {delta.sumDelta > 0 ? '늘고' : delta.sumDelta < 0 ? '줄고' : '그대로이고'} 자료가 {count}개라서 평균은 {delta.meanDelta > 0 ? delta.meanDelta : Math.abs(delta.meanDelta)} {delta.meanDelta > 0 ? '늘었어요.' : delta.meanDelta < 0 ? '줄었어요.' : '그대로예요.'}</p>
        <p aria-label="합계 변화와 평균 변화의 관계">{delta.sumDelta} ÷ {count} = {delta.meanDelta}</p>
      </section>

      <div className="action-group">
        {verified ? (
          <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음 단계</ActionButton>
        ) : (
          <ActionButton type="button" emphasis="next" onClick={onConfirm}>변화 확인</ActionButton>
        )}
      </div>
    </section>
  );
};
