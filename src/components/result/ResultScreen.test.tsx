import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, renderAppAt, sessionWithThreeRequiredMissions, completedBalanceStateWithTwoRetries } from '../../test/fixtures';
import { createInitialSession } from '../../domain/session';
import { ResultScreen } from './ResultScreen';

describe('ResultScreen', () => {
  afterEach(cleanup);

  it('locks final results until all four required canonical attempts exist', async () => {
    renderAppAt('#/results', sessionWithThreeRequiredMissions());
    expect(await screen.findByText('전체 결과를 보려면 4. 평균만으로 괜찮을까요? 미션을 끝내야 해요.')).toBeVisible();
    expect(document.querySelector('section.locked-result')).toHaveClass('worksheet-page');
    expect(screen.queryByRole('button', { name: '교사용 요약 인쇄' })).not.toBeInTheDocument();
  });

  it('does not unlock from forged completion mission IDs alone', async () => {
    const state = { ...sessionWithThreeRequiredMissions(), completedRequiredMissions: [
      'balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review',
    ] as const };
    renderAppAt('#/results', state);
    expect(await screen.findByText('전체 결과를 보려면 4. 평균만으로 괜찮을까요? 미션을 끝내야 해요.')).toBeVisible();
  });

  it('shows each card in evidence, revisions, level, actions order without aggregate scoring', async () => {
    renderAppAt('#/results', completedSession());
    expect(await screen.findByRole('heading', { name: '전체 결과' })).toBeVisible();
    expect(document.querySelector('section.full-result')).toHaveClass('worksheet-page');
    const cards = screen.getAllByRole('region').filter((region) => region.classList.contains('mission-summary'));
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      const cardHeading = card.querySelector('h3');
      expect(cardHeading).not.toBeNull();
      expect(card.getAttribute('aria-labelledby')).toBe(cardHeading?.id);
      expect(cardHeading?.id).toBeTruthy();
      const evidence = within(card).getByRole('heading', { name: '내가 사용한 근거' });
      const revisions = within(card).getByRole('heading', { name: '고쳐 생각한 과정' });
      const level = within(card).getByRole('heading', { name: '근거 단계' });
      expect(evidence.tagName).toBe('H4');
      expect(revisions.tagName).toBe('H4');
      expect(level.tagName).toBe('H4');
      [evidence, revisions, level].forEach((heading) => {
        expect(heading.id).toBeTruthy();
        expect(card.querySelector(`#${heading.id}`)).toBe(heading);
        expect(new Set([evidence.id, revisions.id, level.id]).size).toBe(3);
      });
      const actions = within(card).getByRole('navigation');
      expect(evidence.compareDocumentPosition(revisions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(revisions.compareDocumentPosition(level) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(level.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    const allIds = Array.from(document.querySelectorAll('[id]'), (element) => element.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(screen.queryByText(/총점|순위|백분율|학급 비교/)).not.toBeInTheDocument();
  });

  it('edits a canonical attempt in place without increasing revisions', async () => {
    renderAppAt('#/results', completedSession());
    const user = userEvent.setup();
    const card = screen.getAllByRole('region').find((region) => region.classList.contains('mission-summary'))!;
    await user.click(within(card).getByRole('button', { name: '근거 수정' }));
    await user.click(within(card).getByRole('radio', { name: /자료를 고르게 옮긴 결과를 확인/ }));
    await user.click(within(card).getByRole('radio', { name: /고르게 옮긴 결과와 합계/ }));
    await user.click(within(card).getByRole('button', { name: '근거 문장 완성' }));
    expect(within(card).getByText('고르게 옮긴 결과, 전체 양은 20이고 자료 4개로 나누면 평균은 5예요.')).toBeVisible();
    expect(within(card).getByText('수정 기록 0회')).toBeVisible();
  });

  it('keeps editor headings nested under the result card with unique labelled regions', async () => {
    renderAppAt('#/results', completedSession());
    const user = userEvent.setup();
    const cards = screen.getAllByRole('region').filter((region) => region.classList.contains('mission-summary'));
    const card = cards[0]!;
    const cardHeading = within(card).getByRole('heading', { name: '1. 골고루 나누기 결과' });

    await user.click(within(card).getByRole('button', { name: '근거 수정' }));

    const editorHeading = within(card).getByRole('heading', { name: '근거 문장을 완성해 볼까요?' });
    const sentenceHeading = within(card).getByRole('heading', { name: '완성된 근거 문장' });
    const editor = editorHeading.closest('section');
    const sentenceRegion = sentenceHeading.closest('section');

    expect(editorHeading.tagName).toBe('H4');
    expect(sentenceHeading.tagName).toBe('H5');
    expect(editorHeading.id).toBeTruthy();
    expect(sentenceHeading.id).toBeTruthy();
    expect(new Set([cardHeading.id, editorHeading.id, sentenceHeading.id]).size).toBe(3);
    expect(editor?.getAttribute('aria-labelledby')).toBe(editorHeading.id);
    expect(sentenceRegion?.getAttribute('aria-labelledby')).toBe(sentenceHeading.id);
  });

  it('calls print from the teacher summary', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderAppAt('#/results', completedSession());
    await userEvent.setup().click(await screen.findByRole('button', { name: '교사용 요약 인쇄' }));
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });

  it('confirms reset before returning to start', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAppAt('#/results', completedSession());
    await userEvent.setup().click(await screen.findByRole('button', { name: '처음부터 다시' }));
    expect(confirm).toHaveBeenCalledWith('저장된 미션 근거와 수정 기록을 이 기기에서 지울까요?');
    expect(window.location.hash).toBe('#/results');
    confirm.mockRestore();
  });

  it('starts the next incomplete mission in registry order and applies the B dataset choice', async () => {
    renderAppAt('#/', completedBalanceStateWithTwoRetries());
    const user = userEvent.setup();
    expect(await screen.findByText('다음 미션: 2. 평균이 같아도 다를까요?')).toBeVisible();
    await user.click(screen.getByRole('radio', { name: '도전(B 세트)' }));
    await user.click(screen.getByRole('button', { name: '미션 시작' }));
    expect(window.location.hash).toBe('#/mission/mean-twins/twins-6-b/situation');
  });

  it('offers only the full-results action after every required mission is complete', async () => {
    renderAppAt('#/', completedSession());
    expect(await screen.findByRole('button', { name: '전체 결과 보기' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '미션 시작' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: '기본(A 세트)' })).not.toBeInTheDocument();
  });

  it('lists every unfinished required mission in registry order', () => {
    renderAppAt('#/results', createInitialSession());
    expect(screen.getByRole('status')).toHaveTextContent(
      '전체 결과를 보려면 1. 골고루 나누기, 2. 평균이 같아도 다를까요?, 3. 한 값이 바뀌면?, 4. 평균만으로 괜찮을까요? 미션을 끝내야 해요.',
    );
  });

  it('confirms before replacing another in-progress run', async () => {
    const state = {
      ...completedBalanceStateWithTwoRetries(),
      activeRun: { ...completedBalanceStateWithTwoRetries().activeRun!, stage: 'calculate' as const },
    };
    renderAppAt('#/', state);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.setup().click(screen.getByRole('button', { name: '미션 시작' }));
    expect(confirm).toHaveBeenCalledWith('현재 진행 중인 자료를 버리고 새 미션을 시작할까요?');
    expect(window.location.hash).toBe('#/');
    confirm.mockRestore();
  });
});
