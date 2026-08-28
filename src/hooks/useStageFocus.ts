import { useEffect } from 'react';

export const useStageFocus = (focusKey: string): void => {
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main instanceof HTMLElement) main.focus({ preventScroll: true });
  }, [focusKey]);
};
