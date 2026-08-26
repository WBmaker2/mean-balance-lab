import { useMemo, useState, type Dispatch } from 'react';
import { isBalanced, mean, moveOne, nextBalancingMove, sum } from '../../domain/math';
import type { ActiveRun, LabAction } from '../../domain/session';
import type { BalanceDataset } from '../../domain/types';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { ActionButton } from '../shared/ActionButton';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';
import { LiveRegion } from '../shared/LiveRegion';

export interface RedistributionPanelProps {
  dataset: BalanceDataset;
  run: ActiveRun;
  dispatch: Dispatch<LabAction>;
}

const PATTERNS = ['dots', 'stripes', 'grid', 'waves'] as const;

export const RedistributionPanel = ({ dataset, run, dispatch }: RedistributionPanelProps) => {
  const redistribution = run.artifacts.redistribution;
  const currentValues = redistribution?.currentValues ?? dataset.values;
  const initialTotal = sum(dataset.values);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; nextAction: string } | null>(null);
  const { message, announce } = useLiveAnnouncement();
  const balanced = isBalanced(currentValues);
  const recommendedMove = useMemo(() => nextBalancingMove(currentValues), [currentValues]);
  const destinationRecommendation = selectedSource === null || balanced
    ? null
    : (() => {
      const belowMean = currentValues.findIndex(
        (value, index) => value < mean(currentValues) && index !== selectedSource,
      );
      if (belowMean >= 0) return belowMean;
      // A learner may choose the only below-mean box as the source. Keep one
      // deterministic valid destination CTA available in that case.
      return currentValues.findIndex((_, index) => index !== selectedSource);
    })();
  const canUndo = (redistribution?.undoStack.length ?? 0) > 0;

  const showFeedback = (messageText: string, nextAction: string) => {
    setFeedback({ message: messageText, nextAction });
    announce(`${messageText} 다음 행동: ${nextAction}`);
  };

  const selectSource = (index: number) => {
    if (currentValues[index] === 0) {
      showFeedback('이 상자는 비어 있어 꺼낼 수 없어요.', '수량이 있는 상자의 -1 버튼을 눌러 보세요.');
      return;
    }
    setFeedback(null);
    setSelectedSource(index);
  };

  const selectDestination = (index: number) => {
    if (selectedSource === null) {
      showFeedback('먼저 꺼낼 상자를 골라 보세요.', '수량이 많은 상자의 -1 버튼을 눌러 보세요.');
      return;
    }
    if (selectedSource === index) {
      showFeedback('같은 상자에서는 옮길 수 없어요.', '다른 상자의 +1 버튼을 눌러 보세요.');
      return;
    }
    const result = moveOne(currentValues, { fromIndex: selectedSource, toIndex: index });
    if (!result.ok) {
      const nextAction = result.reason === 'source-empty'
        ? '수량이 있는 상자의 -1 버튼을 눌러 보세요.'
        : '다른 상자를 선택해 보세요.';
      showFeedback(
        result.reason === 'source-empty' ? '이 상자는 비어 있어 옮길 수 없어요.' : '상자 선택을 다시 확인해 보세요.',
        nextAction,
      );
      return;
    }
    if (sum(result.values) !== initialTotal) {
      showFeedback('전체 양이 달라져 이동을 적용하지 않았어요.', '전체 양이 그대로인지 확인해 보세요.');
      return;
    }
    dispatch({ type: 'MOVE_ONE', move: { fromIndex: selectedSource, toIndex: index } });
    announce(`${selectedSource + 1}번 상자에서 1개를 ${index + 1}번 상자로 옮겼어요. 현재 수량 ${result.values.join(', ')}. 전체는 ${initialTotal}개로 같아요.`);
    setFeedback(null);
    setSelectedSource(null);
  };

  const undo = () => {
    if (!canUndo) return;
    dispatch({ type: 'UNDO_MOVE' });
    announce(`마지막 이동을 취소했어요. 전체는 ${initialTotal}개로 같아요.`);
    setFeedback(null);
    setSelectedSource(null);
  };

  const confirmBalanced = () => {
    if (!balanced) {
      showFeedback('아직 상자 수가 같지 않아요.', '더 많은 상자에서 적은 상자로 1개를 옮겨 보세요.');
      return;
    }
    dispatch({ type: 'CONFIRM_REDISTRIBUTION' });
    announce(`고르게 나눴어요. 전체는 ${initialTotal}개로 같아요.`);
    setFeedback(null);
  };

  return (
    <section aria-labelledby="redistribution-heading">
      <h1 id="redistribution-heading">구슬을 고르게 옮겨 볼까요?</h1>
      <p>한 번에 1개만 옮기며 전체 양을 그대로 보존해 보세요.</p>
      <p aria-label="전체 합계">합계 {initialTotal}개</p>
      <div aria-label="상자 수량" className="box-grid">
        {currentValues.map((value, index) => {
          const sourceRecommended = selectedSource === null && recommendedMove?.fromIndex === index;
          const destinationRecommended = selectedSource !== null && destinationRecommendation === index;
          return (
            <article key={`${dataset.id}-${index}`} className={`box-card box-pattern-${PATTERNS[index % PATTERNS.length]}`}>
              <h2>{index + 1}번 상자</h2>
              <p aria-label={`${index + 1}번 상자 현재 수량`}>현재 수량 {value}개</p>
              <ActionButton
                type="button"
                emphasis={sourceRecommended ? 'next' : 'normal'}
                disabled={value === 0}
                onClick={() => selectSource(index)}
              >
                {index + 1}번 상자에서 1개 꺼내기
              </ActionButton>
              <ActionButton
                type="button"
                emphasis={destinationRecommended ? 'next' : 'normal'}
                onClick={() => selectDestination(index)}
              >
                {index + 1}번 상자에 1개 넣기
              </ActionButton>
            </article>
          );
        })}
      </div>
      <p>현재 수량 {currentValues.join(', ')}</p>
      {feedback ? <FeedbackPrompt {...feedback} /> : null}
      <LiveRegion message={message} />
      <ActionButton type="button" emphasis="normal" disabled={!canUndo} onClick={undo}>마지막 이동 취소</ActionButton>
      <ActionButton type="button" emphasis={balanced ? 'next' : 'normal'} onClick={confirmBalanced}>
        고르게 나누기 확인
      </ActionButton>
    </section>
  );
};
