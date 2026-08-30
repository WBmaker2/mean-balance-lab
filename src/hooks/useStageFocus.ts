import { useEffect } from 'react';

export const useStageFocus = (focusKey: string): void => {
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!(main instanceof HTMLElement)) return;
    if (window.scrollY > 0 && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    main.focus({ preventScroll: true });
  }, [focusKey]);
};
