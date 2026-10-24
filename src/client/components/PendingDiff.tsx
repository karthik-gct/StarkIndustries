import type { AgentLimitsConfig } from '../../shared/types/agentConfig.js'

interface PendingDiffProps {
  saved: AgentLimitsConfig
  draft: AgentLimitsConfig
}

export default function PendingDiff({ saved, draft }: PendingDiffProps) {
  const changed = (Object.keys(saved) as Array<keyof AgentLimitsConfig>).filter(k => saved[k] !== draft[k])
  if (changed.length === 0) return null

  return (
    <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-700 mb-2">Pending changes:</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-amber-600">
            <th className="text-left py-1 font-mono">Field</th>
            <th className="text-right py-1">Before</th>
            <th className="text-right py-1">After</th>
          </tr>
        </thead>
        <tbody>
          {changed.map(k => (
            <tr key={k} className="border-t border-amber-200">
              <td className="font-mono text-gray-700 py-1">{k}</td>
              <td className="text-right text-red-600 py-1">{saved[k]}</td>
              <td className="text-right text-green-600 py-1">{draft[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
