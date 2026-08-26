import { describe, expect, it } from 'vitest';
import { MISSIONS } from './missions';
import { mean, range, sum } from '../domain/math';

describe('MISSIONS', () => {
  it('contains four missions and exactly two unique datasets per mission', () => {
    expect(MISSIONS).toHaveLength(4);
    expect(MISSIONS.every((mission) => mission.datasets.length === 2)).toBe(true);
    expect(new Set(MISSIONS.flatMap((mission) => mission.datasets.map(({ id }) => id))).size).toBe(8);
  });

  it('uses natural-number means and valid required dataset ids', () => {
    for (const mission of MISSIONS) {
      expect(mission.datasets.some(({ id }) => id === mission.requiredDatasetId)).toBe(true);
      for (const dataset of mission.datasets) {
        expect(Number.isInteger(dataset.expectedMean)).toBe(true);
        const values = dataset.kind === 'twins' ? dataset.leftValues
          : dataset.kind === 'outlier' ? dataset.beforeValues
          : dataset.values;
        expect(mean(values)).toBe(dataset.expectedMean);
        if (dataset.kind === 'twins') expect(Number.isInteger(mean(dataset.rightValues))).toBe(true);
        if (dataset.kind === 'outlier') expect(Number.isInteger(mean(dataset.afterValues))).toBe(true);
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
