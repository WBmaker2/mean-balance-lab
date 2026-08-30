export interface QuantityDotsProps {
  values: readonly number[];
  label: string;
}

const dotCount = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

export const QuantityDots = ({ values, label }: QuantityDotsProps) => (
  <div
    className="balance-dot-grid"
    data-visualization="quantity-dots"
    data-label={label}
    data-current-values={values.join(',')}
    aria-hidden="true"
  >
    {values.map((value, basketIndex) => {
      const count = dotCount(value);
      return (
        <div
          className="balance-dot-basket"
          data-basket-index={basketIndex}
          data-dot-count={count}
          key={`basket-${basketIndex}`}
        >
          {Array.from({ length: count }, (_, dotIndex) => (
            <span
              className="quantity-dot"
              data-dot-index={dotIndex}
              key={`${basketIndex}-${dotIndex}`}
            />
          ))}
        </div>
      );
    })}
  </div>
);
