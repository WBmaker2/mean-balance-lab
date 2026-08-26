interface LiveRegionProps {
  message: string;
}

export const LiveRegion = ({ message }: LiveRegionProps) => (
  <p role="status" aria-live="polite" aria-atomic="true">
    {message}
  </p>
);
