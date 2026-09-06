import type { Formula } from '../../types'

export default function InfoCard({
  description,
  properties,
  formulas,
}: {
  description: string
  properties: string[]
  formulas: Formula[]
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-500">Định nghĩa</h3>
        <p className="text-sm leading-relaxed text-slate-700">{description}</p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-500">Tính chất</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          {properties.map((prop, i) => (
            <li key={i}>{prop}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-500">Công thức</h3>
        <div className="grid gap-2">
          {formulas.map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
              <span className="text-sm text-slate-600">{f.label}</span>
              <span className="font-mono text-sm font-semibold text-indigo-700">{f.formula}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
