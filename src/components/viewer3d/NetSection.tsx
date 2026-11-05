import { useState } from 'react'
import type { Shape3DDef } from '../../types'
import { getNet2D, ANIMATED_FOLD_IDS, NET_SUPPORTED_IDS } from '../../data/nets2d'
import Net2DDiagram from './Net2DDiagram'
import FoldingNet3D from './FoldingNet3D'
import ParamSlider from '../common/ParamSlider'
import StatBadge from '../common/StatBadge'
import StudyLayout, { Panel, Stage } from '../common/StudyLayout'

export default function NetSection({ def }: { def: Shape3DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })
  const isAnimated = ANIMATED_FOLD_IDS.includes(def.id)
  const [view, setView] = useState<'net' | 'fold'>('net')

  if (def.id === 'sphere') {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-6 text-center text-base text-slate-600">
        Mặt cầu là mặt cong khép kín nên <strong>không thể trải phẳng</strong> mà không bị rách hoặc méo (giống việc bạn không thể bọc một quả
        bóng bằng một tờ giấy phẳng mà không cắt/nhăn). Vì vậy hình cầu không có hình khai triển.
      </div>
    )
  }

  if (!NET_SUPPORTED_IDS.includes(def.id)) return null

  const parts = getNet2D(def.id, params)
  const showFold = isAnimated && view === 'fold'

  return (
    <StudyLayout
      visual={
        <>
          {isAnimated && (
            <div className="flex gap-1 self-stretch rounded-xl bg-slate-100 p-1 sm:self-center">
              {(
                [
                  ['net', '🧩 Hình khai triển'],
                  ['fold', '📦 Gấp thành khối'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    view === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {showFold ? (
            <FoldingNet3D shapeId={def.id} params={params} color={def.color} />
          ) : (
            <Stage hint="Trải phẳng tất cả các mặt của khối ra một tờ giấy">
              <Net2DDiagram parts={parts} color={def.color} />
            </Stage>
          )}
        </>
      }
      side={
        <>
          <StatBadge label="Tổng diện tích các mặt = diện tích toàn phần" value={def.surfaceArea(params)} unit="cm²" />
          <Panel title="Thay đổi kích thước">
            <div className="space-y-3">
              {def.params.map((pd) => (
                <ParamSlider key={pd.key} def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
              ))}
            </div>
          </Panel>
          {(def.id === 'cylinder' || def.id === 'cone') && (
            <p className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-4 text-sm leading-relaxed text-slate-500">
              Mặt xung quanh của khối này là mặt cong nên không "gấp bản lề" được như hộp giấy. Xem khối 3D ở thẻ <b>Khối 3D</b> phía trên.
            </p>
          )}
        </>
      }
    />
  )
}
