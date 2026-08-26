import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDataset } from '../../content/missions';
import { deriveEvidenceLevel, buildEvidenceSentence } from '../../domain/evaluation';
import type { EvidenceRecord, MissionId } from '../../domain/types';
import { EvidenceBuilder } from './EvidenceBuilder';

const renderEvidenceBuilder = (
  mission: MissionId,
  datasetId: Parameters<typeof getDataset>[0],
  revisions = 0,
  existingRecord?: EvidenceRecord,
) => {
  const onSubmit = vi.fn<(record: EvidenceRecord) => void>();
  render(
    <EvidenceBuilder
      mission={mission}
      dataset={getDataset(datasetId)}
      revisions={revisions}
      onSubmit={onSubmit}
      {...(existingRecord ? { existingRecord } : {})}
    />,
  );
  return onSubmit;
};

describe('EvidenceBuilder', () => {
  afterEach(cleanup);

  it.each([
    ['review-cards-a', '평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.'],
    ['review-baskets-b', '평균은 3개이지만 세 보급 상자는 1개뿐이므로 평균만으로 모든 보급 상자의 상태를 말할 수 없습니다.'],
  ] as const)('builds the approved representative-value sentence for %s', async (datasetId, sentence) => {
    const onSubmit = renderEvidenceBuilder('representative-review', datasetId, 2);
    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.' }));
    await user.click(screen.getByRole('checkbox', { name: '범위와 각 값도 함께 봐야 합니다.' }));
    await user.click(screen.getByRole('button', { name: '근거 문장 완성' }));

    expect(screen.getByText(sentence)).toBeVisible();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      missionId: 'representative-review',
      datasetId,
      selectedIds: ['mean-use-and-limit', 'range-or-individual-values'],
      sentence,
      level: 3,
      revisions: 2,
    }));
  });

  it.each([
    ['balance-delivery', 'balance-20-a', 'redistribution-and-division'],
    ['mean-twins', 'twins-4-a', 'same-mean-and-different-spread'],
    ['outlier-alert', 'outlier-5-a', 'sum-change-and-mean-change'],
  ] as const)('emits a complete level-3 record for %s', async (mission, datasetId, choice) => {
    const onSubmit = renderEvidenceBuilder(mission, datasetId, 4);
    const user = userEvent.setup();
    const choiceInput = screen.getByRole('radio', { name: new RegExp(choice === 'redistribution-and-division'
      ? '고르게 옮긴 결과와 합계'
      : choice === 'same-mean-and-different-spread' ? '평균은 같고 퍼짐' : '합계 변화와 평균 변화') });
    await user.click(choiceInput);
    await user.click(screen.getByRole('button', { name: '근거 문장 완성' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [record] = onSubmit.mock.calls[0]!;
    expect(record).toMatchObject({ missionId: mission, datasetId, selectedIds: [choice], level: 3, revisions: 4 });
    expect(record.sentence).toBe(buildEvidenceSentence(mission, datasetId, [choice]));
    expect(record.level).toBe(deriveEvidenceLevel(mission, [choice]));
  });

  it('keeps representative misconception exclusive from the two good reasons', async () => {
    renderEvidenceBuilder('representative-review', 'review-cards-a');
    const user = userEvent.setup();
    const usefulness = screen.getByRole('checkbox', { name: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.' });
    const limitation = screen.getByRole('checkbox', { name: '범위와 각 값도 함께 봐야 합니다.' });
    const misconception = screen.getByRole('checkbox', { name: '평균만으로 모든 자료를 판단할 수 있다고 생각했어요.' });

    await user.click(usefulness);
    await user.click(limitation);
    expect(usefulness).toBeChecked();
    expect(limitation).toBeChecked();
    await user.click(misconception);
    expect(misconception).toBeChecked();
    expect(usefulness).not.toBeChecked();
    expect(limitation).not.toBeChecked();
  });

  it('shows actionable guidance and emits no invalid record for empty submit', async () => {
    const onSubmit = renderEvidenceBuilder('mean-twins', 'twins-4-a');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '근거 문장 완성' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('근거를 하나 이상 선택해 보세요.')).toBeVisible();
    expect(screen.getByText(/다음 행동:.*근거를 선택해 보세요/)).toBeVisible();
  });

  it('shows representative safety notices before submission', () => {
    renderEvidenceBuilder('representative-review', 'review-cards-a');
    const notices = screen.getAllByText(/평균은 자료를 간단히 살펴보는 데 도움이 되지만|평균 하나가 공정성/);
    expect(notices).toHaveLength(2);
    expect(notices[0]).toHaveTextContent('평균은 자료를 간단히 살펴보는 데 도움이 되지만, 모든 차이를 보여 주지는 않습니다.');
    expect(notices[1]).toHaveTextContent('평균 하나가 공정성이나 개인의 가치를 결정하지 않습니다.');
  });

  it('does not offer personal, ranking, or free-text inputs', () => {
    renderEvidenceBuilder('representative-review', 'review-cards-a');
    expect(screen.queryByLabelText(/이름|학번|성적|키|몸무게|순위/)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /자유/ })).not.toBeInTheDocument();
  });

  it('restores a verified sentence while leaving choices editable', async () => {
    const record: EvidenceRecord = {
      missionId: 'representative-review',
      datasetId: 'review-cards-a',
      selectedIds: ['mean-use-and-limit', 'range-or-individual-values'],
      sentence: '평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.',
      level: 3,
      revisions: 1,
    };
    renderEvidenceBuilder('representative-review', 'review-cards-a', 1, record);
    expect(screen.getByText(record.sentence)).toBeVisible();
    expect(screen.getByRole('checkbox', { name: '평균은 여러 값을 한 수로 살펴보는 데 도움이 됩니다.' })).toBeChecked();
    expect(screen.getByRole('button', { name: '근거 문장 수정' })).toBeVisible();
  });
});
