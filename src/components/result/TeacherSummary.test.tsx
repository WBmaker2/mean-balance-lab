import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession } from '../../test/fixtures';
import { MISSIONS } from '../../content/missions';
import { isCanonicalEvidenceRecord } from '../../domain/evaluation';
import { TeacherSummary } from './TeacherSummary';

describe('TeacherSummary', () => {
  afterEach(cleanup);

  it('renders one privacy-safe table with mission, dataset, evidence, level, and revisions', () => {
    const state = completedSession();
    const attempts = MISSIONS.map((mission) => ({ mission, attempt: state.attempts[mission.requiredDatasetId]! }))
      .filter(({ mission, attempt }) => isCanonicalEvidenceRecord(attempt, mission.id, mission.requiredDatasetId, attempt.revisions));
    render(<TeacherSummary attempts={attempts} />);
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.queryByLabelText(/이름|학번|학생 번호|식별자/)).not.toBeInTheDocument();
    expect(screen.queryByText(/총점|순위|백분율|학급 비교/)).not.toBeInTheDocument();
  });

  it('prints through the explicit teacher action', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const state = completedSession();
    const attempts = MISSIONS.map((mission) => ({ mission, attempt: state.attempts[mission.requiredDatasetId]! }));
    render(<TeacherSummary attempts={attempts} />);
    await userEvent.setup().click(screen.getByRole('button', { name: '교사용 요약 인쇄' }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it('renders mobile cards and retains the labelled table', () => {
    const state = completedSession();
    const attempts = MISSIONS.map((mission) => ({ mission, attempt: state.attempts[mission.requiredDatasetId]! }));
    render(<TeacherSummary attempts={attempts} />);
    expect(screen.getByRole('list', { name: '모바일 교사용 요약' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
