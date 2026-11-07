import { useState } from 'react'
import MultiAxisShapes from '../components/symmetry/MultiAxisShapes'
import GridPattern from '../components/symmetry/GridPattern'

const TABS = [
  { id: 'shapes', label: '🧩 Nhiều hình – nhiều trục', desc: 'Đặt nhiều hình lên lưới, bật cùng lúc nhiều trục gương và xem ảnh đối xứng hiện ra.' },
  { id: 'grid', label: '🟦 Lưới tô ô', desc: 'Tô ô vuông tạo hoạ tiết, đếm số trục đối xứng, đoán màu các ô có nhãn.' },
] as const

export default function SymmetryPatternPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('shapes')
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Hoạ tiết đối xứng</h1>
      <p className="mt-2 text-slate-500">{TABS.find((t) => t.id === tab)!.desc}</p>
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-2xl bg-indigo-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-500 hover:text-indigo-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{tab === 'shapes' ? <MultiAxisShapes /> : <GridPattern />}</div>
    </div>
  )
}
