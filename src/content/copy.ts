import type { EvidenceChoiceId } from '../domain/types';

/** 학생에게 보여 주는 계산 확인 피드백입니다. 모든 오답 안내는 다음 행동을 함께 제공합니다. */
export const CALCULATION_COPY = {
  totalMessage: '상자 속 수를 다시 모두 더해 보세요.',
  totalNextAction: '전체 양은 그대로인지 확인해 보세요.',
  countMessage: '자료 칸의 개수를 다시 세어 보세요.',
  countNextAction: '자료는 몇 개인가요?',
  meanMessage: '합계를 자료 개수로 나누어 보세요.',
  successMessage: '재배분한 값과 계산한 평균이 같아요.',
  successNextAction: '근거를 남기고 다음 단계로 가세요.',
} as const;

export const COMPARISON_COPY = {
  twinsMeanNextAction: '두 자료의 평균을 먼저 비교해 보세요.',
  twinsMeanNextActionDetail: '자료 A와 자료 B의 합계를 각각 자료 개수로 나누어 보세요.',
  twinsSpreadMessage: '점들이 얼마나 퍼져 있는지도 살펴보세요.',
  twinsSpreadNextAction: '두 자료의 범위나 각 값을 비교해 보세요.',
  twinsSuccessMessage: '평균은 같지만 자료의 모양은 다를 수 있어요.',
  outlierSumMessage: '합계 변화를 먼저 살펴보세요.',
  outlierSumNextAction: '변경 전후의 전체 양을 비교해 보세요.',
  outlierMeanMessage: '이제 평균 변화도 연결해 보세요.',
  outlierMeanNextAction: '합계 변화가 평균에 어떻게 이어지는지 확인해 보세요.',
  outlierSuccessMessage: '합계가 먼저 변하고 평균도 변했어요.',
  representativeAlwaysMessage: '평균만으로 모든 자료를 판단할 수는 없어요.',
  representativeAlwaysNextAction: '범위나 각 값을 함께 살펴보세요.',
  representativeRangeMessage: '범위나 각 값을 함께 살펴보세요.',
  representativeRangeNextAction: '평균과 범위 또는 각 값을 비교해 보세요.',
  representativeSuccessMessage: '평균과 범위 또는 각 값을 함께 살펴보았어요.',
  evidenceNextAction: '근거 문장을 완성해 보세요.',
} as const;

/** 근거 선택지에서만 문장을 만들 수 있도록 검토한 문구를 고정합니다. */
export const EVIDENCE_FRAGMENTS: Readonly<Record<EvidenceChoiceId, string>> = {
  'redistribution-and-division': '고르게 옮긴 결과와 합계 ÷ 개수를 함께 확인했어요.',
  'redistribution-only': '자료를 고르게 옮긴 결과를 확인했어요.',
  'calculation-only': '합계 ÷ 개수로 평균을 계산했어요.',
  'same-mean-and-different-spread': '두 자료의 평균은 같고 퍼짐은 달라요.',
  'same-mean-only': '두 자료의 평균이 같다는 점을 살펴보았어요.',
  'same-shape': '자료의 모양을 살펴보았어요.',
  'sum-change-and-mean-change': '합계 변화와 평균 변화를 연결했어요.',
  'direction-only': '평균이 변하는 방향을 살펴보았어요.',
  'guess-only': '평균 변화를 추측해 보았어요.',
  'mean-use-and-limit': '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.',
  'range-or-individual-values': '범위와 각 값도 함께 봐야 합니다.',
  'mean-always-enough': '평균만으로 모든 자료를 판단할 수 있다고 생각했어요.',
};

/** 숫자는 도메인에서 계산하고, 학생에게 보이는 문장 틀은 이 검토된 팩토리에서만 만듭니다. */
export const buildBalanceEvidenceSentence = (
  total: number,
  count: number,
  average: number,
): string => `고르게 옮긴 결과, 전체 양 ${total}을 자료 ${count}개로 나누어 평균 ${average}를 확인했어요.`;

export const buildBalanceCalculationSentence = (
  total: number,
  count: number,
  average: number,
): string => `전체 양 ${total}을 자료 ${count}개로 나누어 평균 ${average}를 계산했어요.`;

export const buildTwinsEvidenceSentence = (
  average: number,
  leftRange: number,
  rightRange: number,
): string => `두 자료의 평균은 ${average}으로 같지만, 범위는 ${leftRange}과 ${rightRange}로 달라요.`;

export const buildTwinsMeanSentence = (leftMean: number, rightMean: number): string =>
  `두 자료의 평균은 각각 ${leftMean}과 ${rightMean}으로 같아요.`;

export const buildOutlierEvidenceSentence = (
  beforeTotal: number,
  afterTotal: number,
  totalDelta: number,
  beforeMean: number,
  afterMean: number,
  meanDelta: number,
): string => `전체 양이 ${beforeTotal}에서 ${afterTotal}로 ${totalDelta} 늘고 평균이 ${beforeMean}에서 ${afterMean}로 ${meanDelta} 늘었어요.`;

export const buildRepresentativeEvidenceSentence = (modelSentence: string): string => modelSentence;

export const SAFETY_COPY = {
  modelBoundary: '이 활동은 실제 세계를 정밀하게 측정하지 않는 교육용 이산 모형입니다.',
  fairness: '평균 하나가 공정성이나 개인의 가치를 결정하지 않습니다.',
  usefulness: '평균은 자료를 간단히 살펴보는 데 도움이 되지만, 모든 차이를 보여 주지는 않습니다.',
} as const;
