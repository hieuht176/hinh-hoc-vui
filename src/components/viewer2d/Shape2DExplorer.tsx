import { useRef, useState } from 'react'
import type { Shape2DDef } from '../../types'
import { ShapeGeometryG } from './ShapeSvg2D'
import MeasureOverlay from './MeasureOverlay'
import VertexNames2D from './VertexNames2D'
import PropertyOverlay, { availableLayers, propertyNotes, type PropertyLayer } from './PropertyOverlay'
import ParamSlider from '../common/ParamSlider'
import StatBadge from '../common/StatBadge'
import InfoCard from '../common/InfoCard'
import StudyLayout, { Panel, Stage, STAGE_SVG } from '../common/StudyLayout'
import { getGeometry2D, PX_PER_CM } from '../../utils/render2d'

/** Furthest point of the shape from its centre, so it still fits while being rotated. */
function shapeRadius(def: Shape2DDef, params: Record<string, number>): number {
  const geo = getGeometry2D(def, params)
  if (geo.kind === 'circle') return geo.r
  if (geo.kind === 'ellipse') return Math.max(geo.rx, geo.ry)
  return Math.max(...geo.points.map(([x, y]) => Math.hypot(x, y)))
}

const LAYER_LABELS: Record<PropertyLayer, string> = {
  sides: '〃 Cạnh bằng nhau',
  angles: '∠ Góc',
  diagonals: '╲ Đường chéo',
  height: '⊥ Đường cao',
  axes: '┊ Trục đối xứng',
  parts: '⭕ Các thành phần',
}

function ToggleChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm transition hover:scale-105 active:scale-95 ${
        on ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function Shape2DExplorer({ def }: { def: Shape2DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })
  const [rotation, setRotation] = useState(0)
  const [showMeasures, setShowMeasures] = useState(false)
  const [showNames, setShowNames] = useState(false)
  const [layers, setLayers] = useState<Set<PropertyLayer>>(new Set())
  const toggleLayer = (l: PropertyLayer) =>
    setLayers((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })
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
  // Zoom the picture so the shape fills the stage; the 1 cm grid behind it still shows how big it really is.
  // A little extra margin when the length labels are on, so the numbers outside the sides are not cut off.
  const view = Math.max(shapeRadius(def, params) * (showMeasures || layers.size > 0 ? 2.7 : 2.3), PX_PER_CM * 5)
  const half = view / 2
  const gridLines: number[] = []
  for (let v = Math.ceil(-half / PX_PER_CM) * PX_PER_CM; v <= half; v += PX_PER_CM) gridLines.push(v)
  const perimeter = def.perimeter(params)
  const available = availableLayers(def, params)
  const notes = propertyNotes(def, params, layers)

  return (
    <StudyLayout
      visual={
        <>
          <Stage
            hint="Mỗi ô vuông nhỏ là 1 cm · Kéo vào hình để xoay"
          >
            <svg
              ref={svgRef}
              viewBox={`${-half} ${-half} ${view} ${view}`}
              className={`${STAGE_SVG} cursor-grab active:cursor-grabbing`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {gridLines.map((v) => (
                <g key={v} stroke={v === 0 ? "#cbd5e1" : "#e2e8f0"} strokeWidth={1} vectorEffect="non-scaling-stroke">
                  <line x1={v} y1={-half} x2={v} y2={half} vectorEffect="non-scaling-stroke" />
                  <line x1={-half} y1={v} x2={half} y2={v} vectorEffect="non-scaling-stroke" />
                </g>
              ))}
              <g transform={`rotate(${rotation})`}>
                <ShapeGeometryG def={def} params={params} fill={def.color} strokeWidth={view / 160} />
              </g>
              {layers.size > 0 && (
                <PropertyOverlay def={def} params={params} rotation={rotation} view={view} layers={layers} showLengths={showMeasures} />
              )}
              {showMeasures && (
                <MeasureOverlay def={def} params={params} rotation={rotation} view={view} hideCenterLabel={layers.has('parts') || showNames} />
              )}
              {showNames && <VertexNames2D def={def} params={params} rotation={rotation} view={view} showCentre={!layers.has('parts')} />}
            </svg>
          </Stage>
          <div className="flex flex-wrap justify-center gap-2">
            <ToggleChip on={showNames} onClick={() => setShowNames((v) => !v)}>
              🔤 {def.kind === 'polygon' ? 'Tên đỉnh' : 'Tên tâm O'}
            </ToggleChip>
            <ToggleChip on={showMeasures} onClick={() => setShowMeasures((v) => !v)}>
              📏 {def.kind === 'circle' ? 'Đường kính, bán kính' : def.kind === 'ellipse' ? 'Bán trục' : 'Số đo cạnh'}
            </ToggleChip>
            {available.map((l) => (
              <ToggleChip key={l} on={layers.has(l)} onClick={() => toggleLayer(l)}>
                {LAYER_LABELS[l]}
              </ToggleChip>
            ))}
            <button
              onClick={() => {
                const all = showMeasures && available.every((l) => layers.has(l))
                setShowMeasures(!all)
                setLayers(all ? new Set() : new Set(available))
              }}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              {showMeasures && available.every((l) => layers.has(l)) ? '✕ Ẩn tất cả' : '✨ Hiện tất cả'}
            </button>
            <button
              onClick={() => setRotation((r) => r + 45)}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              ↻ Xoay 45°
            </button>
          </div>
          {notes.length > 0 && (
            <ul className="w-full space-y-1.5 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: n.color }} />
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      }
      side={
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatBadge label="Diện tích" value={area} unit="cm²" />
            <StatBadge label="Chu vi" value={perimeter} unit="cm" />
          </div>
          <Panel title="Thay đổi kích thước">
            <div className="space-y-3">
              {def.params.map((pd) => (
                <ParamSlider key={pd.key} def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
              ))}
            </div>
          </Panel>
          <InfoCard description={def.description} properties={def.properties} formulas={def.formulas} />
        </>
      }
    />
  )
}
