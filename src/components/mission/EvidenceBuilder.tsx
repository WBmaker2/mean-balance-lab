import { useEffect, useState, type FormEvent } from 'react';
import { EVIDENCE_EMPTY_COPY, EVIDENCE_FRAGMENTS, SAFETY_COPY } from '../../content/copy';
import {
  buildEvidenceSentence, deriveEvidenceLevel, isCanonicalEvidenceRecord,
} from '../../domain/evaluation';
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
  onAdvance?: () => void;
  headingLevel?: EvidenceHeadingLevel;
  headingId?: string;
}

export type EvidenceHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

const HEADING_TAGS: Record<EvidenceHeadingLevel, EvidenceHeadingLevel> = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5',
};

const nextHeadingTag = (level: EvidenceHeadingLevel): 'h2' | 'h3' | 'h4' | 'h5' | 'h6' => {
  const next = Number(level.slice(1)) + 1;
  return `h${next}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

type ChoiceOption = { id: EvidenceChoiceId; label: string };

const learnerEvidenceLabel = (id: EvidenceChoiceId): string => {
  if (id === 'mean-use-and-limit') return '평균은 여러 값을 한 수로 살펴보는 데 도움이 돼요.';
  if (id === 'range-or-individual-values') return '범위와 각 값도 함께 봐야 해요.';
  return EVIDENCE_FRAGMENTS[id];
};

const OPTIONS: Readonly<Record<MissionId, readonly ChoiceOption[]>> = {
  'balance-delivery': [
    { id: 'redistribution-and-division', label: learnerEvidenceLabel('redistribution-and-division') },
    { id: 'redistribution-only', label: learnerEvidenceLabel('redistribution-only') },
    { id: 'calculation-only', label: learnerEvidenceLabel('calculation-only') },
  ],
  'mean-twins': [
    { id: 'same-mean-and-different-spread', label: learnerEvidenceLabel('same-mean-and-different-spread') },
    { id: 'same-mean-only', label: learnerEvidenceLabel('same-mean-only') },
    { id: 'same-shape', label: learnerEvidenceLabel('same-shape') },
  ],
  'outlier-alert': [
    { id: 'sum-change-and-mean-change', label: learnerEvidenceLabel('sum-change-and-mean-change') },
    { id: 'direction-only', label: learnerEvidenceLabel('direction-only') },
    { id: 'guess-only', label: learnerEvidenceLabel('guess-only') },
  ],
  'representative-review': [
    { id: 'mean-use-and-limit', label: learnerEvidenceLabel('mean-use-and-limit') },
    { id: 'range-or-individual-values', label: learnerEvidenceLabel('range-or-individual-values') },
    { id: 'mean-always-enough', label: learnerEvidenceLabel('mean-always-enough') },
  ],
};

const emptyFeedback = (mission: MissionId) => ({
  isCorrect: false as const,
  message: '근거를 하나 이상 선택해 보세요.',
  nextAction: EVIDENCE_EMPTY_COPY[mission],
});

const isRepresentative = (mission: MissionId): mission is 'representative-review' =>
  mission === 'representative-review';

const validExistingRecord = (
  mission: MissionId,
  dataset: MissionDataset,
  revisions: number,
  record: EvidenceRecord | undefined,
): record is EvidenceRecord => record !== undefined
  && isCanonicalEvidenceRecord(record, mission, dataset.id, revisions);

const evidenceSignature = (
  mission: MissionId,
  dataset: MissionDataset,
  revisions: number,
  record: EvidenceRecord | undefined,
): string => JSON.stringify({
  mission,
  dataset: dataset.id,
  revisions,
  record: record ? {
    missionId: record.missionId,
    datasetId: record.datasetId,
    selectedIds: record.selectedIds,
    sentence: record.sentence,
    level: record.level,
    revisions: record.revisions,
  } : null,
});

export const EvidenceBuilder = ({
  mission, dataset, revisions, onSubmit, existingRecord, onAdvance,
  headingLevel = 'h1', headingId = 'evidence-heading',
}: EvidenceBuilderProps) => {
  const restored = validExistingRecord(mission, dataset, revisions, existingRecord) ? existingRecord : undefined;
  const signature = evidenceSignature(mission, dataset, revisions, restored);
  const [selectedIds, setSelectedIds] = useState<readonly EvidenceChoiceId[]>(restored?.selectedIds ?? []);
  const [submitted, setSubmitted] = useState<EvidenceRecord | undefined>(restored);
  const [feedback, setFeedback] = useState<ReturnType<typeof emptyFeedback> | null>(null);
  useEffect(() => {
    const nextRestored = validExistingRecord(mission, dataset, revisions, existingRecord) ? existingRecord : undefined;
    setSelectedIds(nextRestored?.selectedIds ?? []);
    setSubmitted(nextRestored);
    setFeedback(null);
  }, [signature]);
  const orderedSelectedIds = isRepresentative(mission)
    ? OPTIONS[mission].map(({ id }) => id).filter((id) => selectedIds.includes(id))
    : [...selectedIds];
  const sentence = buildEvidenceSentence(mission, dataset.id, orderedSelectedIds);
  const HeadingTag = HEADING_TAGS[headingLevel];
  const sentenceHeadingTag = nextHeadingTag(headingLevel);
  const SentenceHeadingTag = sentenceHeadingTag;
  const sentenceHeadingId = headingId === 'evidence-heading'
    ? 'evidence-sentence-heading'
    : `${headingId}-sentence-heading`;

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
      setFeedback(emptyFeedback(mission));
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
    <section className="stage-panel stage-panel-explain evidence-panel" data-stage="explain" aria-labelledby={headingId}>
      <div className="stage-heading">
        <HeadingTag id={headingId}>근거 문장을 완성해 볼까요?</HeadingTag>
        <p className="stage-description">살펴본 근거를 골라 문장을 완성해 보세요.</p>
      </div>

      {isRepresentative(mission) ? (
        <aside className="safety-note" aria-label="대표값 안전 안내">
          <p>{SAFETY_COPY.learnerUsefulness}</p>
          <p>{SAFETY_COPY.learnerFairness}</p>
        </aside>
      ) : null}

      <form className="evidence-form" onSubmit={submit}>
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

        <section className="evidence-sentence" aria-labelledby={sentenceHeadingId}>
          <SentenceHeadingTag id={sentenceHeadingId}>완성된 근거 문장</SentenceHeadingTag>
          {submitted ? <p role="status">근거 문장을 저장했어요.</p> : null}
          <p>{submitted?.sentence ?? (selectedIds.length > 0 ? sentence : '근거를 선택하면 문장이 나타나요.')}</p>
        </section>

        {feedback ? <FeedbackPrompt {...feedback} /> : null}
        {submitted ? (
          <>
            <div className="action-group">
              <ActionButton type="button" onClick={edit}>근거 문장 수정</ActionButton>
              {onAdvance ? <ActionButton type="button" emphasis="next" onClick={onAdvance}>미션 결과 보기</ActionButton> : null}
            </div>
          </>
        ) : (
          <div className="action-group">
            <ActionButton type="submit" emphasis="next">근거 문장 완성</ActionButton>
          </div>
        )}
      </form>
    </section>
  );
};
