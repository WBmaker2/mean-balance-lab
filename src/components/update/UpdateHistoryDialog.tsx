import { useEffect, useId, useRef, useState } from 'react';
import { UPDATE_HISTORY } from '../../content/updateHistory';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type InertElement = HTMLElement & { inert: boolean };

interface SavedElementState {
  element: InertElement;
  hadInertAttribute: boolean;
  inert: boolean;
  ariaHidden: string | null;
}

const saveElementState = (element: HTMLElement): SavedElementState => {
  const inertElement = element as InertElement;
  return {
    element: inertElement,
    hadInertAttribute: element.hasAttribute('inert'),
    // jsdom does not expose the native boolean property, while browsers do.
    // Normalize the fallback to the native default so cleanup restores a
    // stable false value without leaving an expando set to undefined.
    inert: inertElement.inert === true,
    ariaHidden: element.getAttribute('aria-hidden'),
  };
};

const restoreElementState = ({ element, hadInertAttribute, inert, ariaHidden }: SavedElementState) => {
  element.inert = inert;
  if (hadInertAttribute) element.setAttribute('inert', '');
  else element.removeAttribute('inert');
  if (ariaHidden === null) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', ariaHidden);
};

export const UpdateHistoryDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const titleId = `update-history-title-${useId().replaceAll(':', '')}`;

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const background = document.getElementById('app-shell-content');
    const trigger = triggerRef.current;
    const savedStates = [background, trigger]
      .filter((element): element is HTMLElement => element !== null)
      .map(saveElementState);

    for (const savedState of savedStates) {
      savedState.element.inert = true;
      savedState.element.setAttribute('inert', '');
    }
    if (background) background.setAttribute('aria-hidden', 'true');

    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last?.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first?.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !dialog.contains(target)) {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn, true);
      savedStates.forEach(restoreElementState);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="update-history-trigger print-hidden"
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: '1rem',
          minWidth: '44px',
          minHeight: '44px',
          zIndex: 10,
        }}
        onClick={() => setIsOpen(true)}
      >
        업데이트 내역
      </button>
      {isOpen ? (
        <div
          ref={dialogRef}
          className="update-history-dialog print-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId}>업데이트 내역</h2>
          <ul>
            {UPDATE_HISTORY.map((entry) => (
              <li key={`${entry.date}-${entry.category}-${entry.summary}`}>
                <time dateTime={entry.date}>{entry.date}</time>
                <span>{entry.category}</span>
                <span>{entry.summary}</span>
              </li>
            ))}
          </ul>
          <button ref={closeRef} type="button" onClick={() => setIsOpen(false)}>
            닫기
          </button>
        </div>
      ) : null}
    </>
  );
};

export default UpdateHistoryDialog;
