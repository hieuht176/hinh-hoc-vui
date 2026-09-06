import { useState } from 'react'
import type { Shape3DDef } from '../../types'
import { getNet2D, ANIMATED_FOLD_IDS, NET_SUPPORTED_IDS } from '../../data/nets2d'
import Net2DDiagram from './Net2DDiagram'
import FoldingNet3D from './FoldingNet3D'
import ParamSlider from '../common/ParamSlider'

export default function NetSection({ def }: { def: Shape3DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })

  if (def.id === 'sphere') {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-6 text-center text-sm text-slate-500">
        Mặt cầu là mặt cong khép kín nên <strong>không thể trải phẳng</strong> mà không bị rách hoặc méo (giống việc bạn không thể bọc một quả
        bóng bằng một tờ giấy phẳng mà không cắt/nhăn). Vì vậy hình cầu không có hình khai triển.
      </div>
    )
  }

  if (!NET_SUPPORTED_IDS.includes(def.id)) return null

  const parts = getNet2D(def.id, params)
  const isAnimated = ANIMATED_FOLD_IDS.includes(def.id)

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
        {def.params.map((pd) => (
          <div key={pd.key} className="w-48">
            <ParamSlider def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-500">
          {isAnimated ? 'Gấp / mở khối (kéo thanh trượt)' : 'Khối 3D'}
        </h3>
        {isAnimated ? (
          <FoldingNet3D shapeId={def.id} params={params} color={def.color} />
        ) : (
          <div className="flex h-[360px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-6 text-center text-sm text-slate-500">
            <span>Mặt xung quanh của khối này là mặt cong nên không thể "gấp bản lề" trực tiếp.</span>
            <span>Xem khối 3D xoay 360° ở tab bên cạnh — hình khai triển tương ứng ở bên phải.</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-500">Hình khai triển (net)</h3>
        <div className="flex justify-center rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <Net2DDiagram parts={parts} color={def.color} />
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          Tổng diện tích các mặt trải phẳng = diện tích toàn phần = {def.surfaceArea(params).toFixed(2)} cm²
        </p>
        </div>
      </div>
    </div>
  )
}
