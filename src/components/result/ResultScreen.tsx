import { useNavigate } from 'react-router-dom';
import { MISSIONS } from '../../content/missions';
import { isCanonicalEvidenceRecord } from '../../domain/evaluation';
import type { LabSessionState } from '../../domain/session';
import { useLabSession } from '../../state/LabSessionContext';
import { ActionButton } from '../shared/ActionButton';
import { MissionSummary } from '../mission/MissionSummary';
import { TeacherSummary } from './TeacherSummary';
import { SectionIntro } from '../shared/SectionIntro';

const requiredAttempts = (attempts: ReturnType<typeof useLabSession>['state']['attempts']) => MISSIONS.map((mission) => {
  const attempt = attempts[mission.requiredDatasetId];
  return attempt && isCanonicalEvidenceRecord(attempt, mission.id, mission.requiredDatasetId, attempt.revisions)
    ? { mission, attempt } : null;
}).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

export const getIncompleteRequiredMissionTitles = (
  state: LabSessionState,
): readonly string[] => MISSIONS
  .filter((mission) => {
    const attempt = state.attempts[mission.requiredDatasetId];
    const hasCanonicalAttempt = attempt !== undefined
      && isCanonicalEvidenceRecord(attempt, mission.id, mission.requiredDatasetId, attempt.revisions);
    return !(state.completedRequiredMissions.includes(mission.id) && hasCanonicalAttempt);
  })
  .map((mission) => mission.learnerTitle);

export const resultLockCopy = (remainingTitles: readonly string[]): string =>
  `전체 결과를 보려면 ${remainingTitles.join(', ')} 미션을 끝내야 해요.`;

export const ResultScreen = () => {
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();
  const records = requiredAttempts(state.attempts);
  const isComplete = MISSIONS.every((mission) => state.completedRequiredMissions.includes(mission.id))
    && records.length === MISSIONS.length;

  const startDataset = (missionId: (typeof MISSIONS)[number]['id'], datasetId: (typeof MISSIONS)[number]['datasets'][number]['id']) => {
    dispatch({ type: 'START_DATASET', missionId, datasetId });
    navigate(`/mission/${missionId}/${datasetId}/situation`);
  };

  const resetAll = () => {
    if (!window.confirm('저장된 미션 근거와 수정 기록을 이 기기에서 지울까요?')) return;
    dispatch({ type: 'RESET_ALL' });
    navigate('/');
  };

  if (!isComplete) {
    const remainingTitles = getIncompleteRequiredMissionTitles(state);
    return (
      <section className="worksheet-page locked-result stage-panel" data-stage="results" aria-labelledby="result-heading">
        <SectionIntro
          id="result-heading"
          title="전체 결과"
          description="네 미션의 근거를 모두 모으면 한 화면에서 다시 볼 수 있어요."
          tone="blue"
        />
        <p className="result-lock-message" role="status">{resultLockCopy(remainingTitles)}</p>
        <div className="action-group">
          <ActionButton type="button" emphasis="next" onClick={() => navigate('/')}>첫 미션으로 돌아가기</ActionButton>
        </div>
      </section>
    );
  }

  return (
    <section className="worksheet-page full-result" aria-labelledby="result-heading">
      <SectionIntro
        id="result-heading"
        title="전체 결과"
        description="내가 고른 근거를 다시 읽고, 평균이 알려 주는 것과 알려 주지 않는 것을 정리해 보세요."
        tone="green"
      />
      <div className="result-safety-notes" aria-label="결과를 읽는 방법">
        <p className="model-boundary">이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.</p>
        <p className="fairness-notice">평균 하나가 공정성이나 개인의 가치를 결정하지 않습니다.</p>
      </div>
      <section className="mission-result-cards" aria-labelledby="mission-results-heading">
        <h2 id="mission-results-heading">미션별 근거</h2>
        {records.map(({ mission, attempt }) => {
          const dataset = mission.datasets.find((item) => item.id === attempt.datasetId);
          if (!dataset) return null;
          const alternate = mission.datasets.find((item) => item.id !== dataset.id) ?? dataset;
          return (
            <MissionSummary
              key={mission.id}
              mission={mission}
              dataset={dataset}
              attempt={attempt}
              dispatch={dispatch}
              headingLevel="h3"
              headingId={`${mission.id}-result-heading`}
              emphasizeFinish={false}
              onRetry={() => startDataset(mission.id, dataset.id)}
              onAlternate={() => startDataset(mission.id, alternate.id)}
              onFinish={() => navigate('/')}
            />
          );
        })}
      </section>
      <TeacherSummary attempts={state.attempts} />
      <nav aria-label="전체 결과 행동" className="result-global-actions">
        <ActionButton type="button" onClick={resetAll}>처음부터 다시</ActionButton>
        <ActionButton type="button" emphasis="next" onClick={() => navigate('/')}>활동 마치기</ActionButton>
      </nav>
    </section>
  );
};
