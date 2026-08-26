export const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const mean = (values: readonly number[]): number => {
  if (values.length === 0) throw new Error('Mean requires at least one value');
  return sum(values) / values.length;
};

export const range = (values: readonly number[]): number => {
  if (values.length === 0) throw new Error('Range requires at least one value');
  return Math.max(...values) - Math.min(...values);
};

export interface QuantityMove {
  fromIndex: number;
  toIndex: number;
}

export type MoveFailureReason = 'same-box' | 'source-empty' | 'out-of-range';

export type MoveResult =
  | { ok: true; values: readonly number[]; moved: 1 }
  | { ok: false; values: readonly number[]; reason: MoveFailureReason };

export interface DeltaSummary {
  sumBefore: number;
  sumAfter: number;
  sumDelta: number;
  meanBefore: number;
  meanAfter: number;
  meanDelta: number;
}

export interface DotFrequency {
  value: number;
  count: number;
}

export const isBalanced = (values: readonly number[]): boolean =>
  values.length > 0 && values.every((value) => value === values[0]);

export const nextBalancingMove = (values: readonly number[]): QuantityMove | null => {
  if (values.length === 0 || !Number.isInteger(mean(values))) return null;
  const target = mean(values);
  const fromIndex = values.findIndex((value) => value > target);
  const toIndex = values.findIndex((value) => value < target);
  return fromIndex >= 0 && toIndex >= 0 ? { fromIndex, toIndex } : null;
};

export function moveOne(values: readonly number[], move: QuantityMove): MoveResult {
  const { fromIndex, toIndex } = move;
  if (!values.every((value) => Number.isFinite(value) && Number.isInteger(value) && value >= 0)) {
    return { ok: false, values, reason: 'out-of-range' };
  }
  const source = values[fromIndex];
  const destination = values[toIndex];
  if (source === undefined || destination === undefined) {
    return { ok: false, values, reason: 'out-of-range' };
  }
  if (fromIndex === toIndex) return { ok: false, values, reason: 'same-box' };
  if (source === 0) return { ok: false, values, reason: 'source-empty' };
  const next = [...values];
  next[fromIndex] = source - 1;
  next[toIndex] = destination + 1;
  return { ok: true, values: next, moved: 1 };
}

export const describeDelta = (
  before: readonly number[],
  after: readonly number[],
): DeltaSummary => {
  if (before.length === 0 || before.length !== after.length) {
    throw new Error('Delta requires equal non-empty datasets');
  }
  const sumBefore = sum(before);
  const sumAfter = sum(after);
  const meanBefore = mean(before);
  const meanAfter = mean(after);
  return {
    sumBefore,
    sumAfter,
    sumDelta: sumAfter - sumBefore,
    meanBefore,
    meanAfter,
    meanDelta: meanAfter - meanBefore,
  };
};

export const dotFrequencies = (values: readonly number[]): DotFrequency[] => {
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([value, count]) => ({ value, count }));
};
