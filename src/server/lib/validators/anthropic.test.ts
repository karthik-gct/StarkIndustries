import { describe, it, expect, vi, afterEach } from 'vitest'
import { validateAnthropicKey } from './anthropic.js'

afterEach(() => vi.restoreAllMocks())

describe('validateAnthropicKey', () => {
  it('returns ok:true when Anthropic responds 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    const result = await validateAnthropicKey('sk-ant-valid-key')
    expect(result.ok).toBe(true)
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('returns unauthorized when Anthropic responds 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const result = await validateAnthropicKey('sk-ant-bad-key')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unauthorized')
  })

  it('returns unreachable on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await validateAnthropicKey('sk-ant-key')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unreachable')
  })

  it('returns unreachable on AbortError (timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' })))
    const result = await validateAnthropicKey('sk-ant-key')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unreachable')
    expect(result.message).toMatch(/timed out/i)
  })
})
