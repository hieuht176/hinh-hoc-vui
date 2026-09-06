import { useRef, useState } from 'react'
import type { Shape2DDef } from '../../types'
import { ShapeGeometryG } from './ShapeSvg2D'
import ParamSlider from '../common/ParamSlider'
import StatBadge from '../common/StatBadge'
import InfoCard from '../common/InfoCard'

const SIZE = 320

export default function Shape2DExplorer({ def }: { def: Shape2DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })
  const [rotation, setRotation] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<{ startAngle: number; startRotation: number } | null>(null)

  const angleAt = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = { startAngle: angleAt(e.clientX, e.clientY), startRotation: rotation }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const delta = angleAt(e.clientX, e.clientY) - dragging.current.startAngle
    setRotation(dragging.current.startRotation + delta)
  }
  const onPointerUp = () => {
    dragging.current = null
  }

  const area = def.area(params)
  const perimeter = def.perimeter(params)

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <svg
            ref={svgRef}
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <g transform={`translate(${SIZE / 2} ${SIZE / 2}) rotate(${rotation})`}>
              <ShapeGeometryG def={def} params={params} fill={def.color} strokeWidth={2} />
            </g>
          </svg>
        </div>
        <p className="text-xs text-slate-400">Kéo chuột / chạm vào hình để xoay 360°</p>
        <button
          onClick={() => setRotation((r) => r + 45)}
          className="rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
        >
          Xoay nhanh 45°
        </button>
        <div className="grid w-full grid-cols-2 gap-3">
          <StatBadge label="Diện tích" value={area} unit="cm²" />
          <StatBadge label="Chu vi" value={perimeter} unit="cm" />
        </div>
        <div className="w-full space-y-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          {def.params.map((pd) => (
            <ParamSlider key={pd.key} def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
          ))}
        </div>
      </div>
      <InfoCard description={def.description} properties={def.properties} formulas={def.formulas} />
    </div>
  )
}
