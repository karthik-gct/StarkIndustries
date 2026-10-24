import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModelSelect from './ModelSelect.js';

describe('ModelSelect', () => {
  // AC-3: dropdown has at least 3 model options
  it('AC-3: renders at least three model options for anthropic provider', () => {
    render(<ModelSelect value="claude-sonnet-4-6" provider="anthropic" onChange={vi.fn()} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it('includes the three required model IDs', () => {
    render(<ModelSelect value="claude-sonnet-4-6" provider="anthropic" onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'claude-sonnet-4-6' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'claude-haiku-4-5-20251001' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'claude-opus-4-8' })).toBeInTheDocument();
  });

  it('includes custom model_id not in standard list', () => {
    render(<ModelSelect value="custom-model-xyz" provider="anthropic" onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'custom-model-xyz' })).toBeInTheDocument();
  });
});
