import { useState } from 'react'
import AngleTypesExplorer from '../components/angles/AngleTypesExplorer'
import ProtractorTool from '../components/angles/ProtractorTool'
import CompassTool from '../components/angles/CompassTool'
import TriangleAngleSum from '../components/angles/TriangleAngleSum'
import ClockAngleTool from '../components/angles/ClockAngleTool'

const TABS = [
  { id: 'types', label: 'Các loại góc', emoji: '📐' },
  { id: 'clock', label: 'Góc trên mặt đồng hồ', emoji: '🕒' },
  { id: 'protractor', label: 'Đo & vẽ góc bằng thước đo độ', emoji: '📏' },
  { id: 'compass', label: 'Vẽ hình tròn bằng compa', emoji: '🧭' },
  { id: 'triangle', label: 'Tổng ba góc tam giác', emoji: '🔺' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AnglesPage() {
  const [tab, setTab] = useState<TabId>('types')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Góc & Compa</h1>
      <p className="mt-2 text-slate-500">Tìm hiểu các loại góc, tập đo và vẽ góc bằng thước đo độ, vẽ hình tròn bằng compa, và khám phá vì sao tổng ba góc trong một tam giác luôn bằng 180°.</p>

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
        {tab === 'types' && <AngleTypesExplorer />}
        {tab === 'clock' && <ClockAngleTool />}
        {tab === 'protractor' && <ProtractorTool />}
        {tab === 'compass' && <CompassTool />}
        {tab === 'triangle' && <TriangleAngleSum />}
      </div>
    </div>
  )
}
