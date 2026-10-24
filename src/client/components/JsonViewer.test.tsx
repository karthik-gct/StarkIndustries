import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JsonViewer from './JsonViewer.js'

describe('JsonViewer', () => {
  it('AC-2: renders with pointer-events none — no interactive inputs', () => {
    const { container } = render(<JsonViewer content='{"key":"value"}' />)
    const inputs = container.querySelectorAll('input, textarea, [contenteditable="true"]')
    expect(inputs).toHaveLength(0)
  })

  it('has role=region with aria-label for accessibility', () => {
    render(<JsonViewer content='{"key":"value"}' />)
    expect(screen.getByRole('region', { name: /mcp server configuration/i })).toBeTruthy()
  })

  it('renders raw pre when JSON is invalid', () => {
    const { container } = render(<JsonViewer content='not valid json' />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.textContent).toContain('not valid json')
  })
})
