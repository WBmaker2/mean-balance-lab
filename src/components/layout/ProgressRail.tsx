import type { LearningStage, MissionDefinition, MissionDataset } from '../../domain/types';
import { stageLabel } from '../../content/stages';

interface ProgressRailProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  currentStage: LearningStage;
}

export const ProgressRail = ({ mission, dataset, currentStage }: ProgressRailProps) => {
  const currentIndex = dataset.stages.indexOf(currentStage);
  return (
    <nav aria-label="미션 진행">
      <p>{mission.learnerTitle}</p>
      <ol>
        {dataset.stages.map((stage, index) => (
          <li
            key={stage}
            aria-label={`${index < currentIndex ? '완료' : stage === currentStage ? '현재 단계' : '예정'} ${stageLabel(stage)}`}
            aria-current={stage === currentStage ? 'step' : undefined}
            data-stage-status={index < currentIndex ? 'completed' : stage === currentStage ? 'current' : 'upcoming'}
            className={index < currentIndex ? 'progress-step-completed' : stage === currentStage ? 'progress-step-current' : 'progress-step-upcoming'}
          >
            <span className="progress-step-status">{index < currentIndex ? '완료' : stage === currentStage ? '현재 단계' : '예정'}</span>
            <span>{stageLabel(stage)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
