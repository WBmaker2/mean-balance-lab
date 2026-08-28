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
import { EvidenceBuilder } from './EvidenceBuilder';
import { MissionSummary } from './MissionSummary';
import { useStageFocus } from '../../hooks/useStageFocus';

interface MissionScreenProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  stage: Extract<LearningStage, 'situation' | 'predict' | 'redistribute' | 'calculate' | 'compare' | 'explain' | 'mission-result'>;
}

export const MissionScreen = ({ mission, dataset, stage }: MissionScreenProps) => {
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();
  const [lastCalculationTarget, setLastCalculationTarget] = useState<CalculationTarget | null>(null);
  const run = state.activeRun?.missionId === mission.id && state.activeRun.datasetId === dataset.id
    ? state.activeRun
    : null;

  useStageFocus([mission.id, dataset.id, stage].join(':'));

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
    if (next !== 'situation' && next !== 'predict' && next !== 'redistribute'
      && next !== 'calculate' && next !== 'compare' && next !== 'explain' && next !== 'mission-result') return;
    dispatch({ type: 'ADVANCE_STAGE' });
    navigate(`/mission/${mission.id}/${dataset.id}/${next}`);
  };

  const startDataset = (datasetId: MissionDataset['id']) => {
    dispatch({ type: 'START_DATASET', missionId: mission.id, datasetId });
    navigate(`/mission/${mission.id}/${datasetId}/situation`);
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
          {renderCalculation('current', true, true)}
        </section>
      ) : stage === 'compare' && dataset.kind === 'twins' && run ? (
        <ComparisonPanel
          dataset={dataset}
          artifacts={run.artifacts}
          dispatch={dispatch}
          feedback={run.transientFeedback}
          onAdvance={nextStage}
        />
      ) : stage === 'compare' && dataset.kind === 'outlier' && run ? (
        <ComparisonPanel
          dataset={dataset}
          artifacts={run.artifacts}
          dispatch={dispatch}
          feedback={run.transientFeedback}
          onAdvance={nextStage}
        />
      ) : stage === 'compare' && dataset.kind === 'representativeness' && run ? (
        <ComparisonPanel
          dataset={dataset}
          artifacts={run.artifacts}
          dispatch={dispatch}
          feedback={run.transientFeedback}
          onAdvance={nextStage}
        />
      ) : stage === 'explain' && run ? (
        <EvidenceBuilder
          mission={mission.id}
          dataset={dataset}
          revisions={run.revisions}
          {...(run.artifacts.evidence ? { existingRecord: run.artifacts.evidence } : {})}
          onSubmit={(record) => dispatch({ type: 'SUBMIT_EVIDENCE', record })}
          onAdvance={nextStage}
        />
      ) : stage === 'mission-result' && run?.artifacts.evidence ? (
        <MissionSummary
          mission={mission}
          dataset={dataset}
          attempt={run.artifacts.evidence}
          dispatch={dispatch}
          onRetry={() => startDataset(dataset.id)}
          onAlternate={() => startDataset(mission.datasets.find((candidate) => candidate.id !== dataset.id)?.id ?? dataset.id)}
          onFinish={() => navigate('/')}
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
