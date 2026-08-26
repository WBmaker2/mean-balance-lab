import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { getMission, isDatasetId, isLearningStage, isMissionId, MISSIONS } from '../content/missions';
import { isBalanced, sum } from '../domain/math';
import type { LabSessionState } from '../domain/session';
import { useLabSession } from '../state/LabSessionContext';
import type { DatasetId, LearningStage, MissionDataset, MissionDefinition, MissionId } from '../domain/types';
import { AppShell } from './AppShell';
import { MissionScreen } from '../components/mission/MissionScreen';
import { ResultScreen } from '../components/result/ResultScreen';
import { StartScreen } from '../components/start/StartScreen';

export const RECOVERY_MESSAGE = '자료를 찾지 못해 시작 화면으로 돌아왔어요.';
const IMPLEMENTED_STAGES: readonly LearningStage[] = ['situation', 'predict', 'redistribute'];
const isImplementedStage = (
  stage: LearningStage,
  dataset: MissionDataset,
): stage is Extract<LearningStage, 'situation' | 'predict' | 'redistribute'> =>
  stage === 'situation' || stage === 'predict' || (stage === 'redistribute' && dataset.kind === 'balance');

export const routeFor = (missionId: MissionId, datasetId: DatasetId, stage: LearningStage): string =>
  `#/mission/${missionId}/${datasetId}/${stage}`;

const pathFor = (missionId: MissionId, datasetId: DatasetId, stage: LearningStage): string =>
  `/mission/${missionId}/${datasetId}/${stage}`;

const hasMatchingRun = (state: LabSessionState, mission: MissionDefinition, dataset: MissionDataset): boolean =>
  state.activeRun?.missionId === mission.id && state.activeRun.datasetId === dataset.id;

const hasRequiredArtifact = (
  state: LabSessionState,
  mission: MissionDefinition,
  dataset: MissionDataset,
  stage: LearningStage,
): boolean => {
  const run = hasMatchingRun(state, mission, dataset) ? state.activeRun : null;
  if (!run) return false;
  switch (stage) {
    case 'situation':
      return true;
    case 'predict':
      return run.artifacts.prediction !== undefined;
    case 'redistribute': {
      const redistribution = run.artifacts.redistribution;
      return redistribution !== undefined
        && sum(redistribution.initialValues) === sum(redistribution.currentValues)
        && isBalanced(redistribution.currentValues);
    }
    case 'calculate': {
      const targets = dataset.kind === 'twins'
        ? ['left', 'right'] as const
        : dataset.kind === 'outlier'
          ? ['before', 'after'] as const
          : ['current'] as const;
      return targets.every((target) => run.artifacts.calculations?.[target]?.verified === true);
    }
    case 'compare':
      return run.artifacts.comparison?.verified === true;
    case 'explain':
      return run.artifacts.evidence !== undefined;
    case 'mission-result':
      return run.artifacts.evidence !== undefined;
  }
};

export const resolveAllowedStage = (
  state: LabSessionState,
  mission: MissionDefinition,
  dataset: MissionDataset,
  requestedStage: LearningStage,
): LearningStage => {
  const requestedIndex = dataset.stages.indexOf(requestedStage);
  if (requestedIndex < 0) return dataset.stages[0] ?? 'situation';
  if (!hasMatchingRun(state, mission, dataset)) return dataset.stages[0] ?? 'situation';
  for (let index = 0; index < requestedIndex; index += 1) {
    const stage = dataset.stages[index];
    if (stage && !hasRequiredArtifact(state, mission, dataset, stage)) return stage;
  }
  return requestedStage;
};

const InvalidRoute = () => <Navigate to="/" replace state={{ recoveryMessage: RECOVERY_MESSAGE }} />;

const MissionRoute = () => {
  const { missionId, datasetId, stage } = useParams();
  const { state } = useLabSession();
  if (!missionId || !datasetId || !stage || !isMissionId(missionId) || !isDatasetId(datasetId) || !isLearningStage(stage)) {
    return <InvalidRoute />;
  }
  const mission = getMission(missionId);
  const dataset = mission.datasets.find((item) => item.id === datasetId);
  if (!dataset) return <InvalidRoute />;

  const matching = hasMatchingRun(state, mission, dataset);
  // A redistribution URL cannot bootstrap its own run: start the learner at
  // the situation screen so the normal situation → prediction gate runs.
  if (!matching && stage === 'redistribute') {
    return <Navigate to={pathFor(mission.id, dataset.id, 'situation')} replace />;
  }
  const allowedStage = resolveAllowedStage(state, mission, dataset, stage);
  if (matching && allowedStage !== stage) {
    return <Navigate to={pathFor(mission.id, dataset.id, allowedStage)} replace />;
  }
  let visibleStage: Extract<LearningStage, 'situation' | 'predict' | 'redistribute'>;
  if (matching) {
    if (!isImplementedStage(allowedStage, dataset)) {
      return <Navigate to={pathFor(mission.id, dataset.id, 'predict')} replace />;
    }
    visibleStage = allowedStage;
  } else {
    visibleStage = isImplementedStage(stage, dataset) ? stage : 'situation';
  }
  return <MissionScreen mission={mission} dataset={dataset} stage={visibleStage} />;
};

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<StartScreen />} />
      <Route path="mission/:missionId/:datasetId/:stage" element={<MissionRoute />} />
      <Route path="results" element={<ResultScreen />} />
      <Route path="*" element={<InvalidRoute />} />
    </Route>
  </Routes>
);

export { MISSIONS };
