import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SectionIntro } from './SectionIntro';

describe('SectionIntro', () => {
  afterEach(cleanup);

  it('connects a labelled section to one heading and its description', () => {
    render(
      <SectionIntro
        id="intro-heading"
        eyebrow="오늘의 질문"
        title="평균을 살펴볼까요?"
        description="자료를 보고 평균을 예측해 보세요."
        tone="blue"
      />,
    );

    const section = screen.getByRole('region', { name: '평균을 살펴볼까요?' });
    expect(section).toHaveAttribute('aria-labelledby', 'intro-heading');
    expect(screen.getByRole('heading', { name: '평균을 살펴볼까요?', level: 1 })).toHaveAttribute('id', 'intro-heading');
    expect(screen.getByText('오늘의 질문')).toBeVisible();
    expect(screen.getByText('자료를 보고 평균을 예측해 보세요.')).toBeVisible();
    expect(section).toHaveClass('section-intro', 'section-intro-blue');
  });
});
