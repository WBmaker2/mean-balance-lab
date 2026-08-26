import { MISSIONS, getDataset } from '../../content/missions';
import { isCanonicalEvidenceRecord } from '../../domain/evaluation';
import type { LabSessionState } from '../../domain/session';
import type { DatasetId, EvidenceRecord, MissionDefinition } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';
import { levelDescription } from '../mission/MissionSummary';

export interface TeacherSummaryProps {
  attempts: LabSessionState['attempts'] | readonly TeacherSummaryRow[];
}

export interface TeacherSummaryRow {
  mission: MissionDefinition;
  attempt: EvidenceRecord;
}

const rowsFor = (attempts: TeacherSummaryProps['attempts']): readonly TeacherSummaryRow[] => {
  if (Array.isArray(attempts)) return attempts;
  const attemptMap = attempts as LabSessionState['attempts'];
  return MISSIONS.flatMap((mission) => {
    const attempt = attemptMap[mission.requiredDatasetId as DatasetId];
    return attempt && isCanonicalEvidenceRecord(attempt, mission.id, mission.requiredDatasetId, attempt.revisions)
      ? [{ mission, attempt }] : [];
  });
};

export const TeacherSummary = ({ attempts }: TeacherSummaryProps) => (
  <section className="teacher-summary" aria-labelledby="teacher-summary-heading">
    <h2 id="teacher-summary-heading">교사용 활동 요약</h2>
    <ActionButton className="teacher-summary-controls" type="button" onClick={() => window.print()}>
      교사용 요약 인쇄
    </ActionButton>
    <div className="teacher-summary-table-region" role="region" aria-label="교사용 요약 표">
      <table>
        <caption className="sr-only">미션별 근거와 수정 기록</caption>
        <thead>
          <tr><th scope="col">미션</th><th scope="col">자료</th><th scope="col">선택한 근거</th><th scope="col">근거 단계 설명</th><th scope="col">수정 기록</th></tr>
        </thead>
        <tbody>
          {rowsFor(attempts).map(({ mission, attempt }) => (
            <tr key={attempt.datasetId}>
              <th scope="row">{mission.title}</th>
              <td>{getDataset(attempt.datasetId).label}</td>
              <td>{attempt.sentence}</td>
              <td>{levelDescription[attempt.level]}</td>
              <td>{attempt.revisions}회</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
