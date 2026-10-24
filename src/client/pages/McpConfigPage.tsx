import { useQuery, useQueryClient } from '@tanstack/react-query'
import JsonViewer from '../components/JsonViewer.js'

interface McpConfigResponse {
  found: boolean
  valid?: boolean
  truncated?: boolean
  content?: string
  lastModified?: string
}

async function fetchMcpConfig(): Promise<McpConfigResponse> {
  const res = await fetch('/api/config/mcp')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function McpConfigPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['mcp-config'],
    queryFn: fetchMcpConfig
  })

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['mcp-config'] })
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">MCP Server Configuration</h1>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border"
        >
          Refresh
        </button>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {isError && (
        <p className="text-red-600">Failed to load configuration.</p>
      )}

      {data && !data.found && (
        <div className="rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          <code>.claude/settings.json</code> not found — run{' '}
          <code>setup.sh</code> to generate it.
        </div>
      )}

      {data?.found && !data.valid && (
        <div className="mb-3 rounded border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
          ⚠ File contains invalid JSON — showing raw content.
        </div>
      )}

      {data?.truncated && (
        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Showing first 100 KB of file.
        </div>
      )}

      {data?.found && data.content != null && (
        <>
          <JsonViewer content={data.content} />
          {data.lastModified && (
            <p className="mt-2 text-xs text-gray-500">
              Last modified: {new Date(data.lastModified).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  )
}
