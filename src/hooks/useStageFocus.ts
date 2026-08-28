import { useEffect, useRef } from 'react';

export const useStageFocus = (focusKey: string): void => {
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const main = document.getElementById('main-content');
    if (main instanceof HTMLElement) main.focus({ preventScroll: true });
  }, [focusKey]);
};
