import { MODEL_OPTIONS_BY_PROVIDER, ANTHROPIC_MODELS } from '../constants/modelOptions.js';

interface Props {
  value: string;
  provider: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelect({ value, provider, onChange }: Props) {
  const options = MODEL_OPTIONS_BY_PROVIDER[provider] ?? ANTHROPIC_MODELS;
  // Include current value if not in the standard list (custom model_id in config)
  const allOptions = options.includes(value) ? options : [value, ...options];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Model for ${provider}`}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {allOptions.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}
