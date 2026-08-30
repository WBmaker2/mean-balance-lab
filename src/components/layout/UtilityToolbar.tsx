import type { MouseEvent, ReactNode } from 'react';

export interface UtilityToolbarProps {
  studentLabel?: string;
}

type ToolbarItemProps = {
  href: string;
  label: string;
  children: ReactNode;
};

const focusableTarget = (target: HTMLElement): HTMLElement => {
  if (target instanceof HTMLDetailsElement) {
    return target.querySelector('summary') ?? target;
  }
  return target;
};

const keepHashRouterRoute = (event: MouseEvent<HTMLAnchorElement>) => {
  const targetId = event.currentTarget.hash.slice(1);
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;
  event.preventDefault();
  if (target instanceof HTMLDetailsElement) target.open = true;
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const focusTarget = focusableTarget(target);
  if (typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
};

const ToolbarIcon = ({ children }: { children: ReactNode }) => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="utility-toolbar-icon">
    {children}
  </svg>
);

const ToolbarItem = ({ href, label, children }: ToolbarItemProps) => (
  <a className="utility-toolbar-link" href={href} onClick={keepHashRouterRoute}>
    <ToolbarIcon>{children}</ToolbarIcon>
    <span>{label}</span>
  </a>
);

export const UtilityToolbar = ({ studentLabel = '학생' }: UtilityToolbarProps) => (
  <nav className="utility-toolbar" aria-label="도구 모음">
    <ToolbarItem href="#main-content" label="노트">
      <path d="M6 3.75h9.5L19 7.25v13H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15.5 3.75v3.5H19M9 11h7M9 14.5h7M9 18h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </ToolbarItem>
    <ToolbarItem href="#artifact-records" label="기록">
      <path d="M6.5 4.25h11v16l-5.5-3.25-5.5 3.25z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </ToolbarItem>
    <ToolbarItem href="#app-settings" label="설정">
      <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m19.1 13.4 1.2.9-1.7 2.9-1.4-.6a7.7 7.7 0 0 1-1.5.9l-.2 1.5h-3.4l-.2-1.5a7.7 7.7 0 0 1-1.5-.9l-1.4.6-1.7-2.9 1.2-.9a7.2 7.2 0 0 1 0-1.8l-1.2-.9 1.7-2.9 1.4.6a7.7 7.7 0 0 1 1.5-.9l.2-1.5h3.4l.2 1.5a7.7 7.7 0 0 1 1.5.9l1.4-.6 1.7 2.9-1.2.9a7.2 7.2 0 0 1 0 1.8Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </ToolbarItem>
    <span className="utility-toolbar-student">
      <ToolbarIcon>
        <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.75 20c.6-3.1 2.7-4.8 6.25-4.8s5.65 1.7 6.25 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </ToolbarIcon>
      <span>{studentLabel}</span>
    </span>
  </nav>
);
