import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalculationTarget, MissionDataset, MissionDefinition, LearningStage } from '../../domain/types';
import type { CalculationInput } from '../../domain/evaluation';
import { canAdvance } from '../../domain/session';
import { useLabSession } from '../../state/LabSessionContext';
import { ArtifactTrail } from '../layout/ArtifactTrail';
import { ProgressRail } from '../layout/ProgressRail';
import { PredictionPanel } from './PredictionPanel';
import { SituationPanel } from './SituationPanel';
import { RedistributionPanel } from './RedistributionPanel';
import { CalculationCheck } from './CalculationCheck';
import { ComparisonPanel } from './ComparisonPanel';

interface MissionScreenProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  stage: Extract<LearningStage, 'situation' | 'predict' | 'redistribute' | 'calculate' | 'compare'>;
}

export const MissionScreen = ({ mission, dataset, stage }: MissionScreenProps) => {
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();
  const [lastCalculationTarget, setLastCalculationTarget] = useState<CalculationTarget | null>(null);
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
    if (next !== 'situation' && next !== 'predict' && next !== 'redistribute' && next !== 'calculate' && next !== 'compare') return;
    dispatch({ type: 'ADVANCE_STAGE' });
    navigate(`/mission/${mission.id}/${dataset.id}/${next}`);
  };

  const submitCalculation = (target: CalculationTarget, input: CalculationInput) => {
    setLastCalculationTarget(target);
    dispatch({ type: 'SUBMIT_CALCULATION', target, input });
  };

  const calculationValues = (target: CalculationTarget): readonly number[] | null => {
    if (dataset.kind === 'balance') {
      return target === 'current' ? run?.artifacts.redistribution?.currentValues ?? dataset.values : null;
    }
    if (dataset.kind === 'representativeness') return target === 'current' ? dataset.values : null;
    if (dataset.kind === 'twins') {
      if (target === 'left') return dataset.leftValues;
      if (target === 'right') return dataset.rightValues;
      return null;
    }
    if (target === 'before') return dataset.beforeValues;
    if (target === 'after') return dataset.afterValues;
    return null;
  };

  const feedbackFor = (target: CalculationTarget) => {
    const artifact = run?.artifacts.calculations?.[target];
    if (lastCalculationTarget === target && run?.transientFeedback) return run.transientFeedback;
    if (artifact?.verified) {
      return { isCorrect: true, message: '계산이 맞아요.', nextAction: '다음 단계로 가 보세요.' };
    }
    return null;
  };

  const renderCalculation = (target: CalculationTarget, isActive = true, showNextAction = true) => {
    const values = calculationValues(target);
    if (!values) return null;
    return (
      <CalculationCheck
        key={target}
        target={target}
        values={values}
        onSubmit={submitCalculation}
        feedback={feedbackFor(target)}
        isActive={isActive}
        showNextAction={showNextAction}
        onAdvance={nextStage}
      />
    );
  };

  return (
    <>
      <ProgressRail mission={mission} dataset={dataset} currentStage={stage} />
      <ArtifactTrail artifacts={run?.artifacts ?? {}} revisions={run?.revisions} />
      {stage === 'situation' ? (
        <SituationPanel dataset={dataset} onAdvance={nextStage} />
      ) : stage === 'predict' ? (
        <PredictionPanel
          dataset={dataset}
          prediction={run?.artifacts.prediction?.value}
          dispatch={dispatch}
          onAdvance={nextStage}
        />
      ) : stage === 'redistribute' && dataset.kind === 'balance' && run ? (
        <RedistributionPanel dataset={dataset} run={run} dispatch={dispatch} onAdvance={nextStage} />
      ) : stage === 'calculate' && dataset.kind === 'twins' ? (
        <section aria-labelledby="calculation-heading">
          <h1 id="calculation-heading">두 자료의 평균을 계산해 볼까요?</h1>
          {renderCalculation('left', run?.artifacts.calculations?.left?.verified !== true, false)}
          {renderCalculation('right', run?.artifacts.calculations?.left?.verified === true, true)}
        </section>
      ) : stage === 'calculate' && dataset.kind === 'outlier' ? (
        <section aria-labelledby="calculation-heading">
          <h1 id="calculation-heading">변경 전과 후의 평균을 계산해 볼까요?</h1>
          {renderCalculation('before', run?.artifacts.calculations?.before?.verified !== true, false)}
          {renderCalculation('after', run?.artifacts.calculations?.before?.verified === true, true)}
        </section>
      ) : stage === 'calculate' ? (
        <section aria-labelledby="calculation-heading">
          <h1 id="calculation-heading">평균을 계산해 볼까요?</h1>
          {renderCalculation('current', true, false)}
        </section>
      ) : stage === 'compare' && dataset.kind === 'twins' && run ? (
        <ComparisonPanel
          dataset={dataset}
          artifacts={run.artifacts}
          dispatch={dispatch}
          feedback={run.transientFeedback}
        />
      ) : stage === 'compare' && dataset.kind === 'outlier' && run ? (
        <ComparisonPanel
          dataset={dataset}
          artifacts={run.artifacts}
          dispatch={dispatch}
          feedback={run.transientFeedback}
        />
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
