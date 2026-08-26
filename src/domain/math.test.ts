import { describe, expect, it } from 'vitest';
import {
  describeDelta,
  dotFrequencies,
  isBalanced,
  moveOne,
  nextBalancingMove,
  sum,
} from './math';

describe('mean balance rules', () => {
  it('moves exactly one item and preserves total and length', () => {
    const before = [2, 4, 6, 8];
    const result = moveOne(before, { fromIndex: 3, toIndex: 0 });
    expect(result).toEqual({ ok: true, values: [3, 4, 6, 7], moved: 1 });
    if (result.ok) {
      expect(sum(result.values)).toBe(sum(before));
      expect(result.values).toHaveLength(before.length);
    }
    expect(before).toEqual([2, 4, 6, 8]);
  });

  it.each([
    [{ fromIndex: 0, toIndex: 0 }, 'same-box'],
    [{ fromIndex: 0, toIndex: 1 }, 'source-empty'],
    [{ fromIndex: -1, toIndex: 1 }, 'out-of-range'],
  ] as const)('rejects invalid move %o', (move, reason) => {
    expect(moveOne([0, 5], move)).toEqual({ ok: false, values: [0, 5], reason });
  });

  it('summarizes sum change before mean change', () => {
    expect(describeDelta([4, 5, 5, 6], [4, 5, 5, 10])).toEqual({
      sumBefore: 20, sumAfter: 24, sumDelta: 4,
      meanBefore: 5, meanAfter: 6, meanDelta: 1,
    });
  });

  it.each([
    [[], [1], 'Delta requires equal non-empty datasets'],
    [[1], [1, 2], 'Delta requires equal non-empty datasets'],
  ] as const)('rejects invalid delta datasets', (before, after, message) => {
    expect(() => describeDelta(before, after)).toThrow(message);
  });

  it('chooses one deterministic recommended move toward the mean', () => {
    expect(nextBalancingMove([2, 4, 6, 8])).toEqual({ fromIndex: 2, toIndex: 0 });
    expect(nextBalancingMove([5, 5, 5, 5])).toBeNull();
  });

  it('identifies only non-empty uniform datasets as balanced', () => {
    expect(isBalanced([5, 5])).toBe(true);
    expect(isBalanced([])).toBe(false);
    expect(isBalanced([5, 6])).toBe(false);
  });

  it('builds sorted read-only dot frequencies', () => {
    const values = [4, 1, 4, 3];
    expect(dotFrequencies(values)).toEqual([
      { value: 1, count: 1 }, { value: 3, count: 1 }, { value: 4, count: 2 },
    ]);
    expect(values).toEqual([4, 1, 4, 3]);
  });
});
