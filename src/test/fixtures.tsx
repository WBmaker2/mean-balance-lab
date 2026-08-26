import type { ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import App from '../app/App';
import {
  createInitialSession, type LabSessionState, type StageArtifacts,
} from '../domain/session';
import { buildEvidenceSentence, deriveEvidenceLevel } from '../domain/evaluation';
import type { EvidenceRecord, MissionId } from '../domain/types';

const balanceEvidence = (): EvidenceRecord => ({
  missionId: 'balance-delivery',
  datasetId: 'balance-20-a',
  selectedIds: ['redistribution-and-division'],
  sentence: buildEvidenceSentence('balance-delivery', 'balance-20-a', ['redistribution-and-division']),
  level: deriveEvidenceLevel('balance-delivery', ['redistribution-and-division']),
  revisions: 0,
});

export const verifiedBalanceArtifacts = (): StageArtifacts => ({
  prediction: { value: 5 },
  redistribution: {
    initialValues: [2, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [], confirmed: true,
  },
  calculations: { current: { target: 'current', total: 20, count: 4, average: 5, verified: true } },
  evidence: balanceEvidence(),
});

export const completedBalanceStateWithTwoRetries = (): LabSessionState => ({
  ...createInitialSession(),
  activeRun: {
    missionId: 'balance-delivery', datasetId: 'balance-20-a', stage: 'mission-result',
    artifacts: verifiedBalanceArtifacts(), revisions: 2, transientFeedback: null,
  },
  attempts: { 'balance-20-a': balanceEvidence() },
  completedRequiredMissions: ['balance-delivery'],
});

export const stateWithCompletedEvidenceAndWrongFeedback = (): LabSessionState => ({
  ...createInitialSession(),
  activeRun: {
    missionId: 'balance-delivery', datasetId: 'balance-20-a', stage: 'calculate',
    artifacts: {
      ...verifiedBalanceArtifacts(),
      calculations: { current: { target: 'current', total: 20, count: 4, average: 5, verified: true } },
    },
    revisions: 1,
    transientFeedback: { isCorrect: false, message: '임시 피드백', nextAction: '다시 시도' },
  },
  attempts: { 'balance-20-a': balanceEvidence() },
  completedRequiredMissions: ['balance-delivery'],
});

export const sessionWithThreeRequiredMissions = (): LabSessionState => ({
  ...completedBalanceStateWithTwoRetries(),
  completedRequiredMissions: ['balance-delivery', 'mean-twins', 'outlier-alert'],
});

export const completedSession = (): LabSessionState => ({
  ...sessionWithThreeRequiredMissions(),
  completedRequiredMissions: ['balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review'],
});

export const invalidShapeSession = (): unknown => ({
  ...completedBalanceStateWithTwoRetries(),
  activeRun: {
    ...completedBalanceStateWithTwoRetries().activeRun,
    missionId: 'unknown-mission',
    artifacts: {
      ...completedBalanceStateWithTwoRetries().activeRun?.artifacts,
      redistribution: { initialValues: [-1, 4, 6, 8], currentValues: [5, 5, 5, 5], undoStack: [] },
    },
  },
});

export const renderAppAt = (hash: string, initialState?: LabSessionState): RenderResult => {
  window.location.hash = hash;
  return render(<App {...(initialState ? { initialState } : {})} />);
};

export type { LabSessionState, MissionId, ReactNode };
