import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StarkWarningBanner from './StarkWarningBanner.js';

describe('StarkWarningBanner', () => {
  // AC-6: banner shows when show=true but does not block anything
  it('AC-6: renders warning text when show=true', () => {
    render(<StarkWarningBanner show={true} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/STARK_ENDPOINT/)).toBeInTheDocument();
  });

  it('renders nothing when show=false', () => {
    const { container } = render(<StarkWarningBanner show={false} />);
    expect(container.firstChild).toBeNull();
  });
});
