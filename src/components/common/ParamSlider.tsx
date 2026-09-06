import type { ParamDef } from '../../types'

export default function ParamSlider({
  def,
  value,
  onChange,
}: {
  def: ParamDef
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex items-center justify-between text-slate-600">
        <span>{def.label}</span>
        <span className="font-mono font-semibold text-indigo-600">
          {value} {def.unit}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </label>
  )
}
