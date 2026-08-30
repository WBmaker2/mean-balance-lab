import type { LearningStage, MissionDefinition, MissionDataset } from '../../domain/types';
import { stageAction, stageLabel } from '../../content/stages';

interface ProgressRailProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  currentStage: LearningStage;
}

export const ProgressRail = ({ mission, dataset, currentStage }: ProgressRailProps) => {
  const currentIndex = dataset.stages.indexOf(currentStage);
  const completed = Math.max(0, currentIndex + 1);
  const total = dataset.stages.length;
  return (
    <nav className="progress-rail notebook-rail" aria-label="미션 진행">
      <div className="progress-rail-heading">
        <p className="progress-rail-mission">{mission.learnerTitle}</p>
        <p className="progress-summary"><strong>{completed}/{total} 단계</strong></p>
      </div>
      <p className="progress-current">현재 단계: {stageLabel(currentStage)}</p>
      <p className="progress-current-action">{stageAction(currentStage)}</p>
      <ol className="progress-steps">
        {dataset.stages.map((stage, index) => (
          <li
            key={stage}
            aria-label={`${index < currentIndex ? '완료' : stage === currentStage ? '현재 단계' : '예정'} ${stageLabel(stage)}`}
            aria-current={stage === currentStage ? 'step' : undefined}
            data-stage-status={index < currentIndex ? 'completed' : stage === currentStage ? 'current' : 'upcoming'}
            className={index < currentIndex ? 'progress-step-completed' : stage === currentStage ? 'progress-step-current' : 'progress-step-upcoming'}
          >
            <span className="progress-step-number" aria-hidden="true">{index + 1}</span>
            <span className="progress-step-status">{index < currentIndex ? '완료' : stage === currentStage ? '현재 단계' : '예정'}</span>
            <span className="progress-step-label">{stageLabel(stage)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
