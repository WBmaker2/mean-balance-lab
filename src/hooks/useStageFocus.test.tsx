import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useStageFocus } from './useStageFocus';

const FocusProbe = ({ focusKey }: { focusKey: string }) => {
  useStageFocus(focusKey);
  return null;
};

describe('useStageFocus', () => {
  afterEach(() => {
    cleanup();
    document.getElementById('main-content')?.remove();
    vi.restoreAllMocks();
  });

  it('focuses main on mount and after the focus key changes', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    main.tabIndex = -1;
    document.body.append(main);
    const { rerender } = render(<FocusProbe focusKey="situation" />);
    expect(main).toHaveFocus();
    rerender(<FocusProbe focusKey="predict" />);
    expect(main).toHaveFocus();
  });

  it('returns to the document top before focusing a stage after a mobile scroll', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    main.tabIndex = -1;
    document.body.append(main);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    render(<FocusProbe focusKey="redistribute" />);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    expect(main).toHaveFocus();
  });
});
