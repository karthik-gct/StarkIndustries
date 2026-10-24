import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App.js';

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  it('AC-3: / redirects to /credentials', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Credentials' })).toBeInTheDocument();
  });

  it('AC-3: clicking Model Routing nav link renders ModelRoutingPage', async () => {
    renderApp('/credentials');
    await userEvent.click(screen.getByText('Model Routing'));
    expect(screen.getByRole('heading', { name: 'Model Routing' })).toBeInTheDocument();
  });

  it('AC-3: clicking Agent Limits nav link renders AgentLimitsPage', async () => {
    renderApp('/credentials');
    await userEvent.click(screen.getByText('Agent Limits'));
    expect(screen.getByRole('heading', { name: 'Agent Limits' })).toBeInTheDocument();
  });

  it('AC-5: unknown route renders "Page not found"', () => {
    renderApp('/does-not-exist');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
