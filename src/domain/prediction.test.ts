import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import { isAllowedPrediction, predictionOptions } from './prediction';

describe('dataset prediction contract', () => {
  it('offers and accepts only the three natural values around a non-outlier mean', () => {
    const dataset = getDataset('balance-20-a');
    expect(predictionOptions(dataset).map((option) => option.value)).toEqual([4, 5, 6]);
    expect([4, 5, 6].every((value) => isAllowedPrediction(dataset, value))).toBe(true);
    expect(isAllowedPrediction(dataset, 3)).toBe(false);
    expect(isAllowedPrediction(dataset, 'increase')).toBe(false);
  });

  it('accepts exactly directional values for outlier data', () => {
    const dataset = getDataset('outlier-5-a');
    expect(predictionOptions(dataset).map((option) => option.value)).toEqual(['increase', 'decrease', 'same']);
    expect(['increase', 'decrease', 'same'].every((value) => isAllowedPrediction(dataset, value))).toBe(true);
    expect(isAllowedPrediction(dataset, 5)).toBe(false);
    expect(isAllowedPrediction(dataset, 'other')).toBe(false);
  });
});
