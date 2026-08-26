import { useCallback, useState } from 'react';

export interface LiveAnnouncement {
  message: string;
  announce: (message: string) => void;
}

/** Keeps learner-facing announcements in a stable live-region-friendly state. */
export const useLiveAnnouncement = (): LiveAnnouncement => {
  const [message, setMessage] = useState('');
  const announce = useCallback((nextMessage: string) => setMessage(nextMessage), []);
  return { message, announce };
};
