import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import LimitSlider from '../components/LimitSlider.js'
import PendingDiff from '../components/PendingDiff.js'
import type { AgentLimitsConfig } from '../../shared/types/agentConfig.js'
import { AGENT_LIMITS_CONSTRAINTS } from '../../shared/types/agentConfig.js'

const DEFAULT_CONFIG: AgentLimitsConfig = {
  PROD_MAX_LOOPS: 3,
  DEV_MAX_LOOPS: 5,
  QA_MAX_LOOPS: 3,
  DEV_COVERAGE_THRESHOLD: 80,
  PROD_EVAL_THRESHOLD: 8,
}

async function fetchAgentLimits(): Promise<AgentLimitsConfig> {
  const res = await fetch('/api/config/agents')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function saveAgentLimits(data: AgentLimitsConfig): Promise<void> {
  const res = await fetch('/api/config/agents', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
}

export default function AgentLimitsPage() {
  const queryClient = useQueryClient()
  const { data: saved, isLoading, error: loadError } = useQuery({
    queryKey: ['agentLimits'],
    queryFn: fetchAgentLimits,
  })

  const [draft, setDraft] = useState<AgentLimitsConfig | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const current = draft ?? saved ?? DEFAULT_CONFIG
  const isDirty = saved !== undefined && JSON.stringify(saved) !== JSON.stringify(current)

  const validationErrors: Partial<Record<keyof AgentLimitsConfig, string>> = {}
  for (const [key, { min, max }] of Object.entries(AGENT_LIMITS_CONSTRAINTS)) {
    const k = key as keyof AgentLimitsConfig
    if (current[k] < min || current[k] > max) {
      validationErrors[k] = `Must be between ${min} and ${max}`
    }
  }
  const hasErrors = Object.keys(validationErrors).length > 0

  const mutation = useMutation({
    mutationFn: saveAgentLimits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentLimits'] })
      setDraft(null)
      setSaveError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  function handleChange(key: keyof AgentLimitsConfig, value: number) {
    setDraft(prev => ({ ...(prev ?? saved ?? DEFAULT_CONFIG), [key]: value }))
    setSaveSuccess(false)
  }

  function handleSave() {
    if (hasErrors || !isDirty) return
    mutation.mutate(current)
  }

  if (isLoading) return <div className="p-6 text-gray-500">Loading agent limits…</div>

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded bg-red-50 border border-red-300 p-4 text-red-700 text-sm" role="alert">
          {(loadError as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Agent Loop Limits</h1>
      <p className="text-sm text-gray-500 mb-6">
        Adjust how many times each agent loop iterates before escalating.
        Changes are written to <code className="font-mono text-xs bg-gray-100 px-1 rounded">Agents.md</code>.
      </p>

      {(Object.keys(AGENT_LIMITS_CONSTRAINTS) as Array<keyof AgentLimitsConfig>).map(key => (
        <LimitSlider
          key={key}
          label={AGENT_LIMITS_CONSTRAINTS[key].label}
          description={AGENT_LIMITS_CONSTRAINTS[key].description}
          value={current[key]}
          min={AGENT_LIMITS_CONSTRAINTS[key].min}
          max={AGENT_LIMITS_CONSTRAINTS[key].max}
          error={validationErrors[key]}
          onChange={val => handleChange(key, val)}
        />
      ))}

      {saved && <PendingDiff saved={saved} draft={current} />}

      {saveError && (
        <div className="mt-3 text-red-600 text-sm" role="alert">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="mt-3 text-green-600 text-sm" role="status">Saved successfully.</div>
      )}

      <button
        onClick={handleSave}
        disabled={!isDirty || hasErrors || mutation.isPending}
        className="mt-5 px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
      >
        {mutation.isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
