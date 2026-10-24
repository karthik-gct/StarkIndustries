export interface JiraValidationResult {
  ok: boolean
  error?: 'unauthorized' | 'unreachable' | 'invalid_url'
  message?: string
  latencyMs?: number
}

export async function validateJiraCredentials(
  baseUrl: string,
  email: string,
  apiToken: string,
  timeoutMs = 5000
): Promise<JiraValidationResult> {
  let url: URL
  try {
    url = new URL('/rest/api/3/myself', baseUrl)
  } catch {
    return { ok: false, error: 'invalid_url', message: 'Invalid Atlassian Base URL' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64')
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
      signal: controller.signal,
    })
    const latencyMs = Date.now() - start

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'unauthorized', message: `${res.status} Unauthorized`, latencyMs }
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
