import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MissionDataset, MissionDefinition, LearningStage } from '../../domain/types';
import { canAdvance } from '../../domain/session';
import { useLabSession } from '../../state/LabSessionContext';
import { ArtifactTrail } from '../layout/ArtifactTrail';
import { ProgressRail } from '../layout/ProgressRail';
import { PredictionPanel } from './PredictionPanel';
import { SituationPanel } from './SituationPanel';

interface MissionScreenProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  stage: Extract<LearningStage, 'situation' | 'predict'>;
}

export const MissionScreen = ({ mission, dataset, stage }: MissionScreenProps) => {
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();
  const run = state.activeRun?.missionId === mission.id && state.activeRun.datasetId === dataset.id
    ? state.activeRun
    : null;

  useEffect(() => {
    if (!run) {
      dispatch({ type: 'START_DATASET', missionId: mission.id, datasetId: dataset.id });
      return;
    }
    if (stage === 'predict' && run.stage === 'situation' && canAdvance({ ...state, activeRun: run }).allowed) {
      dispatch({ type: 'ADVANCE_STAGE' });
    }
  }, [dataset.id, dispatch, mission.id, run, stage, state]);

  const nextStage = () => {
    const index = dataset.stages.indexOf(stage);
    const next = dataset.stages[index + 1];
    if (!next) return;
    if (next !== 'situation' && next !== 'predict') return;
    dispatch({ type: 'ADVANCE_STAGE' });
    navigate(`/mission/${mission.id}/${dataset.id}/${next}`);
  };

  return (
    <>
      <ProgressRail mission={mission} dataset={dataset} currentStage={stage} />
      <ArtifactTrail artifacts={run?.artifacts ?? {}} revisions={run?.revisions} />
      {stage === 'situation' ? (
        <SituationPanel dataset={dataset} onAdvance={nextStage} />
      ) : (
        <PredictionPanel
          dataset={dataset}
          prediction={run?.artifacts.prediction?.value}
          dispatch={dispatch}
          onAdvance={nextStage}
        />
      )}
    </>
  );
};
