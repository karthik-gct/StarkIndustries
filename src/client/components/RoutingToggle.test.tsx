import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoutingToggle from './RoutingToggle.js';

describe('RoutingToggle', () => {
  it('displays DIRECT when value is direct', () => {
    render(<RoutingToggle value="direct" onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('displays STARK when value is stark', () => {
    render(<RoutingToggle value="stark" onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with stark when clicked from direct', async () => {
    const onChange = vi.fn();
    render(<RoutingToggle value="direct" onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith('stark');
  });

  it('calls onChange with direct when clicked from stark', async () => {
    const onChange = vi.fn();
    render(<RoutingToggle value="stark" onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith('direct');
  });
});
