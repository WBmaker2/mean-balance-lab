import benchIllustration from '../../assets/notebook/bench-illustration-v2.png';
import { QuantityDots } from './QuantityDots';

export interface BalanceIllustrationProps {
  initialValues: readonly number[];
  currentValues: readonly number[];
  meanValue: number;
  balanced: boolean;
}

const valuesText = (values: readonly number[]) => values.join(', ');

export const BalanceIllustration = ({
  initialValues, currentValues, meanValue, balanced,
}: BalanceIllustrationProps) => (
  <figure className="balance-illustration" aria-label="구슬 분배 작업대" data-balanced={balanced}>
    <div className="balance-illustration-stage">
      <img src={benchIllustration} alt="" aria-hidden="true" />
      <QuantityDots values={currentValues} label="현재 수량" />
      <div className="balance-value-overlay balance-value-initial">
        <span className="balance-overlay-label">처음 수량: {valuesText(initialValues)}</span>
      </div>
      <div className="balance-value-overlay balance-value-current">
        <span className="balance-overlay-label">현재 수량: {valuesText(currentValues)}</span>
      </div>
    </div>
    <figcaption>
      <span>평균: {meanValue}</span>
      <span>{balanced ? '고르게 나뉘었어요.' : '아직 고르게 나뉘지 않았어요.'}</span>
    </figcaption>
  </figure>
);
