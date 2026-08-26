import { useEffect, useRef, useState, type Dispatch } from 'react';
import { COMPARISON_COPY } from '../../content/copy';
import { evaluateComparison, isAllowedComparisonSelection } from '../../domain/evaluation';
import { mean, range } from '../../domain/math';
import type { StageArtifacts } from '../../domain/session';
import type { EvaluationResult, TwinDataset } from '../../domain/types';
import type { OutlierDataset } from '../../domain/types';
import type { LabAction } from '../../domain/session';
import { ActionButton } from '../shared/ActionButton';
import { DotPlot } from '../shared/DotPlot';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';
import { OutlierDeltaPanel } from './OutlierDeltaPanel';

interface TwinComparisonPanelProps {
  dataset: TwinDataset;
  artifacts: StageArtifacts;
  dispatch: Dispatch<LabAction>;
  feedback?: EvaluationResult | null;
}

interface OutlierComparisonPanelProps {
  dataset: OutlierDataset;
  artifacts: StageArtifacts;
  dispatch: Dispatch<LabAction>;
  feedback?: EvaluationResult | null;
}

export type ComparisonPanelProps = TwinComparisonPanelProps | OutlierComparisonPanelProps;

const unique = (ids: readonly ('same-mean' | 'different-spread' | 'same-shape')[]) => [...new Set(ids)];

const TwinsComparisonPanel = ({ dataset, artifacts, dispatch, feedback = null }: TwinComparisonPanelProps) => {
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
    <section aria-labelledby="comparison-heading">
      <h1 id="comparison-heading">평균 쌍둥이 자료를 비교해 볼까요?</h1>
      <p>계산 결과를 먼저 보고 점도표의 모양을 살펴보세요.</p>

      <section aria-label="두 자료의 계산 결과">
        <h2>계산 결과</h2>
        <p>평균 {leftMean}·{rightMean} / 범위 {leftRange}·{rightRange}</p>
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

      <p ref={plotExplanationRef} tabIndex={-1} role="note" aria-label="점도표 설명">
        점도표에서 같은 값이 모인 정도와 가장 작은 값부터 큰 값까지의 퍼짐을 비교해 보세요.
      </p>

      <fieldset>
        <legend>두 자료를 비교한 근거를 골라 보세요.</legend>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('same-mean')}
            onChange={() => toggle('same-mean')}
          />
          두 자료의 평균은 모두 {leftMean}입니다.
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('different-spread')}
            onChange={() => toggle('different-spread')}
          />
          자료 B가 자료 A보다 더 퍼져 있습니다.
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedIds.includes('same-shape')}
            onChange={() => toggle('same-shape')}
          />
          두 자료의 모양은 같습니다.
        </label>
      </fieldset>

      {shownFeedback ? <FeedbackPrompt {...shownFeedback} /> : null}
      {verified ? (
        <ActionButton type="button" emphasis="next" onClick={() => plotExplanationRef.current?.focus()}>
          비교 완료
        </ActionButton>
      ) : (
        <ActionButton type="button" emphasis="next" onClick={submit}>
          비교 확인
        </ActionButton>
      )}
    </section>
  );
};

export const ComparisonPanel = (props: ComparisonPanelProps) => {
  if (props.dataset.kind === 'outlier') {
    return (
      <OutlierDeltaPanel
        dataset={props.dataset}
        prediction={props.artifacts.prediction}
        onConfirm={() => props.dispatch({
          type: 'SET_COMPARISON',
          selectedIds: ['sum-changed-first', 'mean-changed-after'],
        })}
      />
    );
  }
  const twinProps: TwinComparisonPanelProps = {
    dataset: props.dataset,
    artifacts: props.artifacts,
    dispatch: props.dispatch,
    ...(props.feedback !== undefined ? { feedback: props.feedback } : {}),
  };
  return <TwinsComparisonPanel {...twinProps} />;
};
