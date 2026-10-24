import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CredentialField } from './CredentialField.js'

const noop = () => {}

describe('CredentialField', () => {
  it('renders label and input', () => {
    render(<CredentialField id="ATLASSIAN_EMAIL" label="Email" value="test@example.com" onChange={noop} onReset={noop} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    render(<CredentialField id="ATLASSIAN_BASE_URL" label="URL" value="" onChange={onChange} onReset={noop} />)
    fireEvent.change(screen.getByTestId('field-ATLASSIAN_BASE_URL'), { target: { value: 'https://new.url' } })
    expect(onChange).toHaveBeenCalledWith('ATLASSIAN_BASE_URL', 'https://new.url')
  })

  it('calls onReset when reset button clicked', () => {
    const onReset = vi.fn()
    render(<CredentialField id="ATLASSIAN_EMAIL" label="Email" value="x@y.com" onChange={noop} onReset={onReset} />)
    fireEvent.click(screen.getByTestId('reset-ATLASSIAN_EMAIL'))
    expect(onReset).toHaveBeenCalledWith('ATLASSIAN_EMAIL')
  })

  it('shows password input for secret fields', () => {
    render(<CredentialField id="ATLASSIAN_API_TOKEN" label="Token" value="secret" isSecret onChange={noop} onReset={noop} />)
    expect(screen.getByTestId('field-ATLASSIAN_API_TOKEN')).toHaveAttribute('type', 'password')
  })

  it('toggles to text type when Show is clicked', () => {
    render(<CredentialField id="ATLASSIAN_API_TOKEN" label="Token" value="secret" isSecret onChange={noop} onReset={noop} />)
    const input = screen.getByTestId('field-ATLASSIAN_API_TOKEN')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByTestId('toggle-ATLASSIAN_API_TOKEN'))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByTestId('toggle-ATLASSIAN_API_TOKEN'))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('shows (optional) label when optional=true', () => {
    render(<CredentialField id="STARK_ENDPOINT" label="STARK Endpoint" value="" optional onChange={noop} onReset={noop} />)
    expect(screen.getByText('(optional)')).toBeInTheDocument()
  })
})
