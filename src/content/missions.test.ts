import { describe, expect, it } from 'vitest';
import { MISSIONS } from './missions';
import { mean, range, sum } from '../domain/math';

const EXPECTED_CONTRACT = [
  {
    id: 'balance-delivery',
    title: '1. 균형 배송',
    learningGoal: '전체 양을 보존하며 같은 수로 나누어요.',
    requiredDatasetId: 'balance-20-a',
    datasets: [
      {
        kind: 'balance', id: 'balance-20-a', label: '기본 구슬 상자',
        context: '가상 포장 상자 네 개의 구슬을 고르게 나눕니다.',
        stages: ['situation', 'predict', 'redistribute', 'calculate', 'explain', 'mission-result'],
        expectedMean: 5, values: [2, 4, 6, 8], targetValues: [5, 5, 5, 5],
      },
      {
        kind: 'balance', id: 'balance-24-b', label: '도전 구슬 상자',
        context: '다른 가상 포장 상자 네 개의 구슬을 고르게 나눕니다.',
        stages: ['situation', 'predict', 'redistribute', 'calculate', 'explain', 'mission-result'],
        expectedMean: 6, values: [1, 5, 7, 11], targetValues: [6, 6, 6, 6],
      },
    ],
  },
  {
    id: 'mean-twins',
    title: '2. 평균 쌍둥이',
    learningGoal: '평균이 같아도 자료의 모양은 다를 수 있어요.',
    requiredDatasetId: 'twins-4-a',
    datasets: [
      {
        kind: 'twins', id: 'twins-4-a', label: '평균 4 카드',
        context: '두 가상 선반의 독서 카드 수를 비교합니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 4, leftValues: [4, 4, 4, 4], rightValues: [1, 3, 5, 7],
      },
      {
        kind: 'twins', id: 'twins-6-b', label: '평균 6 카드',
        context: '다른 두 가상 선반의 독서 카드 수를 비교합니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 6, leftValues: [6, 6, 6, 6], rightValues: [2, 4, 8, 10],
      },
    ],
  },
  {
    id: 'outlier-alert',
    title: '3. 튀는 값 경보',
    learningGoal: '합계 변화와 평균 변화를 연결해요.',
    requiredDatasetId: 'outlier-5-a',
    datasets: [
      {
        kind: 'outlier', id: 'outlier-5-a', label: '4 증가 바구니',
        context: '가상 수확 바구니 하나의 수를 바꾸어 평균 변화를 살펴봅니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 5, beforeValues: [4, 5, 5, 6], afterValues: [4, 5, 5, 10], changedIndex: 3,
      },
      {
        kind: 'outlier', id: 'outlier-6-b', label: '8 증가 바구니',
        context: '다른 가상 수확 바구니 하나의 수를 바꾸어 평균 변화를 살펴봅니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 6, beforeValues: [5, 6, 6, 7], afterValues: [5, 6, 6, 15], changedIndex: 3,
      },
    ],
  },
  {
    id: 'representative-review',
    title: '4. 대표값 심의',
    learningGoal: '평균의 도움과 한계를 근거로 판단해요.',
    requiredDatasetId: 'review-cards-a',
    datasets: [
      {
        kind: 'representativeness', id: 'review-cards-a', label: '독서 카드 배치',
        context: '가상 선반별 독서 카드 배치를 평균만으로 설명할 수 있는지 살펴봅니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 4, values: [2, 2, 2, 2, 12],
        acceptedEvidenceIds: ['mean-use-and-limit', 'range-or-individual-values'],
        modelSentence: '평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.',
      },
      {
        kind: 'representativeness', id: 'review-baskets-b', label: '보급 상자 배치',
        context: '가상 보급 상자 네 곳의 물건 수를 평균만으로 설명할 수 있는지 살펴봅니다.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 3, values: [1, 1, 1, 9],
        acceptedEvidenceIds: ['mean-use-and-limit', 'range-or-individual-values'],
        modelSentence: '평균은 3개이지만 세 보급 상자는 1개뿐이므로 평균만으로 모든 보급 상자의 상태를 말할 수 없습니다.',
      },
    ],
  },
] as const;

describe('MISSIONS', () => {
  it('locks every fixed mission and dataset field', () => {
    expect(MISSIONS).toEqual(EXPECTED_CONTRACT);
  });

  it('contains four missions and exactly two unique datasets per mission', () => {
    expect(MISSIONS).toHaveLength(4);
    expect(MISSIONS.every((mission) => mission.datasets.length === 2)).toBe(true);
    expect(new Set(MISSIONS.flatMap((mission) => mission.datasets.map(({ id }) => id))).size).toBe(8);
  });

  it('uses natural-number means and valid required dataset ids', () => {
    for (const mission of MISSIONS) {
      expect(mission.datasets.some(({ id }) => id === mission.requiredDatasetId)).toBe(true);
      for (const dataset of mission.datasets) {
        expect(Number.isInteger(dataset.expectedMean) && dataset.expectedMean > 0).toBe(true);
        const values = dataset.kind === 'twins' ? dataset.leftValues
          : dataset.kind === 'outlier' ? dataset.beforeValues
          : dataset.values;
        expect(mean(values)).toBe(dataset.expectedMean);
        if (dataset.kind === 'twins') {
          const rightMean = mean(dataset.rightValues);
          expect(Number.isInteger(rightMean) && rightMean > 0).toBe(true);
        }
        if (dataset.kind === 'outlier') {
          const afterMean = mean(dataset.afterValues);
          expect(Number.isInteger(afterMean) && afterMean > 0).toBe(true);
        }
      }
    }
  });

  it('fixes the concept-specific invariants', () => {
    const twins = MISSIONS[1].datasets;
    expect(twins.every((item) => item.kind === 'twins'
      && mean(item.leftValues) === mean(item.rightValues)
      && range(item.leftValues) !== range(item.rightValues))).toBe(true);
    const outliers = MISSIONS[2].datasets;
    expect(outliers.map((item) => item.kind === 'outlier'
      ? sum(item.afterValues) - sum(item.beforeValues) : 0)).toEqual([4, 8]);
  });
});
