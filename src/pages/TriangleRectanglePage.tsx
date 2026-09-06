import { useState } from 'react'
import HalfSplitDemo from '../components/triangleRect/HalfSplitDemo'
import SlidingApexDemo from '../components/triangleRect/SlidingApexDemo'

const TABS = [
  { id: 'half', label: 'Tách đôi hình chữ nhật', emoji: '✂️' },
  { id: 'sliding', label: 'Tam giác bất kỳ', emoji: '🔺' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function TriangleRectanglePage() {
  const [tab, setTab] = useState<TabId>('half')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Tam giác & Hình chữ nhật</h1>
      <p className="mt-2 text-slate-500">
        Khám phá vì sao diện tích tam giác luôn bằng một nửa diện tích hình chữ nhật có cùng đáy và chiều cao.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition hover:scale-105 active:scale-95 ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-white/60 p-5 shadow-sm">
        {tab === 'half' && <HalfSplitDemo />}
        {tab === 'sliding' && <SlidingApexDemo />}
      </div>
    </div>
  )
}
