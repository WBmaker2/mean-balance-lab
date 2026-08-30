interface LiveRegionProps {
  message: string;
}

export const LiveRegion = ({ message }: LiveRegionProps) => message.trim() ? (
  <p role="status" aria-live="polite" aria-atomic="true">
    {message}
  </p>
) : null;
