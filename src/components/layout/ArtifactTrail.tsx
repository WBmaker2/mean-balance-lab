import { isBalanced, sum } from '../../domain/math';
import type { CalculationArtifact, StageArtifacts } from '../../domain/session';
import type { CalculationTarget, ComparisonChoiceId, PredictionValue } from '../../domain/types';

interface ArtifactTrailProps {
  artifacts: StageArtifacts;
  revisions?: number | undefined;
}

interface ArtifactRow {
  kind: 'prediction' | 'redistribution' | 'calculation' | 'comparison' | 'evidence' | 'revision';
  text: string;
  description: string;
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
  const rows: ArtifactRow[] = [];
  if (artifacts.prediction) rows.push({ kind: 'prediction', text: predictionText(artifacts.prediction.value), description: '처음에 생각한 평균이에요.' });

  const redistribution = artifacts.redistribution;
  if (redistribution
    && sum(redistribution.initialValues) === sum(redistribution.currentValues)
    && isBalanced(redistribution.currentValues)) {
    rows.push({ kind: 'redistribution', text: `재배분: ${redistribution.currentValues.join(', ')}`, description: '전체 양을 지키며 고르게 나눈 결과예요.' });
  }

  Object.values(artifacts.calculations ?? {}).forEach((artifact) => {
    if (artifact?.verified) rows.push({ kind: 'calculation', text: calculationText(artifact), description: '확인한 평균 계산이에요.' });
  });
  if (artifacts.comparison?.verified) {
    const labels = artifacts.comparison.selectedIds.map((id) => comparisonLabels[id]).join(', ');
    rows.push({ kind: 'comparison', text: `비교: ${labels}`, description: '자료를 비교한 근거예요.' });
  }
  if (artifacts.evidence) rows.push({ kind: 'evidence', text: `근거: ${artifacts.evidence.sentence}`, description: '완성한 근거 문장이에요.' });
  if (revisions !== undefined && revisions > 0) rows.push({ kind: 'revision', text: `수정 횟수: ${revisions}`, description: '다시 생각한 횟수예요.' });

  if (rows.length === 0) return null;
  return (
    <section className="artifact-trail notebook-evidence" aria-label="지금까지 남긴 자료">
      <h2>지금까지 남긴 자료</h2>
      <ul>
        {rows.map((row, index) => (
          <li key={`${row.kind}-${row.text}-${index}`} data-artifact-kind={row.kind}>
            <span className="artifact-row-text">{row.text}</span>
            <span className="artifact-row-description">{row.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
