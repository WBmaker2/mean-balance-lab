import { useEffect, useRef, useState, type Dispatch } from 'react';
import { COMPARISON_COPY } from '../../content/copy';
import { evaluateComparison, isAllowedComparisonSelection } from '../../domain/evaluation';
import { mean, range } from '../../domain/math';
import type { StageArtifacts } from '../../domain/session';
import type { EvaluationResult, ReviewDataset, TwinDataset } from '../../domain/types';
import type { OutlierDataset } from '../../domain/types';
import type { LabAction } from '../../domain/session';
import { ActionButton } from '../shared/ActionButton';
import { DotPlot } from '../shared/DotPlot';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';
import { SectionIntro } from '../shared/SectionIntro';
import { OutlierDeltaPanel, type OutlierDeltaPanelProps } from './OutlierDeltaPanel';

interface TwinComparisonPanelProps {
  dataset: TwinDataset;
  artifacts: StageArtifacts;
  dispatch: Dispatch<LabAction>;
  feedback?: EvaluationResult | null;
  onAdvance?: () => void;
}

interface OutlierComparisonPanelProps {
  dataset: OutlierDataset;
  artifacts: StageArtifacts;
  dispatch: Dispatch<LabAction>;
  feedback?: EvaluationResult | null;
  onAdvance?: () => void;
}

interface RepresentativeComparisonPanelProps {
  dataset: ReviewDataset;
  artifacts: StageArtifacts;
  dispatch: Dispatch<LabAction>;
  feedback?: EvaluationResult | null;
  onAdvance?: () => void;
}

export type ComparisonPanelProps =
  | TwinComparisonPanelProps
  | OutlierComparisonPanelProps
  | RepresentativeComparisonPanelProps;

const unique = (ids: readonly ('same-mean' | 'different-spread' | 'same-shape')[]) => [...new Set(ids)];

const TwinsComparisonPanel = ({ dataset, artifacts, dispatch, feedback = null, onAdvance }: TwinComparisonPanelProps) => {
  const rawSavedIds = artifacts.comparison?.selectedIds ?? [];
  const savedIds = isAllowedComparisonSelection(dataset, rawSavedIds) ? rawSavedIds.filter(
    (id): id is 'same-mean' | 'different-spread' | 'same-shape' =>
      id === 'same-mean' || id === 'different-spread' || id === 'same-shape',
  ) : [];
  const [selectedIds, setSelectedIds] = useState<readonly ('same-mean' | 'different-spread' | 'same-shape')[]>(
    unique(savedIds),
  );
  const [localFeedback, setLocalFeedback] = useState<EvaluationResult | null>(null);
  const plotExplanationRef = useRef<HTMLParagraphElement>(null);
  const leftMean = mean(dataset.leftValues);
  const rightMean = mean(dataset.rightValues);
  const leftRange = range(dataset.leftValues);
  const rightRange = range(dataset.rightValues);
  const savedComparisonIds = unique(savedIds);
  const verified = artifacts.comparison?.verified === true
    && evaluateComparison(dataset, savedComparisonIds).isCorrect
    && savedComparisonIds.length > 0
    && selectedIds.length === savedComparisonIds.length
    && selectedIds.every((id) => savedComparisonIds.includes(id));
  const shownFeedback = verified
    ? (feedback ?? localFeedback ?? {
    isCorrect: true,
    message: COMPARISON_COPY.twinsSuccessMessage,
    nextAction: COMPARISON_COPY.evidenceNextAction,
  })
    : localFeedback;

  useEffect(() => {
    if (shownFeedback?.message === COMPARISON_COPY.twinsShapeMessage) {
      plotExplanationRef.current?.focus();
    }
  }, [shownFeedback]);

  const toggle = (id: 'same-mean' | 'different-spread' | 'same-shape') => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : unique([...current, id]));
    setLocalFeedback(null);
  };

  const submit = () => {
    const normalized = unique(selectedIds);
    const result = evaluateComparison(dataset, normalized);
    setLocalFeedback(result);
    dispatch({ type: 'SET_COMPARISON', selectedIds: normalized });
  };

  return (
    <section className="stage-panel stage-panel-compare" data-stage="compare" aria-labelledby="comparison-heading">
      <SectionIntro
        id="comparison-heading"
        title="평균 쌍둥이 자료를 비교해 볼까요?"
        description="계산 결과를 먼저 보고 점도표의 모양을 살펴보세요."
        tone="blue"
      />

      <section className="concept-summary" aria-label="두 자료의 계산 결과">
        <h2>계산 결과</h2>
        <p>자료 A 평균 {leftMean}, 자료 B 평균 {rightMean} / 자료 A 범위 {leftRange}, 자료 B 범위 {rightRange}</p>
      </section>

      <div className="comparison-plots" aria-label="두 자료 점도표">
        <section aria-labelledby="plot-a-heading">
          <h2 id="plot-a-heading">자료 A</h2>
          <DotPlot values={dataset.leftValues} label="자료 A" />
        </section>
        <section aria-labelledby="plot-b-heading">
          <h2 id="plot-b-heading">자료 B</h2>
          <DotPlot values={dataset.rightValues} label="자료 B" />
        </section>
      </div>

      <p className="plot-explanation" ref={plotExplanationRef} tabIndex={-1} role="note" aria-label="점도표 설명">
        점도표에서 같은 값이 모인 정도와 가장 작은 값부터 큰 값까지의 흩어진 정도를 비교해 보세요.
      </p>

      <fieldset>
        <legend>두 자료를 비교한 근거를 골라 보세요.</legend>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('same-mean')}
            onChange={() => toggle('same-mean')}
          />
          두 자료의 평균은 모두 {leftMean}예요.
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('different-spread')}
            onChange={() => toggle('different-spread')}
          />
          자료 B가 자료 A보다 더 흩어져 있어요.
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('same-shape')}
            onChange={() => toggle('same-shape')}
          />
          두 자료의 모양은 같아요.
        </label>
      </fieldset>

      {shownFeedback ? <FeedbackPrompt {...shownFeedback} /> : null}
      <div className="action-group">
        {verified ? (
          <ActionButton type="button" emphasis="next" onClick={onAdvance ?? (() => plotExplanationRef.current?.focus())}>
            다음 단계
          </ActionButton>
        ) : (
          <ActionButton type="button" emphasis="next" onClick={submit}>
            비교 확인
          </ActionButton>
        )}
      </div>
    </section>
  );
};

const RepresentativeComparisonPanel = ({
  dataset, artifacts, dispatch, feedback = null, onAdvance,
}: RepresentativeComparisonPanelProps) => {
  const rawSavedIds = artifacts.comparison?.selectedIds ?? [];
  const savedIds = isAllowedComparisonSelection(dataset, rawSavedIds)
    ? rawSavedIds.filter((id): id is 'range-or-individual-values' | 'mean-always-enough' =>
      id === 'range-or-individual-values' || id === 'mean-always-enough')
    : [];
  const [selectedIds, setSelectedIds] = useState<readonly ('range-or-individual-values' | 'mean-always-enough')[]>(savedIds);
  const [localFeedback, setLocalFeedback] = useState<EvaluationResult | null>(null);
  const verified = artifacts.comparison?.verified === true
    && evaluateComparison(dataset, savedIds).isCorrect
    && selectedIds.length === savedIds.length
    && selectedIds.every((id) => savedIds.includes(id));
  const shownFeedback = verified
    ? (feedback ?? localFeedback ?? {
      isCorrect: true,
      message: COMPARISON_COPY.representativeSuccessMessage,
      nextAction: COMPARISON_COPY.evidenceNextAction,
    })
    : localFeedback;
  const currentSelection = selectedIds[0];

  const submit = () => {
    const normalized = [...new Set(selectedIds)];
    const result = evaluateComparison(dataset, normalized);
    setLocalFeedback(result);
    dispatch({ type: 'SET_COMPARISON', selectedIds: normalized });
  };

  return (
    <section className="stage-panel stage-panel-compare" data-stage="compare" aria-labelledby="representative-comparison-heading">
      <SectionIntro
        id="representative-comparison-heading"
        title="평균과 자료의 모습을 비교해 볼까요?"
        description="평균과 범위, 각 값을 함께 살펴보고 평균만으로 충분한지 판단해 보세요."
        tone="green"
      />
      <section className="concept-summary" aria-label="대표값 비교 결과">
        <h2>계산 결과</h2>
        <p>평균 {mean(dataset.values)} / 범위 {range(dataset.values)}</p>
        <p>각 값: {dataset.values.join(', ')}</p>
      </section>
      <section className="representative-plot" aria-labelledby="representative-plot-heading">
        <h2 id="representative-plot-heading">자료 모양</h2>
        <DotPlot values={dataset.values} label="대표값 자료" />
      </section>
      <fieldset>
        <legend>평균만으로 자료를 설명할 수 있을까요?</legend>
        <label>
          <input
            type="radio"
            name="representative-comparison-choice"
            checked={currentSelection === 'range-or-individual-values'}
            onChange={() => { setSelectedIds(['range-or-individual-values']); setLocalFeedback(null); }}
          />
          범위나 각 값을 함께 살펴봐야 해요.
        </label>
        <label>
          <input
            type="radio"
            name="representative-comparison-choice"
            checked={currentSelection === 'mean-always-enough'}
            onChange={() => { setSelectedIds(['mean-always-enough']); setLocalFeedback(null); }}
          />
          평균만으로 모든 자료를 판단할 수 있어요.
        </label>
      </fieldset>
      {shownFeedback ? <FeedbackPrompt {...shownFeedback} /> : null}
      <div className="action-group">
        {verified ? (
          <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음 단계</ActionButton>
        ) : (
          <ActionButton type="button" emphasis="next" onClick={submit}>비교 확인</ActionButton>
        )}
      </div>
    </section>
  );
};

export const ComparisonPanel = (props: ComparisonPanelProps) => {
  if (props.dataset.kind === 'outlier') {
    const comparison = props.artifacts.comparison;
    const verified = comparison?.verified === true
      && evaluateComparison(props.dataset, comparison.selectedIds).isCorrect;
    const outlierProps: OutlierDeltaPanelProps = {
      dataset: props.dataset,
      prediction: props.artifacts.prediction,
      verified,
      onConfirm: () => props.dispatch({
        type: 'SET_COMPARISON',
        selectedIds: ['sum-changed-first', 'mean-changed-after'],
      }),
      ...(props.onAdvance ? { onAdvance: props.onAdvance } : {}),
    };
    return (
      <OutlierDeltaPanel
        {...outlierProps}
      />
    );
  }
  if (props.dataset.kind === 'representativeness') {
    const representativeProps: RepresentativeComparisonPanelProps = {
      dataset: props.dataset,
      artifacts: props.artifacts,
      dispatch: props.dispatch,
      ...(props.feedback !== undefined ? { feedback: props.feedback } : {}),
      ...(props.onAdvance !== undefined ? { onAdvance: props.onAdvance } : {}),
    };
    return <RepresentativeComparisonPanel {...representativeProps} />;
  }
  const twinProps: TwinComparisonPanelProps = {
    dataset: props.dataset,
    artifacts: props.artifacts,
    dispatch: props.dispatch,
    ...(props.feedback !== undefined ? { feedback: props.feedback } : {}),
    ...(props.onAdvance !== undefined ? { onAdvance: props.onAdvance } : {}),
  };
  return <TwinsComparisonPanel {...twinProps} />;
};
