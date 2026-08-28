import { useState } from 'react';
import type { Dispatch } from 'react';
import { isCanonicalEvidenceRecord } from '../../domain/evaluation';
import type { LabAction } from '../../domain/session';
import type { EvidenceRecord, MissionDataset, MissionDefinition } from '../../domain/types';
import { EvidenceBuilder, type EvidenceHeadingLevel } from './EvidenceBuilder';
import { ActionButton } from '../shared/ActionButton';

export interface MissionSummaryProps {
  mission: MissionDefinition;
  dataset: MissionDataset;
  attempt: EvidenceRecord;
  dispatch?: Dispatch<LabAction>;
  onRetry: () => void;
  onAlternate: () => void;
  onFinish: () => void;
  headingLevel?: 'h1' | 'h2' | 'h3';
  headingId?: string;
  emphasizeFinish?: boolean;
}

const levelDescription: Record<1 | 2 | 3, string> = {
  1: '계산이나 생각을 한 부분만 근거로 남겼어요.',
  2: '평균의 의미나 변화의 한 부분을 근거로 남겼어요.',
  3: '평균의 의미와 자료의 특징을 연결해 근거를 남겼어요.',
};

const editorHeadingLevel = (level: 'h1' | 'h2' | 'h3'): EvidenceHeadingLevel => {
  if (level === 'h1') return 'h2';
  if (level === 'h2') return 'h3';
  return 'h4';
};

export const MissionSummary = ({
  mission, dataset, attempt, dispatch, onRetry, onAlternate, onFinish, headingLevel = 'h1', headingId = 'mission-summary-heading', emphasizeFinish = true,
}: MissionSummaryProps) => {
  const [editing, setEditing] = useState(false);
  const canonicalAttempt = isCanonicalEvidenceRecord(attempt, mission.id, dataset.id, attempt.revisions)
    ? attempt : null;
  if (!canonicalAttempt) return null;
  const evidenceHeadingId = `${headingId}-evidence`;
  const revisionsHeadingId = `${headingId}-revisions`;
  const levelHeadingId = `${headingId}-level`;

  const saveEdit = (record: EvidenceRecord) => {
    dispatch?.({ type: 'UPDATE_EVIDENCE_ATTEMPT', record });
    setEditing(false);
  };

  return (
    <section className="mission-summary" aria-labelledby={headingId}>
      {headingLevel === 'h1'
        ? <h1 id={headingId}>{mission.learnerTitle} 결과</h1>
        : headingLevel === 'h2'
          ? <h2 id={headingId}>{mission.learnerTitle} 결과</h2>
          : <h3 id={headingId}>{mission.learnerTitle} 결과</h3>}
      {editing ? (
        <EvidenceBuilder
          mission={mission.id}
          dataset={dataset}
          revisions={canonicalAttempt.revisions}
          existingRecord={canonicalAttempt}
          onSubmit={saveEdit}
          headingLevel={editorHeadingLevel(headingLevel)}
          headingId={`${headingId}-editor-heading`}
        />
      ) : (
        <>
          <section className="summary-evidence" aria-labelledby={evidenceHeadingId}>
            {headingLevel === 'h1' ? <h2 id={evidenceHeadingId}>내가 사용한 근거</h2> : <h4 id={evidenceHeadingId}>내가 사용한 근거</h4>}
            <p>{canonicalAttempt.sentence}</p>
          </section>
          <section className="summary-revisions" aria-labelledby={revisionsHeadingId}>
            {headingLevel === 'h1' ? <h2 id={revisionsHeadingId}>고쳐 생각한 과정</h2> : <h4 id={revisionsHeadingId}>고쳐 생각한 과정</h4>}
            <p>수정 기록 {canonicalAttempt.revisions}회</p>
          </section>
          <section className="summary-level" aria-labelledby={levelHeadingId}>
            {headingLevel === 'h1' ? <h2 id={levelHeadingId}>근거 단계</h2> : <h4 id={levelHeadingId}>근거 단계</h4>}
            <p>단계 {canonicalAttempt.level}: {levelDescription[canonicalAttempt.level]}</p>
          </section>
          <nav className="summary-actions" aria-label={`${mission.title} 결과 행동`}>
            <ActionButton type="button" onClick={() => setEditing(true)}>근거 수정</ActionButton>
            <ActionButton type="button" onClick={onRetry}>다시 해보기</ActionButton>
            <ActionButton type="button" onClick={onAlternate}>다른 자료로 도전</ActionButton>
            <ActionButton type="button" emphasis={emphasizeFinish ? 'next' : 'normal'} onClick={onFinish}>활동 마치기</ActionButton>
          </nav>
        </>
      )}
      {editing ? (
        <ActionButton type="button" onClick={() => setEditing(false)}>결과로 돌아가기</ActionButton>
      ) : null}
      <p className="summary-dataset">자료: {dataset.label}</p>
    </section>
  );
};

export { levelDescription };
