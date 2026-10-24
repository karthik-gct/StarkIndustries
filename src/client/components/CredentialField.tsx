import { useState } from 'react'

type CredentialKey =
  | 'ATLASSIAN_BASE_URL'
  | 'ATLASSIAN_EMAIL'
  | 'ATLASSIAN_API_TOKEN'
  | 'ANTHROPIC_API_KEY'
  | 'STARK_ENDPOINT'

interface CredentialFieldProps {
  id: CredentialKey
  label: string
  value: string
  isSecret?: boolean
  optional?: boolean
  onChange: (key: CredentialKey, value: string) => void
  onReset: (key: CredentialKey) => void
}

export function CredentialField({
  id,
  label,
  value,
  isSecret = false,
  optional = false,
  onChange,
  onReset,
}: CredentialFieldProps) {
  const [revealed, setRevealed] = useState(false)

  const inputType = isSecret && !revealed ? 'password' : 'text'

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="ml-1 text-gray-400 text-xs">(optional)</span>}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid={`field-${id}`}
          aria-label={label}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            data-testid={`toggle-${id}`}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onReset(id)}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          aria-label={`Reset ${label}`}
          data-testid={`reset-${id}`}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
