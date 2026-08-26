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
    closeRef.current?.focus();
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
