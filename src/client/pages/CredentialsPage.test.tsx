import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CredentialsPage from './CredentialsPage.js'

const MASKED_RESPONSE = {
  ATLASSIAN_BASE_URL: 'https://example.atlassian.net',
  ATLASSIAN_EMAIL: 'user@example.com',
  ATLASSIAN_API_TOKEN: 'ATAT••••••••••••',
  ANTHROPIC_API_KEY: 'sk-a••••••••••••',
  STARK_ENDPOINT: '',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

function mockFetch(getResponse: object, putResponse?: object) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    if (!opts || opts.method !== 'PUT') {
      return Promise.resolve({ ok: true, json: async () => getResponse })
    }
    return Promise.resolve({
      ok: putResponse ? true : false,
      status: putResponse ? 200 : 422,
      json: async () => putResponse ?? { ok: false, validation: { jira: { ok: false, error: 'unauthorized', message: '401' }, anthropic: { ok: true } } },
    })
  }))
}

describe('CredentialsPage', () => {
  beforeEach(() => mockFetch(MASKED_RESPONSE))
  afterEach(() => vi.restoreAllMocks())

  it('AC-1: renders all five form fields after load', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByTestId('field-ATLASSIAN_BASE_URL')).toBeInTheDocument()
      expect(screen.getByTestId('field-ATLASSIAN_EMAIL')).toBeInTheDocument()
      expect(screen.getByTestId('field-ATLASSIAN_API_TOKEN')).toBeInTheDocument()
      expect(screen.getByTestId('field-ANTHROPIC_API_KEY')).toBeInTheDocument()
      expect(screen.getByTestId('field-STARK_ENDPOINT')).toBeInTheDocument()
    })
  })

  it('AC-1: token fields show masked values with bullet characters', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      const tokenField = screen.getByTestId('field-ATLASSIAN_API_TOKEN') as HTMLInputElement
      expect(tokenField.value).toContain('•')
    })
  })

  it('handleChange: updates field value on user input', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByTestId('field-ATLASSIAN_BASE_URL'))
    fireEvent.change(screen.getByTestId('field-ATLASSIAN_BASE_URL'), { target: { value: 'https://new.atlassian.net' } })
    expect((screen.getByTestId('field-ATLASSIAN_BASE_URL') as HTMLInputElement).value).toBe('https://new.atlassian.net')
  })

  it('handleReset: resets field to saved value', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByTestId('field-ATLASSIAN_BASE_URL'))
    fireEvent.change(screen.getByTestId('field-ATLASSIAN_BASE_URL'), { target: { value: 'https://changed.url' } })
    fireEvent.click(screen.getByTestId('reset-ATLASSIAN_BASE_URL'))
    expect((screen.getByTestId('field-ATLASSIAN_BASE_URL') as HTMLInputElement).value).toBe('https://example.atlassian.net')
  })

  it('handleSubmit + mutation success: shows toast on successful save', async () => {
    mockFetch(MASKED_RESPONSE, { ok: true, validation: { jira: { ok: true, latencyMs: 100 }, anthropic: { ok: true, latencyMs: 100 } } })
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByTestId('save-button'))
    fireEvent.click(screen.getByTestId('save-button'))
    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent('Credentials saved')
    })
  })

  it('mutation failure: validation badges show failed state', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByTestId('save-button'))
    fireEvent.click(screen.getByTestId('save-button'))
    await waitFor(() => {
      expect(screen.getByTestId('validation-badge-jira')).toHaveTextContent('Invalid')
    })
  })

  it('renders save button and badges', async () => {
    render(<CredentialsPage />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
      expect(screen.getByTestId('validation-badge-jira')).toBeInTheDocument()
      expect(screen.getByTestId('validation-badge-anthropic')).toBeInTheDocument()
    })
  })
})
