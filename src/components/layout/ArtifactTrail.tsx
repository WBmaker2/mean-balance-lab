import { isBalanced, sum } from '../../domain/math';
import type { CalculationArtifact, StageArtifacts } from '../../domain/session';
import type { CalculationTarget, ComparisonChoiceId, PredictionValue } from '../../domain/types';

interface ArtifactTrailProps {
  artifacts: StageArtifacts;
  revisions?: number | undefined;
}

const predictionText = (value: PredictionValue): string => {
  if (typeof value === 'number') return `예측: 평균 ${value}`;
  const labels: Readonly<Record<Exclude<PredictionValue, number>, string>> = {
    increase: '평균이 커집니다', decrease: '평균이 작아집니다', same: '평균이 같습니다',
  };
  return `예측: ${labels[value]}`;
};

const CALCULATION_TARGET_LABELS: Readonly<Record<CalculationTarget, string>> = {
  current: '현재 자료 계산',
  left: '자료 A 계산',
  right: '자료 B 계산',
  before: '변경 전 자료 계산',
  after: '변경 후 자료 계산',
};

const calculationText = (artifact: CalculationArtifact): string =>
  `${CALCULATION_TARGET_LABELS[artifact.target]}: ${artifact.total} ÷ ${artifact.count} = ${artifact.average}`;

const comparisonLabels: Readonly<Record<ComparisonChoiceId, string>> = {
  'same-mean': '평균이 같음',
  'different-spread': '흩어진 정도가 다름',
  'same-shape': '모양이 같음',
  'sum-changed-first': '합계가 먼저 변함',
  'mean-changed-after': '평균이 변함',
  'range-or-individual-values': '범위·각 값 살펴봄',
  'mean-always-enough': '평균만으로 충분함',
};

export const ArtifactTrail = ({ artifacts, revisions }: ArtifactTrailProps) => {
  const rows: string[] = [];
  if (artifacts.prediction) rows.push(predictionText(artifacts.prediction.value));

  const redistribution = artifacts.redistribution;
  if (redistribution
    && sum(redistribution.initialValues) === sum(redistribution.currentValues)
    && isBalanced(redistribution.currentValues)) {
    rows.push(`재배분: ${redistribution.currentValues.join(', ')}`);
  }

  Object.values(artifacts.calculations ?? {}).forEach((artifact) => {
    if (artifact?.verified) rows.push(calculationText(artifact));
  });
  if (artifacts.comparison?.verified) {
    const labels = artifacts.comparison.selectedIds.map((id) => comparisonLabels[id]).join(', ');
    rows.push(`비교: ${labels}`);
  }
  if (artifacts.evidence) rows.push(`근거: ${artifacts.evidence.sentence}`);
  if (revisions !== undefined && revisions > 0) rows.push(`수정 횟수: ${revisions}`);

  if (rows.length === 0) return null;
  return (
    <section aria-label="지금까지 남긴 자료">
      <h2>지금까지 남긴 자료</h2>
      <ul>{rows.map((row, index) => <li key={`${row}-${index}`}>{row}</li>)}</ul>
    </section>
  );
};
