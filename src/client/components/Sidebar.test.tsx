import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar.js';

describe('Sidebar', () => {
  it('AC-2: renders all 5 navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByText('Credentials')).toBeInTheDocument();
    expect(screen.getByText('Model Routing')).toBeInTheDocument();
    expect(screen.getByText('Agent Limits')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('MCP Config')).toBeInTheDocument();
  });

  it('AC-2: nav has correct ARIA label', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });
});
