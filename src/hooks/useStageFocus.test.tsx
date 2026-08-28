import { afterEach, describe, expect, it } from 'vitest';
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
  });

  it('focuses main after the focus key changes', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    main.tabIndex = -1;
    document.body.append(main);
    const { rerender } = render(<FocusProbe focusKey="situation" />);
    expect(main).not.toHaveFocus();
    rerender(<FocusProbe focusKey="predict" />);
    expect(main).toHaveFocus();
  });
});
