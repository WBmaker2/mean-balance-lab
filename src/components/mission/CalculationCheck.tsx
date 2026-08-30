import { useEffect, useRef, useState, type FormEvent } from 'react';
import { mean, sum } from '../../domain/math';
import { CALCULATION_COPY } from '../../content/copy';
import type { CalculationInput } from '../../domain/evaluation';
import type { CalculationTarget, EvaluationResult } from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';

export interface CalculationCheckProps {
  target: CalculationTarget;
  values: readonly number[];
  onSubmit: (target: CalculationTarget, input: CalculationInput) => void;
  feedback: EvaluationResult | null;
  onAdvance?: () => void;
  showNextAction?: boolean;
  isActive?: boolean;
}

type CalculationField = 'total' | 'count' | 'mean';

const targetLabel: Record<CalculationTarget, string> = {
  current: '현재 자료',
  left: '자료 A',
  right: '자료 B',
  before: '변경 전 자료',
  after: '변경 후 자료',
};

export const CalculationCheck = ({
  target, values, onSubmit, feedback, onAdvance, showNextAction = true, isActive = true,
}: CalculationCheckProps) => {
  const [enteredTotal, setEnteredTotal] = useState('');
  const [enteredCount, setEnteredCount] = useState('');
  const [enteredMean, setEnteredMean] = useState('');
  const [firstIncorrect, setFirstIncorrect] = useState<CalculationField | null>(null);
  const [localFeedback, setLocalFeedback] = useState<EvaluationResult | null>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLInputElement>(null);
  const meanRef = useRef<HTMLInputElement>(null);

  const focusField = (field: CalculationField) => {
    const refs = { total: totalRef, count: countRef, mean: meanRef };
    refs[field].current?.focus();
  };

  useEffect(() => {
    const shownFeedback = feedback ?? localFeedback;
    if (shownFeedback && !shownFeedback.isCorrect && firstIncorrect) focusField(firstIncorrect);
  }, [feedback, firstIncorrect, localFeedback]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const blankFeedback: Record<CalculationField, EvaluationResult> = {
      total: { isCorrect: false, message: CALCULATION_COPY.emptyTotalMessage, nextAction: CALCULATION_COPY.emptyTotalNextAction },
      count: { isCorrect: false, message: CALCULATION_COPY.emptyCountMessage, nextAction: CALCULATION_COPY.emptyCountNextAction },
      mean: { isCorrect: false, message: CALCULATION_COPY.emptyMeanMessage, nextAction: CALCULATION_COPY.emptyMeanNextAction },
    };
    const firstBlank: CalculationField | null = enteredTotal === '' ? 'total'
      : enteredCount === '' ? 'count'
        : enteredMean === '' ? 'mean' : null;
    if (firstBlank) {
      setFirstIncorrect(firstBlank);
      setLocalFeedback(blankFeedback[firstBlank]);
      focusField(firstBlank);
      return;
    }
    const input: CalculationInput = {
      values: [...values],
      enteredTotal: Number(enteredTotal),
      enteredCount: Number(enteredCount),
      enteredMean: Number(enteredMean),
    };
    let incorrectField: CalculationField | null = null;
    if (input.enteredTotal !== sum(values)) incorrectField = 'total';
    else if (input.enteredCount !== values.length) incorrectField = 'count';
    else if (input.enteredMean !== mean(values)) incorrectField = 'mean';
    if (incorrectField) {
      setFirstIncorrect(incorrectField);
      focusField(incorrectField);
    } else {
      setFirstIncorrect(null);
    }
    setLocalFeedback(null);
    onSubmit(target, input);
  };

  const shownFeedback = feedback ?? localFeedback;
  const isSuccess = shownFeedback?.isCorrect === true;
  const buttonLabel = shownFeedback && !isSuccess ? '계산 다시 확인' : '계산 확인';
  const hintIds = {
    total: `calculation-total-hint-${target}`,
    count: `calculation-count-hint-${target}`,
    mean: `calculation-mean-hint-${target}`,
  };

  return (
    <section className={`stage-panel calculation-panel calculation-panel-${target}`} data-stage-subpanel="calculate" aria-labelledby={`calculation-heading-${target}`}>
      <h2 id={`calculation-heading-${target}`}>{targetLabel[target]}의 평균을 계산해 볼까요?</h2>
      <p className="calculation-instruction">이 자료를 보고 합계, 자료 개수, 평균을 차례로 적어 보세요.</p>
      <p className="calculation-source" aria-label={`${targetLabel[target]}의 값`}>자료: {values.join(', ')}</p>
      {isSuccess ? (
        <>
          <p className="feedback-success" role="status">{shownFeedback?.message}</p>
          <p className="calculation-equation" aria-label="평균 계산 방정식">{sum(values)} ÷ {values.length} = {mean(values)}</p>
          {showNextAction ? (
            <div className="action-group">
              <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음 단계</ActionButton>
            </div>
          ) : null}
        </>
      ) : (
        <form className="calculation-form" onSubmit={submit} noValidate>
          <div className="calculation-fields">
            <label htmlFor={`calculation-total-${target}`}>합계</label>
            <input
              ref={totalRef}
              id={`calculation-total-${target}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              aria-describedby={hintIds.total}
              aria-invalid={firstIncorrect === 'total' ? 'true' : undefined}
              disabled={!isActive}
              value={enteredTotal}
              onChange={(event) => setEnteredTotal(event.target.value)}
            />
            <span id={hintIds.total} className="sr-only">0 이상의 자연수를 입력하세요.</span>
            <label htmlFor={`calculation-count-${target}`}>자료 개수</label>
            <input
              ref={countRef}
              id={`calculation-count-${target}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              aria-describedby={hintIds.count}
              aria-invalid={firstIncorrect === 'count' ? 'true' : undefined}
              disabled={!isActive}
              value={enteredCount}
              onChange={(event) => setEnteredCount(event.target.value)}
            />
            <span id={hintIds.count} className="sr-only">0 이상의 자연수를 입력하세요.</span>
            <label htmlFor={`calculation-mean-${target}`}>평균</label>
            <input
              ref={meanRef}
              id={`calculation-mean-${target}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              aria-describedby={hintIds.mean}
              aria-invalid={firstIncorrect === 'mean' ? 'true' : undefined}
              disabled={!isActive}
              value={enteredMean}
              onChange={(event) => setEnteredMean(event.target.value)}
            />
            <span id={hintIds.mean} className="sr-only">0 이상의 자연수를 입력하세요.</span>
          </div>
          {shownFeedback && !isSuccess ? <FeedbackPrompt {...shownFeedback} /> : null}
          <div className="action-group">
            <ActionButton type="submit" emphasis={isActive ? 'next' : 'normal'} disabled={!isActive}>{buttonLabel}</ActionButton>
          </div>
        </form>
      )}
    </section>
  );
};
