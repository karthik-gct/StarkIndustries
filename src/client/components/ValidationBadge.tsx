export type ValidationState = 'idle' | 'pending' | 'ok' | 'failed' | 'unreachable'

interface ValidationBadgeProps {
  service: string
  state: ValidationState
  message?: string
}

const styles: Record<ValidationState, string> = {
  idle: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  ok: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  unreachable: 'bg-orange-100 text-orange-700',
}

const labels: Record<ValidationState, string> = {
  idle: 'Not validated',
  pending: 'Validating…',
  ok: 'Validated',
  failed: 'Invalid',
  unreachable: 'Unreachable',
}

export function ValidationBadge({ service, state, message }: ValidationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${styles[state]}`}
      aria-label={`${service}: ${labels[state]}${message ? ` — ${message}` : ''}`}
      data-testid={`validation-badge-${service.toLowerCase()}`}
    >
      {service}: {labels[state]}
      {message && state !== 'ok' && (
        <span className="ml-1 opacity-80">— {message}</span>
      )}
    </span>
  )
}
