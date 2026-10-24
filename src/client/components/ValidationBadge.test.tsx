import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValidationBadge } from './ValidationBadge.js'

describe('ValidationBadge', () => {
  it('shows "Not validated" in idle state', () => {
    render(<ValidationBadge service="Jira" state="idle" />)
    expect(screen.getByTestId('validation-badge-jira')).toHaveTextContent('Not validated')
  })

  it('shows "Validated" in ok state', () => {
    render(<ValidationBadge service="Jira" state="ok" />)
    expect(screen.getByTestId('validation-badge-jira')).toHaveTextContent('Validated')
  })

  it('shows "Invalid" with message in failed state', () => {
    render(<ValidationBadge service="Anthropic" state="failed" message="401 Unauthorized" />)
    const badge = screen.getByTestId('validation-badge-anthropic')
    expect(badge).toHaveTextContent('Invalid')
    expect(badge).toHaveTextContent('401 Unauthorized')
  })

  it('shows "Unreachable" in unreachable state', () => {
    render(<ValidationBadge service="Jira" state="unreachable" message="Request timed out" />)
    expect(screen.getByTestId('validation-badge-jira')).toHaveTextContent('Unreachable')
  })

  it('shows "Validating" in pending state', () => {
    render(<ValidationBadge service="Jira" state="pending" />)
    expect(screen.getByTestId('validation-badge-jira')).toHaveTextContent('Validating')
  })
})
