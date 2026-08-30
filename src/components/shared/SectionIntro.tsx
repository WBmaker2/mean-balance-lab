import type { ReactNode } from 'react';

export interface SectionIntroProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: 'blue' | 'green' | 'orange';
  children?: ReactNode;
}

export const SectionIntro = ({ id, eyebrow, title, description, tone = 'blue', children }: SectionIntroProps) => (
  <section className={`section-intro section-intro-${tone}`} aria-labelledby={id}>
    {eyebrow ? <p className="section-intro-eyebrow">{eyebrow}</p> : null}
    <h1 id={id}>{title}</h1>
    {description ? <p className="section-intro-description">{description}</p> : null}
    {children}
  </section>
);
