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

export interface StageMeta {
  label: string;
  action: string;
}

export const STAGE_META: Readonly<Record<LearningStage, StageMeta>> = {
  situation: { label: '상황', action: '자료를 읽고 어떤 상황인지 살펴봐요.' },
  predict: { label: '예측', action: '평균이 어떻게 될지 먼저 골라 봐요.' },
  redistribute: { label: '재배분', action: '전체 양을 지키며 고르게 옮겨 봐요.' },
  calculate: { label: '계산', action: '전체 양 ÷ 자료 개수로 평균을 계산해요.' },
  compare: { label: '비교', action: '평균과 자료의 모습을 함께 비교해요.' },
  explain: { label: '설명', action: '살펴본 근거로 문장을 완성해요.' },
  'mission-result': { label: '미션 결과', action: '배운 내용을 확인하고 다음 미션을 골라요.' },
};

export const stageLabel = (stage: LearningStage): string => STAGE_LABELS[stage];

export const stageAction = (stage: LearningStage): string => STAGE_META[stage].action;
