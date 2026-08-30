import { useMemo, useState, type Dispatch } from 'react';
import { isBalanced, mean, moveOne, nextBalancingMove, sum } from '../../domain/math';
import type { ActiveRun, LabAction } from '../../domain/session';
import type { BalanceDataset } from '../../domain/types';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { ActionButton } from '../shared/ActionButton';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';
import { LiveRegion } from '../shared/LiveRegion';
import { SectionIntro } from '../shared/SectionIntro';
import { BalanceIllustration } from './BalanceIllustration';

export interface RedistributionPanelProps {
  dataset: BalanceDataset;
  run: ActiveRun;
  dispatch: Dispatch<LabAction>;
  onAdvance: () => void;
}

const PATTERNS = ['dots', 'stripes', 'grid', 'waves'] as const;

export const RedistributionPanel = ({ dataset, run, dispatch, onAdvance }: RedistributionPanelProps) => {
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
    announce('');
  };

  const selectSource = (index: number) => {
    if (currentValues[index] === 0) {
      showFeedback('이 상자는 비어 있어 꺼낼 수 없어요.', '수량이 있는 상자의 -1 버튼을 눌러 보세요.');
      return;
    }
    setFeedback(null);
    announce('');
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
    onAdvance();
  };

  return (
    <section className="stage-panel stage-panel-redistribute" data-stage="redistribute" aria-label="재배분 활동">
      <SectionIntro
        id="redistribution-heading"
        title="구슬을 고르게 옮겨 볼까요?"
        description="한 번에 1개만 옮기며 전체 양을 그대로 보존해 보세요."
        tone="green"
      />
      <p className="total-badge" aria-label="전체 합계">합계 {initialTotal}개</p>
      <BalanceIllustration
        initialValues={dataset.values}
        currentValues={currentValues}
        meanValue={mean(currentValues)}
        balanced={balanced}
      />
      <div className="redistribution-board">
        <section className="redistribution-original" aria-labelledby="redistribution-original-heading">
          <h2 id="redistribution-original-heading">처음 자료</h2>
          <ol className="tray-values" aria-label="처음 상자 수량">
            {dataset.values.map((value, index) => <li key={`${dataset.id}-original-${index}`}><span>{index + 1}번</span><strong>{value}</strong></li>)}
          </ol>
          <p>전체 양 {initialTotal}개를 그대로 지켜요.</p>
        </section>
        <div className="redistribution-connector" aria-hidden="true"><span>1개씩 옮기기</span></div>
        <section className="redistribution-current" aria-labelledby="redistribution-current-heading">
          <h2 id="redistribution-current-heading">현재 작업대</h2>
          <p className="redistribution-instruction">먼저 꺼낼 상자를 골라요. 다음으로 넣을 상자를 골라요.</p>
          {selectedSource !== null ? (
            <p className="selected-source" aria-live="polite">선택한 상자: {selectedSource + 1}번</p>
          ) : null}
          <div className="box-grid" aria-label="상자 수량">
            {currentValues.map((value, index) => {
              const sourceRecommended = selectedSource === null && recommendedMove?.fromIndex === index;
              const destinationRecommended = selectedSource !== null && destinationRecommendation === index;
              return (
                <article
                  key={`${dataset.id}-${index}`}
                  className={`box-card box-pattern-${PATTERNS[index % PATTERNS.length]}`}
                  data-selected={selectedSource === index ? 'true' : undefined}
                >
                  <h2>{index + 1}번 상자</h2>
                  <p aria-label={`${index + 1}번 상자 현재 수량`}>현재 수량 {value}개</p>
                  <ActionButton
                    type="button"
                    emphasis={sourceRecommended ? 'next' : 'normal'}
                    disabled={value === 0}
                    aria-label={`${index + 1}번 상자에서 1개 꺼내기`}
                    aria-pressed={selectedSource === index}
                    onClick={() => selectSource(index)}
                  >
                    1개 꺼내기
                  </ActionButton>
                  <ActionButton
                    type="button"
                    emphasis={destinationRecommended ? 'next' : 'normal'}
                    aria-label={`${index + 1}번 상자에 1개 넣기`}
                    onClick={() => selectDestination(index)}
                  >
                    1개 넣기
                  </ActionButton>
                </article>
              );
            })}
          </div>
          <p className="current-values" aria-label="현재 상자 수량">현재 수량 {currentValues.join(', ')}</p>
        </section>
      </div>
      <p className="mean-equation-hint" aria-label="평균 계산 힌트">
        <span>평균</span>
        <strong>{initialTotal}</strong>
        <span>÷ {dataset.values.length}</span>
        <span>=</span>
        <strong>{balanced ? mean(currentValues) : '?'}</strong>
      </p>
      {feedback ? <FeedbackPrompt {...feedback} /> : null}
      <LiveRegion message={message} />
      <div className="action-group action-group-secondary action-surface">
        <ActionButton type="button" emphasis="normal" disabled={!canUndo} onClick={undo}>마지막 이동 취소</ActionButton>
        <ActionButton type="button" emphasis={balanced ? 'next' : 'normal'} onClick={confirmBalanced}>
          고르게 나누기 확인
        </ActionButton>
      </div>
    </section>
  );
};
