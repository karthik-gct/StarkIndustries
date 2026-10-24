import ModelSelect from './ModelSelect.js';
import { AGENT_LABELS } from '../constants/modelOptions.js';
import type { AgentModelConfig } from '../../server/types/modelsConfig.js';

interface Props {
  agentKey: string;
  config: AgentModelConfig;
  onChange: (key: string, modelId: string) => void;
}

export default function AgentRow({ agentKey, config, onChange }: Props) {
  const label = AGENT_LABELS[agentKey] ?? agentKey;
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-4 text-sm font-medium text-gray-800">{label}</td>
      <td className="py-2 pr-4">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{config.provider}</span>
      </td>
      <td className="py-2">
        <ModelSelect
          value={config.model_id}
          provider={config.provider}
          onChange={(modelId) => onChange(agentKey, modelId)}
        />
      </td>
    </tr>
  );
}
