import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import McpConfigPage from './McpConfigPage.js'

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return { queryClient, ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>) }
}

describe('McpConfigPage', () => {
  it('AC-4: shows not-found message when found=false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ found: false })
    }) as unknown as typeof fetch

    const { container } = renderWithQuery(<McpConfigPage />)
    // text is split across <code> elements so check aggregate textContent
    await vi.waitFor(() => {
      expect(container.textContent).toMatch(/not found.*run.*setup\.sh/i)
    })
  })

  it('AC-5: Refresh button calls invalidateQueries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true, valid: true, truncated: false,
        content: '{"mcpServers":{}}',
        lastModified: new Date().toISOString()
      })
    }) as unknown as typeof fetch

    const { queryClient, findByRole } = renderWithQuery(<McpConfigPage />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const refreshBtn = await findByRole('button', { name: /refresh/i })
    fireEvent.click(refreshBtn)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mcp-config'] })
  })
})
