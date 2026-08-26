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
