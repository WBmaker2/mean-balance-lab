import type {
  DatasetId,
  LearningStage,
  MissionDataset,
  MissionDefinition,
  MissionId,
} from '../domain/types';

export const MISSIONS = [
  {
    id: 'balance-delivery',
    title: '1. 균형 배송',
    learnerTitle: '1. 골고루 나누기',
    learningGoal: '전체 양을 보존하며 같은 수로 나누어요.',
    requiredDatasetId: 'balance-20-a',
    datasets: [
      {
        kind: 'balance', id: 'balance-20-a', label: '기본 구슬 상자',
        context: '가상 포장 상자 네 개의 구슬을 고르게 나눠 봐요.',
        stages: ['situation', 'predict', 'redistribute', 'calculate', 'explain', 'mission-result'],
        expectedMean: 5, values: [2, 4, 6, 8], targetValues: [5, 5, 5, 5],
      },
      {
        kind: 'balance', id: 'balance-24-b', label: '도전 구슬 상자',
        context: '다른 가상 포장 상자 네 개의 구슬을 고르게 나눠 봐요.',
        stages: ['situation', 'predict', 'redistribute', 'calculate', 'explain', 'mission-result'],
        expectedMean: 6, values: [1, 5, 7, 11], targetValues: [6, 6, 6, 6],
      },
    ],
  },
  {
    id: 'mean-twins',
    title: '2. 평균 쌍둥이',
    learnerTitle: '2. 평균이 같아도 다를까요?',
    learningGoal: '평균이 같아도 자료의 모양은 다를 수 있어요.',
    requiredDatasetId: 'twins-4-a',
    datasets: [
      {
        kind: 'twins', id: 'twins-4-a', label: '평균 4 카드',
        context: '두 가상 선반의 독서 카드 수를 비교해 봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 4, leftValues: [4, 4, 4, 4], rightValues: [1, 3, 5, 7],
      },
      {
        kind: 'twins', id: 'twins-6-b', label: '평균 6 카드',
        context: '다른 두 가상 선반의 독서 카드 수를 비교해 봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 6, leftValues: [6, 6, 6, 6], rightValues: [2, 4, 8, 10],
      },
    ],
  },
  {
    id: 'outlier-alert',
    title: '3. 튀는 값 경보',
    learnerTitle: '3. 한 값이 바뀌면?',
    learningGoal: '합계 변화와 평균 변화를 연결해요.',
    requiredDatasetId: 'outlier-5-a',
    datasets: [
      {
        kind: 'outlier', id: 'outlier-5-a', label: '4 증가 바구니',
        context: '가상 수확 바구니 하나의 수를 바꿔 평균 변화를 살펴봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 5, beforeValues: [4, 5, 5, 6], afterValues: [4, 5, 5, 10], changedIndex: 3,
      },
      {
        kind: 'outlier', id: 'outlier-6-b', label: '8 증가 바구니',
        context: '다른 가상 수확 바구니 하나의 수를 바꿔 평균 변화를 살펴봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 6, beforeValues: [5, 6, 6, 7], afterValues: [5, 6, 6, 15], changedIndex: 3,
      },
    ],
  },
  {
    id: 'representative-review',
    title: '4. 대표값 심의',
    learnerTitle: '4. 평균만으로 괜찮을까요?',
    learningGoal: '평균의 도움과 한계를 근거로 판단해요.',
    requiredDatasetId: 'review-cards-a',
    datasets: [
      {
        kind: 'representativeness', id: 'review-cards-a', label: '독서 카드 배치',
        context: '가상 선반별 독서 카드 배치를 평균만으로 설명할 수 있는지 살펴봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 4, values: [2, 2, 2, 2, 12],
        acceptedEvidenceIds: ['mean-use-and-limit', 'range-or-individual-values'],
        modelSentence: '평균은 4장이지만 한 선반에 12장이 몰려 있어 범위와 각 값을 함께 봐야 합니다.',
      },
      {
        kind: 'representativeness', id: 'review-baskets-b', label: '보급 상자 배치',
        context: '가상 보급 상자 네 곳의 물건 수를 평균만으로 설명할 수 있는지 살펴봐요.',
        stages: ['situation', 'predict', 'calculate', 'compare', 'explain', 'mission-result'],
        expectedMean: 3, values: [1, 1, 1, 9],
        acceptedEvidenceIds: ['mean-use-and-limit', 'range-or-individual-values'],
        modelSentence: '평균은 3개이지만 세 보급 상자는 1개뿐이므로 평균만으로 모든 보급 상자의 상태를 말할 수 없습니다.',
      },
    ],
  },
] as const satisfies readonly MissionDefinition[];

const MISSION_IDS = new Set<MissionId>(MISSIONS.map((mission) => mission.id));
const DATASET_IDS = new Set<DatasetId>(MISSIONS.flatMap((mission) => mission.datasets.map((dataset) => dataset.id)));
const LEARNING_STAGES = new Set<LearningStage>([
  'situation', 'predict', 'redistribute', 'calculate', 'compare', 'explain', 'mission-result',
]);

export const isMissionId = (value: string): value is MissionId => MISSION_IDS.has(value as MissionId);

export const isDatasetId = (value: string): value is DatasetId => DATASET_IDS.has(value as DatasetId);

export const isLearningStage = (value: string): value is LearningStage =>
  LEARNING_STAGES.has(value as LearningStage);

const ALL_DATASETS = MISSIONS.reduce<MissionDataset[]>((datasets, mission) => {
  datasets.push(...mission.datasets);
  return datasets;
}, []);

export const getMission = (missionId: MissionId): MissionDefinition => {
  const mission = MISSIONS.find((item) => item.id === missionId);
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);
  return mission;
};

export const getDataset = (datasetId: DatasetId): MissionDataset => {
  const dataset = ALL_DATASETS.find((item) => item.id === datasetId);
  if (!dataset) throw new Error(`Unknown dataset: ${datasetId}`);
  return dataset;
};
