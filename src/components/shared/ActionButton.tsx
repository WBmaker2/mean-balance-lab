import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emphasis?: 'next' | 'normal';
  children?: ReactNode;
}

export const ActionButton = ({
  emphasis = 'normal', className = '', children, ...props
}: ActionButtonProps) => {
  const isNext = emphasis === 'next' && !props.disabled;
  return (
    <button
      {...props}
      data-current-action={isNext ? 'true' : undefined}
      className={`${className} ${isNext ? 'gi-pulse' : ''}`.trim()}
    >
      {children}
      {isNext ? <span className="reduced-motion-next" aria-hidden="true">다음 행동</span> : null}
    </button>
  );
};
