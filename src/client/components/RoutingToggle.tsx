interface Props {
  value: 'direct' | 'stark';
  onChange: (val: 'direct' | 'stark') => void;
}

export default function RoutingToggle({ value, onChange }: Props) {
  const toggle = () => onChange(value === 'direct' ? 'stark' : 'direct');

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Routing Backend</span>
      <button
        role="switch"
        aria-checked={value === 'stark'}
        aria-label="Toggle routing backend between direct and stark"
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
        className={`relative inline-flex h-6 w-28 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          value === 'stark' ? 'bg-purple-600' : 'bg-blue-600'
        }`}
      >
        <span className="sr-only">{value === 'direct' ? 'Switch to STARK' : 'Switch to Direct'}</span>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
          {value === 'direct' ? 'DIRECT' : 'STARK'}
        </span>
      </button>
    </div>
  );
}
