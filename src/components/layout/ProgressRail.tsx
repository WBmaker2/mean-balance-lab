import type { LearningStage, MissionDefinition, MissionDataset } from '../../domain/types';

const STAGE_LABELS: Readonly<Record<LearningStage, string>> = {
  situation: '상황',
  predict: '예측',
  redistribute: '재배분',
  calculate: '계산',
  compare: '비교',
  explain: '설명',
  'mission-result': '미션 결과',
};

interface ProgressRailProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  currentStage: LearningStage;
}

export const ProgressRail = ({ mission, dataset, currentStage }: ProgressRailProps) => {
  const currentIndex = dataset.stages.indexOf(currentStage);
  return (
    <nav aria-label="미션 진행">
      <p>{mission.title}</p>
      <ol>
        {dataset.stages.map((stage, index) => (
          <li key={stage} aria-current={stage === currentStage ? 'step' : undefined}>
            {index < currentIndex ? '완료 · ' : ''}{STAGE_LABELS[stage]}
          </li>
        ))}
      </ol>
    </nav>
  );
};
