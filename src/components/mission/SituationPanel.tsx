import { SAFETY_COPY } from '../../content/copy';
import type { MissionDataset } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';
import { SectionIntro } from '../shared/SectionIntro';

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
  <section className="stage-panel stage-panel-situation" data-stage="situation" aria-labelledby="situation-heading">
    <SectionIntro
      id="situation-heading"
      title="상황을 살펴볼까요?"
      description="먼저 자료가 어떤 상황인지 읽고, 평균을 생각할 준비를 해요."
      tone="blue"
    />
    <div className="data-preview" aria-label="살펴볼 가상 자료">
      <p className="data-preview-context">{dataset.context}</p>
      <p className="data-preview-values">{values(dataset)}</p>
    </div>
    <aside className="safety-note" aria-label="가상 자료 안내">
      <p>실제 자료가 아닌 수학 연습용 가상 자료예요.</p>
      <p>{SAFETY_COPY.learnerModelBoundary}</p>
    </aside>
    <div className="action-group">
      <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음: 평균 예측</ActionButton>
    </div>
  </section>
);
