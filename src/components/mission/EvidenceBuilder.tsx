import { useState, type FormEvent } from 'react';
import { EVIDENCE_FRAGMENTS, SAFETY_COPY } from '../../content/copy';
import { buildEvidenceSentence, deriveEvidenceLevel } from '../../domain/evaluation';
import type {
  EvidenceChoiceId, EvidenceRecord, MissionDataset, MissionId,
} from '../../domain/types';
import { ActionButton } from '../shared/ActionButton';
import { FeedbackPrompt } from '../shared/FeedbackPrompt';

export interface EvidenceBuilderProps {
  mission: MissionId;
  dataset: MissionDataset;
  revisions: number;
  onSubmit: (record: EvidenceRecord) => void;
  existingRecord?: EvidenceRecord;
}

type ChoiceOption = { id: EvidenceChoiceId; label: string };

const OPTIONS: Readonly<Record<MissionId, readonly ChoiceOption[]>> = {
  'balance-delivery': [
    { id: 'redistribution-and-division', label: EVIDENCE_FRAGMENTS['redistribution-and-division'] },
    { id: 'redistribution-only', label: EVIDENCE_FRAGMENTS['redistribution-only'] },
    { id: 'calculation-only', label: EVIDENCE_FRAGMENTS['calculation-only'] },
  ],
  'mean-twins': [
    { id: 'same-mean-and-different-spread', label: EVIDENCE_FRAGMENTS['same-mean-and-different-spread'] },
    { id: 'same-mean-only', label: EVIDENCE_FRAGMENTS['same-mean-only'] },
    { id: 'same-shape', label: EVIDENCE_FRAGMENTS['same-shape'] },
  ],
  'outlier-alert': [
    { id: 'sum-change-and-mean-change', label: EVIDENCE_FRAGMENTS['sum-change-and-mean-change'] },
    { id: 'direction-only', label: EVIDENCE_FRAGMENTS['direction-only'] },
    { id: 'guess-only', label: EVIDENCE_FRAGMENTS['guess-only'] },
  ],
  'representative-review': [
    { id: 'mean-use-and-limit', label: EVIDENCE_FRAGMENTS['mean-use-and-limit'] },
    { id: 'range-or-individual-values', label: EVIDENCE_FRAGMENTS['range-or-individual-values'] },
    { id: 'mean-always-enough', label: EVIDENCE_FRAGMENTS['mean-always-enough'] },
  ],
};

const EMPTY_FEEDBACK = {
  isCorrect: false,
  message: '근거를 하나 이상 선택해 보세요.',
  nextAction: '평균의 도움과 한계를 보여 주는 근거를 선택해 보세요.',
} as const;

const isRepresentative = (mission: MissionId): mission is 'representative-review' =>
  mission === 'representative-review';

const validExistingRecord = (
  mission: MissionId,
  dataset: MissionDataset,
  record: EvidenceRecord | undefined,
): record is EvidenceRecord => record !== undefined
  && record.missionId === mission
  && record.datasetId === dataset.id
  && record.selectedIds.length > 0
  && new Set(record.selectedIds).size === record.selectedIds.length
  && record.selectedIds.every((id) => OPTIONS[mission].some((option) => option.id === id))
  && record.sentence === buildEvidenceSentence(mission, dataset.id, record.selectedIds)
  && record.level === deriveEvidenceLevel(mission, record.selectedIds)
  && Number.isInteger(record.revisions)
  && record.revisions >= 0;

export const EvidenceBuilder = ({
  mission, dataset, revisions, onSubmit, existingRecord,
}: EvidenceBuilderProps) => {
  const restored = validExistingRecord(mission, dataset, existingRecord) ? existingRecord : undefined;
  const [selectedIds, setSelectedIds] = useState<readonly EvidenceChoiceId[]>(restored?.selectedIds ?? []);
  const [submitted, setSubmitted] = useState<EvidenceRecord | undefined>(restored);
  const [feedback, setFeedback] = useState<typeof EMPTY_FEEDBACK | null>(null);
  const orderedSelectedIds = isRepresentative(mission)
    ? OPTIONS[mission].map(({ id }) => id).filter((id) => selectedIds.includes(id))
    : [...selectedIds];
  const sentence = buildEvidenceSentence(mission, dataset.id, orderedSelectedIds);

  const selectRadio = (id: EvidenceChoiceId) => {
    setSelectedIds([id]);
    setSubmitted(undefined);
    setFeedback(null);
  };

  const toggleRepresentative = (id: 'mean-use-and-limit' | 'range-or-individual-values' | 'mean-always-enough') => {
    if (id === 'mean-always-enough') {
      setSelectedIds(selectedIds.includes(id) ? [] : [id]);
    } else {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id && selected !== 'mean-always-enough')
        : [...selectedIds.filter((selected) => selected !== 'mean-always-enough'), id];
      setSelectedIds(next);
    }
    setSubmitted(undefined);
    setFeedback(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      setFeedback(EMPTY_FEEDBACK);
      return;
    }
    const record: EvidenceRecord = {
      missionId: mission,
      datasetId: dataset.id,
      selectedIds: orderedSelectedIds,
      sentence,
      level: deriveEvidenceLevel(mission, orderedSelectedIds),
      revisions,
    };
    setSubmitted(record);
    setFeedback(null);
    onSubmit(record);
  };

  const edit = () => {
    setSubmitted(undefined);
    setFeedback(null);
  };

  return (
    <section aria-labelledby="evidence-heading">
      <h1 id="evidence-heading">근거 문장을 완성해 볼까요?</h1>
      <p>검토한 근거를 골라 고정된 문장을 완성해 보세요.</p>

      {isRepresentative(mission) ? (
        <aside aria-label="대표값 안전 안내">
          <p>{SAFETY_COPY.usefulness}</p>
          <p>{SAFETY_COPY.fairness}</p>
        </aside>
      ) : null}

      <form onSubmit={submit}>
        <fieldset>
          <legend>사용한 근거를 골라 보세요.</legend>
          {isRepresentative(mission) ? (
            OPTIONS[mission].map(({ id, label }) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(id)}
                  onChange={() => toggleRepresentative(id as 'mean-use-and-limit' | 'range-or-individual-values' | 'mean-always-enough')}
                />
                {label}
              </label>
            ))
          ) : (
            OPTIONS[mission].map(({ id, label }) => (
              <label key={id}>
                <input
                  type="radio"
                  name="evidence-choice"
                  checked={selectedIds[0] === id}
                  onChange={() => selectRadio(id)}
                />
                {label}
              </label>
            ))
          )}
        </fieldset>

        <section aria-label="완성된 근거 문장">
          <h2>완성된 근거 문장</h2>
          {submitted ? <p role="status">근거 문장을 저장했어요.</p> : null}
          <p>{submitted?.sentence ?? (selectedIds.length > 0 ? sentence : '근거를 선택하면 문장이 나타나요.')}</p>
        </section>

        {feedback ? <FeedbackPrompt {...feedback} /> : null}
        {submitted ? (
          <ActionButton type="button" emphasis="next" onClick={edit}>근거 문장 수정</ActionButton>
        ) : (
          <ActionButton type="submit" emphasis="next">근거 문장 완성</ActionButton>
        )}
      </form>
    </section>
  );
};
