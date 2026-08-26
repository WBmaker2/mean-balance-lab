import { dotFrequencies } from '../../domain/math';

export interface DotPlotProps {
  values: readonly number[];
  label: string;
}

/** 자료의 각 값과 빈도를 읽기 전용으로 보여 주는 한 열짜리 점도표입니다. */
export const DotPlot = ({ values, label }: DotPlotProps) => {
  const frequencies = dotFrequencies(values);
  const rawValues = values.join(', ');

  return (
    <div className="dot-plot" role="img" aria-label={`${label} 점도표: ${rawValues}`}>
      <span className="sr-only">{label} 값 목록: {rawValues}</span>
      <div className="dot-plot-columns" aria-hidden="false">
        {frequencies.map(({ value, count }) => (
          <div
            className="dot-plot-column"
            data-testid="dot-column"
            data-value={value}
            data-count={count}
            key={value}
          >
            <div className="dot-plot-dots" aria-label={`${value}의 점 ${count}개`}>
              {Array.from({ length: count }, (_, index) => (
                <span className="dot-plot-dot" data-testid="dot" aria-hidden="true" key={`${value}-${index}`} />
              ))}
            </div>
            <span className="dot-plot-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
