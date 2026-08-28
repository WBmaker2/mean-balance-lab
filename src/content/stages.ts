import type { LearningStage } from '../domain/types';

export const STAGE_LABELS: Readonly<Record<LearningStage, string>> = {
  situation: '상황',
  predict: '예측',
  redistribute: '재배분',
  calculate: '계산',
  compare: '비교',
  explain: '설명',
  'mission-result': '미션 결과',
};

export const stageLabel = (stage: LearningStage): string => STAGE_LABELS[stage];
