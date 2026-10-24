export interface AnthropicValidationResult {
  ok: boolean
  error?: 'unauthorized' | 'unreachable' | 'invalid_key'
  message?: string
  latencyMs?: number
}

export async function validateAnthropicKey(
  apiKey: string,
  timeoutMs = 5000
): Promise<AnthropicValidationResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    // Use /v1/models — no tokens consumed, just auth check
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
    })
    const latencyMs = Date.now() - start

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'unauthorized', message: `${res.status} Invalid API key`, latencyMs }
    }
    if (!res.ok) {
      return { ok: false, error: 'unreachable', message: `HTTP ${res.status}`, latencyMs }
    }
    return { ok: true, latencyMs }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    const name = (err as Error).name
    if (name === 'AbortError') {
      return { ok: false, error: 'unreachable', message: 'Request timed out', latencyMs }
    }
    return { ok: false, error: 'unreachable', message: 'Network error', latencyMs }
  } finally {
    clearTimeout(timer)
  }
}
