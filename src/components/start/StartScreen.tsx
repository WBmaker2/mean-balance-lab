import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLabSession } from '../../state/LabSessionContext';
import type { DatasetId } from '../../domain/types';
import { routeFor } from '../../app/router';
import { ActionButton } from '../shared/ActionButton';

type Difficulty = 'a' | 'b';

const goals = [
  '평균을 전체 양을 고르게 나눈 값으로 설명합니다.',
  '자료의 합과 개수로 평균을 구하고 재배분 결과와 연결합니다.',
  '평균이 같아도 자료의 모양이 다를 수 있음을 구별합니다.',
  '평균의 도움과 한계를 근거와 함께 판단합니다.',
] as const;

export const StartScreen = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('a');
  const { dispatch } = useLabSession();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState: unknown = location.state;
  const recoveryMessage = typeof locationState === 'object'
    && locationState !== null
    && 'recoveryMessage' in locationState
    && typeof locationState.recoveryMessage === 'string'
    ? locationState.recoveryMessage
    : undefined;
  const datasetId: DatasetId = difficulty === 'a' ? 'balance-20-a' : 'balance-24-b';

  const start = () => {
    dispatch({ type: 'START_DATASET', missionId: 'balance-delivery', datasetId });
    navigate(routeFor('balance-delivery', datasetId, 'situation').replace(/^#/, ''));
  };

  return (
    <section aria-labelledby="start-heading">
      {recoveryMessage ? <p role="alert">{recoveryMessage}</p> : null}
      <p>오늘의 질문</p>
      <h1 id="start-heading">평균은 여러 값을 어떻게 대표하며, 한 값이 달라지면 평균은 왜 움직일까요?</h1>
      <h2>오늘의 목표</h2>
      <ul>{goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
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
      <p>{difficulty === 'a' ? '기본 자료로 시작' : '도전 자료로 시작'}</p>
      <ActionButton type="button" emphasis="next" onClick={start}>미션 시작</ActionButton>
    </section>
  );
};
