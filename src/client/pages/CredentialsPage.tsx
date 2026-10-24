import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CredentialField } from '../components/CredentialField.js'
import { ValidationBadge, type ValidationState } from '../components/ValidationBadge.js'

type CredentialKey =
  | 'ATLASSIAN_BASE_URL'
  | 'ATLASSIAN_EMAIL'
  | 'ATLASSIAN_API_TOKEN'
  | 'ANTHROPIC_API_KEY'
  | 'STARK_ENDPOINT'

type FormValues = Record<CredentialKey, string>

const EMPTY: FormValues = {
  ATLASSIAN_BASE_URL: '',
  ATLASSIAN_EMAIL: '',
  ATLASSIAN_API_TOKEN: '',
  ANTHROPIC_API_KEY: '',
  STARK_ENDPOINT: '',
}

const FIELDS: Array<{ id: CredentialKey; label: string; isSecret?: boolean; optional?: boolean }> = [
  { id: 'ATLASSIAN_BASE_URL', label: 'Atlassian Base URL' },
  { id: 'ATLASSIAN_EMAIL', label: 'Atlassian Email' },
  { id: 'ATLASSIAN_API_TOKEN', label: 'Atlassian API Token', isSecret: true },
  { id: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', isSecret: true },
  { id: 'STARK_ENDPOINT', label: 'STARK Endpoint', optional: true },
]

interface ValidationResult {
  ok: boolean
  error?: string
  message?: string
  latencyMs?: number
}

interface PutResponse {
  ok: boolean
  validation: { jira: ValidationResult; anthropic: ValidationResult }
}

export default function CredentialsPage() {
  const queryClient = useQueryClient()
  const [formValues, setFormValues] = useState<FormValues>(EMPTY)
  const [savedValues, setSavedValues] = useState<FormValues>(EMPTY)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [jiraState, setJiraState] = useState<ValidationState>('idle')
  const [anthropicState, setAnthropicState] = useState<ValidationState>('idle')
  const [jiraMessage, setJiraMessage] = useState<string | undefined>()
  const [anthropicMessage, setAnthropicMessage] = useState<string | undefined>()

  const { isLoading, data: serverValues } = useQuery<FormValues>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const res = await fetch('/api/config/credentials')
      if (!res.ok) throw new Error('Failed to load credentials')
      return res.json() as Promise<FormValues>
    },
  })

  useEffect(() => {
    if (serverValues) {
      setFormValues(serverValues)
      setSavedValues(serverValues)
    }
  }, [serverValues])

  const mutation = useMutation<PutResponse, Error, FormValues>({
    mutationFn: async (values) => {
      const res = await fetch('/api/config/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json() as PutResponse
      if (!res.ok && res.status !== 422) throw new Error('Save failed')
      return data
    },
    onMutate: () => {
      setJiraState('pending')
      setAnthropicState('pending')
    },
    onSuccess: (data) => {
      setJiraState(data.validation.jira.ok ? 'ok' : data.validation.jira.error === 'unreachable' ? 'unreachable' : 'failed')
      setAnthropicState(data.validation.anthropic.ok ? 'ok' : data.validation.anthropic.error === 'unreachable' ? 'unreachable' : 'failed')
      setJiraMessage(data.validation.jira.message)
      setAnthropicMessage(data.validation.anthropic.message)

      if (data.ok) {
        setToast({ type: 'success', message: 'Credentials saved' })
        queryClient.invalidateQueries({ queryKey: ['credentials'] })
        setTimeout(() => setToast(null), 3000)
      }
    },
    onError: () => {
      setJiraState('idle')
      setAnthropicState('idle')
      setToast({ type: 'error', message: 'Save failed — please try again' })
      setTimeout(() => setToast(null), 4000)
    },
  })

  function handleChange(key: CredentialKey, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleReset(key: CredentialKey) {
    setFormValues((prev) => ({ ...prev, [key]: savedValues[key] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(formValues)
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading credentials…</div>
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold mb-2">Credentials</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage API tokens and endpoints. Credentials are validated live before saving.
      </p>

      {toast && (
        <div
          className={`mb-4 rounded px-4 py-2 text-sm ${
            toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
          role="status"
          data-testid="toast"
        >
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="credentials-form">
        {FIELDS.map((field) => (
          <CredentialField
            key={field.id}
            id={field.id}
            label={field.label}
            value={formValues[field.id]}
            isSecret={field.isSecret}
            optional={field.optional}
            onChange={handleChange}
            onReset={handleReset}
          />
        ))}

        <div className="flex flex-wrap gap-2 mb-6">
          <ValidationBadge service="Jira" state={jiraState} message={jiraMessage} />
          <ValidationBadge service="Anthropic" state={anthropicState} message={anthropicMessage} />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          data-testid="save-button"
        >
          {mutation.isPending ? 'Validating…' : 'Validate & Save'}
        </button>
      </form>
    </div>
  )
}
