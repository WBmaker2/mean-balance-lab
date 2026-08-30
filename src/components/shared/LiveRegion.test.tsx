import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  afterEach(cleanup);

  it('does not render an empty status region', () => {
    render(<LiveRegion message="" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a non-empty status region for successful announcements', () => {
    render(<LiveRegion message="이동했어요." />);
    expect(screen.getByRole('status')).toHaveTextContent('이동했어요.');
  });
});
