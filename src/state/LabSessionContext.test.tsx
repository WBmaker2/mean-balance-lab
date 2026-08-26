import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { LabSessionProvider, useLabSession } from './LabSessionContext';

const Probe = () => {
  const { state, dispatch } = useLabSession();
  return <button onClick={() => dispatch({ type: 'SET_SAVE_MODE', mode: 'device' })}>{state.saveMode}</button>;
};

describe('LabSessionProvider storage failures', () => {
  it('still changes mode when device removeItem throws', () => {
    const remove = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    render(<LabSessionProvider><Probe /></LabSessionProvider>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('device');
    localStorage.removeItem = remove;
    cleanup();
  });

  it('still completes RESET_ALL when both removeItem calls throw', () => {
    const removeTab = sessionStorage.removeItem.bind(sessionStorage);
    const removeDevice = localStorage.removeItem.bind(localStorage);
    sessionStorage.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    localStorage.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    const ProbeReset = () => {
      const { state, dispatch } = useLabSession();
      return <button onClick={() => dispatch({ type: 'RESET_ALL' })}>{state.activeRun ? 'active' : 'reset'}</button>;
    };
    render(<LabSessionProvider><ProbeReset /></LabSessionProvider>);
    const button = screen.getByRole('button');
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button).toHaveTextContent('reset');
    sessionStorage.removeItem = removeTab;
    localStorage.removeItem = removeDevice;
    cleanup();
  });
});
