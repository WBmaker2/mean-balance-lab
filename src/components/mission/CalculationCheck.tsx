import { useEffect, useRef, useState, type FormEvent } from 'react';
import { mean, sum } from '../../domain/math';
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
  const [firstIncorrect, setFirstIncorrect] = useState<CalculationField>('total');
  const totalRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLInputElement>(null);
  const meanRef = useRef<HTMLInputElement>(null);

  const focusField = (field: CalculationField) => {
    const refs = { total: totalRef, count: countRef, mean: meanRef };
    refs[field].current?.focus();
  };

  useEffect(() => {
    if (feedback && !feedback.isCorrect) focusField(firstIncorrect);
  }, [feedback, firstIncorrect]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    }
    onSubmit(target, input);
  };

  const isSuccess = feedback?.isCorrect === true;
  const buttonLabel = feedback && !isSuccess ? '계산 다시 확인' : '계산 확인';

  return (
    <section aria-labelledby={`calculation-heading-${target}`}>
      <h2 id={`calculation-heading-${target}`}>{targetLabel[target]}의 평균을 계산해 볼까요?</h2>
      {isSuccess ? (
        <>
          <p role="status">{feedback.message}</p>
          <p aria-label="평균 계산 방정식">{sum(values)} ÷ {values.length} = {mean(values)}</p>
          {showNextAction ? <ActionButton type="button" emphasis="next" onClick={onAdvance}>다음 단계</ActionButton> : null}
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor={`calculation-total-${target}`}>합계</label>
          <input
            ref={totalRef}
            id={`calculation-total-${target}`}
            type="number"
            inputMode="numeric"
            min="0"
            disabled={!isActive}
            value={enteredTotal}
            onChange={(event) => setEnteredTotal(event.target.value)}
          />
          <label htmlFor={`calculation-count-${target}`}>자료 개수</label>
          <input
            ref={countRef}
            id={`calculation-count-${target}`}
            type="number"
            inputMode="numeric"
            min="0"
            disabled={!isActive}
            value={enteredCount}
            onChange={(event) => setEnteredCount(event.target.value)}
          />
          <label htmlFor={`calculation-mean-${target}`}>평균</label>
          <input
            ref={meanRef}
            id={`calculation-mean-${target}`}
            type="number"
            inputMode="numeric"
            min="0"
            disabled={!isActive}
            value={enteredMean}
            onChange={(event) => setEnteredMean(event.target.value)}
          />
          {feedback && !isSuccess ? <FeedbackPrompt {...feedback} /> : null}
          <ActionButton type="submit" emphasis={isActive ? 'next' : 'normal'} disabled={!isActive}>{buttonLabel}</ActionButton>
        </form>
      )}
    </section>
  );
};
