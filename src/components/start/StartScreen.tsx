import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLabSession } from '../../state/LabSessionContext';
import { MISSIONS } from '../../content/missions';
import { isCanonicalEvidenceRecord } from '../../domain/evaluation';
import { routeFor } from '../../app/router';
import { ActionButton } from '../shared/ActionButton';
import { SectionIntro } from '../shared/SectionIntro';
import { stageLabel } from '../../content/stages';

type Difficulty = 'a' | 'b';

const goals = [
  '평균을 전체 양을 고르게 나눈 값으로 설명합니다.',
  '자료의 합과 개수로 평균을 구하고 재배분 결과와 연결합니다.',
  '평균이 같아도 자료의 모양이 다를 수 있음을 구별합니다.',
  '평균의 도움과 한계를 근거와 함께 판단합니다.',
] as const;

export const StartScreen = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('a');
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState: unknown = location.state;
  const recoveryMessage = typeof locationState === 'object'
    && locationState !== null
    && 'recoveryMessage' in locationState
    && typeof locationState.recoveryMessage === 'string'
    ? locationState.recoveryMessage
    : undefined;
  const nextMission = MISSIONS.find((mission) => {
    const attempt = state.attempts[mission.requiredDatasetId];
    const hasCanonicalRequiredAttempt = attempt !== undefined
      && isCanonicalEvidenceRecord(attempt, mission.id, mission.requiredDatasetId, attempt.revisions);
    return !(state.completedRequiredMissions.includes(mission.id) && hasCanonicalRequiredAttempt);
  });
  const dataset = nextMission?.datasets.find((candidate) => candidate.id.endsWith(difficulty)) ?? nextMission?.datasets[0];
  const activeRun = state.activeRun;
  const activeMission = activeRun ? MISSIONS.find((mission) => mission.id === activeRun.missionId) : undefined;
  const activeDataset = activeRun ? activeMission?.datasets.find((candidate) => candidate.id === activeRun.datasetId) : undefined;

  const start = () => {
    if (!nextMission || !dataset) return;
    if (activeRun && activeRun.missionId === nextMission.id && activeRun.datasetId === dataset.id) {
      resume();
      return;
    }
    const hasInProgressRun = activeRun && activeRun.stage !== 'mission-result';
    if (hasInProgressRun && !window.confirm('현재 진행 중인 자료를 버리고 새 미션을 시작할까요?')) return;
    dispatch({ type: 'START_DATASET', missionId: nextMission.id, datasetId: dataset.id });
    navigate(routeFor(nextMission.id, dataset.id, 'situation').replace(/^#/, ''));
  };

  const resume = () => {
    if (!activeRun) return;
    navigate(routeFor(activeRun.missionId, activeRun.datasetId, activeRun.stage).replace(/^#/, ''));
  };

  return (
    <section className="worksheet-page start-screen">
      <span id="artifact-records" className="sr-only" tabIndex={-1} aria-label="실험 기록 위치" />
      {recoveryMessage ? <p role="alert">{recoveryMessage}</p> : null}
      <SectionIntro
        id="start-heading"
        title="평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?"
        description="자료를 직접 살펴보며 평균의 뜻과 움직임을 찾아봐요."
        tone="blue"
      />
      <p className="start-next-action">다음 행동: 자료 난이도를 고르고 미션 시작을 눌러요.</p>
      <section className="goal-card" aria-labelledby="goal-heading">
        <h2 id="goal-heading">오늘의 목표</h2>
        <p>평균을 네 가지 방법으로 살펴봐요.</p>
        <ul>{goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
      </section>
      {activeRun && activeMission && activeDataset ? (
        <aside className="resume-card" aria-label="진행 중인 미션">
          <h2>{activeMission.learnerTitle}</h2>
          <p>자료: {activeDataset.label}</p>
          <p>현재 단계: {stageLabel(activeRun.stage)}</p>
          <ActionButton type="button" onClick={resume}>이어서 하기</ActionButton>
        </aside>
      ) : null}
      {nextMission ? (
        <section className="next-mission-card" aria-labelledby="next-mission-heading">
          <h2 id="next-mission-heading">다음 미션: {nextMission.learnerTitle}</h2>
          <p>{nextMission.learningGoal}</p>
          <fieldset>
            <legend>자료 난이도</legend>
            <label>
              <input type="radio" name="difficulty" value="a" checked={difficulty === 'a'} onChange={() => setDifficulty('a')} />
              기본(A 세트)
            </label>
            <label>
              <input type="radio" name="difficulty" value="b" checked={difficulty === 'b'} onChange={() => setDifficulty('b')} />
              도전(B 세트)
            </label>
          </fieldset>
          <p className="difficulty-description">{difficulty === 'a' ? '기본 자료로 시작' : '도전 자료로 시작'}</p>
          <div className="start-actions">
            {activeRun && activeRun.missionId === nextMission.id && activeRun.datasetId === dataset?.id ? (
              <ActionButton type="button" emphasis="next" onClick={resume}>이어서 하기</ActionButton>
            ) : (
              <ActionButton type="button" emphasis="next" onClick={start}>미션 시작</ActionButton>
            )}
          </div>
        </section>
      ) : (
        <div className="start-actions">
          <ActionButton type="button" emphasis="next" onClick={() => navigate('/results')}>전체 결과 보기</ActionButton>
        </div>
      )}
    </section>
  );
};
