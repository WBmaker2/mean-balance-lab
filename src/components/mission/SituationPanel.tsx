import { SAFETY_COPY } from '../../content/copy';
import type { MissionDataset } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';

interface SituationPanelProps {
  dataset: MissionDataset;
  onAdvance: () => void;
}

const values = (dataset: MissionDataset): string => {
  switch (dataset.kind) {
    case 'balance': return `원자료: ${dataset.values.join(', ')}`;
    case 'twins': return `자료 A: ${dataset.leftValues.join(', ')} / 자료 B: ${dataset.rightValues.join(', ')}`;
    case 'outlier': return `변경 전: ${dataset.beforeValues.join(', ')} / 변경 후: ${dataset.afterValues.join(', ')}`;
    case 'representativeness': return `자료: ${dataset.values.join(', ')}`;
  }
};

export const SituationPanel = ({ dataset, onAdvance }: SituationPanelProps) => (
  <section aria-labelledby="situation-heading">
    <p>가상 자료</p>
    <h1 id="situation-heading">상황을 살펴볼까요?</h1>
    <p>{dataset.context}</p>
    <p>{values(dataset)}</p>
    <p>실제 자료가 아닌 수학 연습용 가상 자료예요.</p>
    <p>{SAFETY_COPY.modelBoundary}</p>
    <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음: 평균 예측</ActionButton>
  </section>
);
