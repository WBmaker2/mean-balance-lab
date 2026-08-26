import { describe, expect, it } from 'vitest';
import { getDataset } from '../content/missions';
import { PREDICTION_CASES } from '../test/predictionCases';
import { isAllowedPrediction, predictionOptions } from './prediction';

describe('dataset prediction contract', () => {
  it.each(PREDICTION_CASES)('$datasetId exposes its exact three prediction options', (testCase) => {
    const dataset = getDataset(testCase.datasetId);
    expect(dataset.kind).toBe(testCase.kind);
    expect(dataset.expectedMean).toBe(testCase.expectedMean);
    expect(predictionOptions(dataset)).toEqual(testCase.options);
    for (const option of testCase.options) {
      expect(isAllowedPrediction(dataset, option.value)).toBe(true);
    }
    expect(isAllowedPrediction(dataset, testCase.crossKindValue)).toBe(false);
    for (const value of testCase.arbitraryValues) {
      expect(isAllowedPrediction(dataset, value)).toBe(false);
    }
  });
});
