import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import {
  COMPARISON_CHOICE_IDS_BY_KIND,
  buildEvidenceSentence,
  isAllowedComparisonSelection,
  deriveEvidenceLevel,
  evaluateCalculation,
  evaluateComparison,
} from './evaluation';

describe('calculation feedback', () => {
  it('guides the next check instead of ending with a wrong label', () => {
    const result = evaluateCalculation({
      values: [2, 4, 6, 8],
      enteredTotal: 19,
      enteredCount: 4,
      enteredMean: 5,
    });
    expect(result).toEqual({
      isCorrect: false,
      message: '상자 속 수를 다시 모두 더해 보세요.',
      nextAction: '전체 양은 그대로인지 확인해 보세요.',
    });
    expect(`${result.message} ${result.nextAction}`).not.toContain('틀렸습니다');
  });

  it('checks total, then count, then mean in that order', () => {
    expect(evaluateCalculation({ values: [2, 4, 6, 8], enteredTotal: 19, enteredCount: 3, enteredMean: 4 })).toEqual({
      isCorrect: false,
      message: '상자 속 수를 다시 모두 더해 보세요.',
      nextAction: '전체 양은 그대로인지 확인해 보세요.',
    });
    expect(evaluateCalculation({ values: [2, 4, 6, 8], enteredTotal: 20, enteredCount: 3, enteredMean: 4 })).toEqual({
      isCorrect: false,
      message: '자료 칸의 개수를 다시 세어 보세요.',
      nextAction: '자료는 몇 개인가요?',
    });
    expect(evaluateCalculation({ values: [2, 4, 6, 8], enteredTotal: 20, enteredCount: 4, enteredMean: 4 })).toEqual({
      isCorrect: false,
      message: '합계를 자료 개수로 나누어 보세요.',
      nextAction: '20 ÷ 4를 계산해 보세요.',
    });
    expect(evaluateCalculation({ values: [2, 4, 6, 8], enteredTotal: 20, enteredCount: 4, enteredMean: 5 })).toEqual({
      isCorrect: true,
      message: '재배분한 값과 계산한 평균이 같아요.',
      nextAction: '근거를 남기고 다음 단계로 가세요.',
    });
  });
});

describe('comparison feedback', () => {
  it('keeps comparison choice IDs scoped to each dataset kind', () => {
    expect(COMPARISON_CHOICE_IDS_BY_KIND.twins).toEqual(['same-mean', 'different-spread', 'same-shape']);
    expect(isAllowedComparisonSelection(getDataset('twins-4-a'), ['same-mean', 'different-spread'])).toBe(true);
    expect(isAllowedComparisonSelection(getDataset('twins-4-a'), ['sum-changed-first'])).toBe(false);
    expect(isAllowedComparisonSelection(getDataset('outlier-5-a'), ['same-mean'])).toBe(false);
    expect(isAllowedComparisonSelection(getDataset('balance-20-a'), [])).toBe(false);
  });

  it('treats same-shape as an incorrect twins explanation even with the correct pair', () => {
    expect(evaluateComparison(getDataset('twins-4-a'), ['same-mean', 'different-spread', 'same-shape'])).toEqual({
      isCorrect: false,
      message: '평균이 같아도 각 값과 퍼짐은 다를 수 있어요.',
      nextAction: '점도표에서 각 값과 퍼짐을 다시 살펴보세요.',
    });
  });

  it('requires same mean and different spread for twins', () => {
    const dataset = getDataset('twins-4-a');
    expect(evaluateComparison(dataset, ['same-mean'])).toEqual({
      isCorrect: false,
      message: '점들이 얼마나 퍼져 있는지도 살펴보세요.',
      nextAction: '두 자료의 범위나 각 값을 비교해 보세요.',
    });
    expect(evaluateComparison(dataset, ['same-mean', 'different-spread'])).toEqual({
      isCorrect: true,
      message: '평균은 같지만 자료의 모양은 다를 수 있어요.',
      nextAction: '근거 문장을 완성해 보세요.',
    });
  });

  it('requires sum change before mean change for outliers', () => {
    const dataset = getDataset('outlier-5-a');
    expect(evaluateComparison(dataset, ['mean-changed-after'])).toEqual({
      isCorrect: false,
      message: '합계 변화를 먼저 살펴보세요.',
      nextAction: '변경 전후의 전체 양을 비교해 보세요.',
    });
    expect(evaluateComparison(dataset, ['sum-changed-first'])).toEqual({
      isCorrect: false,
      message: '이제 평균 변화도 연결해 보세요.',
      nextAction: '합계 변화가 평균에 어떻게 이어지는지 확인해 보세요.',
    });
    expect(evaluateComparison(dataset, ['sum-changed-first', 'mean-changed-after'])).toEqual({
      isCorrect: true,
      message: '합계가 먼저 변하고 평균도 변했어요.',
      nextAction: '근거 문장을 완성해 보세요.',
    });
    expect(evaluateComparison(dataset, ['mean-changed-after', 'sum-changed-first'])).toEqual({
      isCorrect: false,
      message: '합계 변화를 먼저 살펴보세요.',
      nextAction: '변경 전후의 전체 양을 비교해 보세요.',
    });
  });

  it('requires a range or individual-value reason for representative review', () => {
    const dataset = getDataset('review-cards-a');
    expect(evaluateComparison(dataset, ['mean-always-enough'])).toEqual({
      isCorrect: false,
      message: '평균만으로 모든 자료를 판단할 수는 없어요.',
      nextAction: '범위나 각 값을 함께 살펴보세요.',
    });
    expect(evaluateComparison(dataset, ['range-or-individual-values'])).toEqual({
      isCorrect: true,
      message: '평균과 범위 또는 각 값을 함께 살펴보았어요.',
      nextAction: '근거 문장을 완성해 보세요.',
    });
  });
});

describe('evidence levels', () => {
  it.each([
    ['balance-delivery', ['redistribution-and-division'], 3],
    ['balance-delivery', ['redistribution-only'], 2],
    ['balance-delivery', ['calculation-only'], 1],
    ['mean-twins', ['same-mean-and-different-spread'], 3],
    ['mean-twins', ['same-mean-only'], 2],
    ['mean-twins', ['same-shape'], 1],
    ['outlier-alert', ['sum-change-and-mean-change'], 3],
    ['outlier-alert', ['direction-only'], 2],
    ['outlier-alert', ['guess-only'], 1],
    ['representative-review', ['mean-use-and-limit', 'range-or-individual-values'], 3],
    ['representative-review', ['mean-use-and-limit'], 2],
    ['representative-review', ['range-or-individual-values'], 2],
    ['representative-review', ['mean-always-enough'], 1],
  ] as const)('maps %s evidence to level %i', (missionId, ids, expected) => {
    expect(deriveEvidenceLevel(missionId, ids)).toBe(expected);
  });

  it.each([
    ['balance-delivery', [], 1],
    ['balance-delivery', ['same-mean-only'], 1],
    ['mean-twins', [], 1],
    ['mean-twins', ['redistribution-only'], 1],
    ['outlier-alert', [], 1],
    ['outlier-alert', ['same-shape'], 1],
    ['representative-review', [], 1],
    ['representative-review', ['direction-only'], 1],
  ] as const)('keeps empty or cross-mission evidence at level 1 for %s', (missionId, ids, expected) => {
    expect(deriveEvidenceLevel(missionId, ids)).toBe(expected);
  });

  it('builds representative sentences from fixed reviewed fragments', () => {
    expect(buildEvidenceSentence(
      'representative-review',
      'review-cards-a',
      ['mean-use-and-limit', 'range-or-individual-values'],
    )).toBe('평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.');
  });

  it.each([
    ['balance-20-a', '고르게 옮긴 결과, 전체 양 20을 자료 4개로 나누어 평균 5를 확인했어요.'],
    ['balance-24-b', '고르게 옮긴 결과, 전체 양 24을 자료 4개로 나누어 평균 6를 확인했어요.'],
  ] as const)('keeps exact balance evidence sentence for %s', (datasetId, expected) => {
    expect(buildEvidenceSentence('balance-delivery', datasetId, ['redistribution-and-division'])).toBe(expected);
  });

  it.each([
    ['twins-4-a', '두 자료의 평균은 4으로 같지만, 범위는 0과 6로 달라요.'],
    ['twins-6-b', '두 자료의 평균은 6으로 같지만, 범위는 0과 8로 달라요.'],
  ] as const)('keeps exact twins evidence sentence for %s', (datasetId, expected) => {
    expect(buildEvidenceSentence('mean-twins', datasetId, ['same-mean-and-different-spread'])).toBe(expected);
  });

  it.each([
    ['outlier-5-a', '전체 양이 20에서 24로 4 늘고 평균이 5에서 6로 1 늘었어요.'],
    ['outlier-6-b', '전체 양이 24에서 32로 8 늘고 평균이 6에서 8로 2 늘었어요.'],
  ] as const)('keeps exact outlier evidence sentence for %s', (datasetId, expected) => {
    expect(buildEvidenceSentence('outlier-alert', datasetId, ['sum-change-and-mean-change'])).toBe(expected);
  });

  it('keeps the reviewed representative sentence for both datasets', () => {
    expect(buildEvidenceSentence(
      'representative-review',
      'review-cards-a',
      ['mean-use-and-limit', 'range-or-individual-values'],
    )).toBe('평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.');
    expect(buildEvidenceSentence(
      'representative-review',
      'review-baskets-b',
      ['mean-use-and-limit', 'range-or-individual-values'],
    )).toBe('평균은 3개이지만 세 보급 상자는 1개뿐이므로 평균만으로 모든 보급 상자의 상태를 말할 수 없습니다.');
  });
});
