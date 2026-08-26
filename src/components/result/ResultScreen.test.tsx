import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completedSession, renderAppAt, sessionWithThreeRequiredMissions, completedBalanceStateWithTwoRetries } from '../../test/fixtures';
import { ResultScreen } from './ResultScreen';

describe('ResultScreen', () => {
  afterEach(cleanup);

  it('locks final results until all four required canonical attempts exist', async () => {
    renderAppAt('#/results', sessionWithThreeRequiredMissions());
    expect(await screen.findByText('대표값 심의 필수 자료를 마치면 전체 결과를 볼 수 있어요.')).toBeVisible();
    expect(screen.queryByRole('button', { name: '교사용 요약 인쇄' })).not.toBeInTheDocument();
  });

  it('does not unlock from forged completion mission IDs alone', async () => {
    const state = { ...sessionWithThreeRequiredMissions(), completedRequiredMissions: [
      'balance-delivery', 'mean-twins', 'outlier-alert', 'representative-review',
    ] as const };
    renderAppAt('#/results', state);
    expect(await screen.findByText('대표값 심의 필수 자료를 마치면 전체 결과를 볼 수 있어요.')).toBeVisible();
  });

  it('shows each card in evidence, revisions, level, actions order without aggregate scoring', async () => {
    renderAppAt('#/results', completedSession());
    expect(await screen.findByRole('heading', { name: '전체 결과' })).toBeVisible();
    const cards = screen.getAllByRole('region').filter((region) => region.classList.contains('mission-summary'));
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      const evidence = within(card).getByRole('heading', { name: '내가 사용한 근거' });
      const revisions = within(card).getByRole('heading', { name: '고쳐 생각한 과정' });
      const level = within(card).getByRole('heading', { name: '근거 단계' });
      const actions = within(card).getByRole('navigation');
      expect(evidence.compareDocumentPosition(revisions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(revisions.compareDocumentPosition(level) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(level.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
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
    expect(within(card).getByText('고르게 옮긴 결과, 전체 양 20을 자료 4개로 나누어 평균 5를 확인했어요.')).toBeVisible();
    expect(within(card).getByText('수정 기록 0회')).toBeVisible();
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
    expect(await screen.findByText('다음 미션: 2. 평균 쌍둥이')).toBeVisible();
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
});
