import { useState } from 'react'
import type { Formula } from '../../types'

const TABS = [
  { id: 'formulas', label: '🧮 Công thức' },
  { id: 'description', label: '📖 Định nghĩa' },
  { id: 'properties', label: '⭐ Tính chất' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Definition / properties / formulas shown one at a time behind small tabs, so the panel stays compact. */
export default function InfoCard({
  description,
  properties,
  formulas,
}: {
  description: string
  properties: string[]
  formulas: Formula[]
}) {
  const [tab, setTab] = useState<TabId>('formulas')

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-1 pt-3 text-sm leading-relaxed text-slate-700">
        {tab === 'description' && <p>{description}</p>}
        {tab === 'properties' && (
          <ul className="list-disc space-y-1 pl-5">
            {properties.map((prop, i) => (
              <li key={i}>{prop}</li>
            ))}
          </ul>
        )}
        {tab === 'formulas' && (
          <div className="grid gap-2">
            {formulas.map((f) => (
              <div key={f.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-indigo-50 px-3 py-2">
                <span className="text-slate-600">{f.label}</span>
                <span className="font-mono font-semibold text-indigo-700">{f.formula}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
