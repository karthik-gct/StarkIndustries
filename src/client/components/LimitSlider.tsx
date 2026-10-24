interface LimitSliderProps {
  label: string
  description: string
  value: number
  min: number
  max: number
  step?: number
  error?: string
  onChange: (value: number) => void
}

export default function LimitSlider({ label, description, value, min, max, step = 1, error, onChange }: LimitSliderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={label} className="font-mono text-sm font-semibold text-gray-800">
          {label}
        </label>
        <span
          className="text-2xl font-bold text-indigo-600 w-12 text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <input
        id={label}
        type="range"
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Math.round(Number(e.target.value)))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {error && <p className="text-red-600 text-xs mt-1" role="alert">{error}</p>}
    </div>
  )
}
