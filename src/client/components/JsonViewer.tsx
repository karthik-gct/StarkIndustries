import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

interface JsonViewerProps {
  content: string
}

export default function JsonViewer({ content }: JsonViewerProps) {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return (
      <pre
        tabIndex={0}
        role="region"
        aria-label="MCP server configuration (raw)"
        className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm font-mono"
      >
        {content}
      </pre>
    )
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="MCP server configuration"
      className="rounded overflow-auto bg-gray-950 p-2"
      style={{ pointerEvents: 'none', userSelect: 'text' }}
    >
      <JsonView
        data={parsed}
        shouldExpandNode={allExpanded}
        style={defaultStyles}
      />
    </div>
  )
}
