import { useEffect, useRef, useState } from 'react'
import CoordinatePlane, { PLANE_SCALE, worldToPx, pxToWorld } from '../components/common/CoordinatePlane'
import { POINT_SHAPES, pointShapesMap, VERTEX_LABELS, type PointShapeDef } from '../data/pointShapes'
import { TRANSFORM_INFO } from '../data/transformInfo'
import {
  applyTransform,
  applyTransformEased,
  easeInOutCubic,
  defaultTransformParams,
  type TransformParams,
  type TransformType,
} from '../utils/transform2d'
import { pointsToPath } from '../utils/polygon'
import InfoCard from '../components/common/InfoCard'

const TYPES: { id: TransformType; label: string; emoji: string; blurb: string }[] = [
  { id: 'translate', label: 'Phép tịnh tiến', emoji: '➡️', blurb: 'Đẩy cả hình sang một hướng, không xoay, không đổi dạng.' },
  { id: 'rotate', label: 'Phép quay', emoji: '🔄', blurb: 'Xoay hình quanh một điểm, giống kim đồng hồ.' },
  { id: 'point-symmetry', label: 'Lật qua điểm', emoji: '📍', blurb: 'Hình "nhảy" sang phía đối diện của một điểm.' },
  { id: 'axis-symmetry', label: 'Phép đối xứng', emoji: '🪞', blurb: 'Soi gương! Ảnh hiện ra ở phía bên kia đường thẳng.' },
  {
    id: 'rotational-symmetry',
    label: 'Phép đối xứng quay',
    emoji: '🌀',
    blurb: 'Quay hình quanh chính tâm của nó — xem hình có "trùng khít" lên chính mình không!',
  },
]

export default function TransformPage() {
  const [shapeId, setShapeId] = useState('triangle')
  const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: -3, y: 1.5 })
  const [type, setType] = useState<TransformType>('translate')
  const [params, setParams] = useState<TransformParams>(defaultTransformParams)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [animT, setAnimT] = useState<number | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<null | { kind: 'shape'; offX: number; offY: number } | { kind: 'center' }>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const def = pointShapesMap[shapeId]

  const clientToWorld = (clientX: number, clientY: number): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    return pxToWorld(clientX - rect.left, clientY - rect.top)
  }

  const preImagePoints: [number, number][] =
    def.kind === 'polygon' ? def.localPoints!.map(([x, y]) => [x + anchor.x, y + anchor.y]) : [[anchor.x, anchor.y]]

  // Rotational-symmetry checks are always about the shape's own centre — it isn't a free,
  // draggable point like the "Quay hình" centre, it just tracks wherever the shape currently is.
  const effectiveParams: TransformParams =
    type === 'rotational-symmetry' ? { ...params, rotate: { ...params.rotate, cx: anchor.x, cy: anchor.y } } : params

  const imagePoints = preImagePoints.map((p) => applyTransform(type, p, effectiveParams))
  const displayPoints =
    animT !== null ? preImagePoints.map((p) => applyTransformEased(type, p, effectiveParams, animT)) : imagePoints

  const centerParam =
    type === 'rotate' ? params.rotate : type === 'point-symmetry' ? params['point-symmetry'] : null

  const rotSymOrder = def.rotationalOrder
  const rotSymIsMatch = !Number.isFinite(rotSymOrder)
    ? true
    : (() => {
        const base = 360 / rotSymOrder
        const angle = ((params.rotate.angleDeg % 360) + 360) % 360
        const mod = angle % base
        return mod < 0.6 || base - mod < 0.6
      })()

  const selectShape = (id: string) => {
    setShapeId(id)
    setAnimT(null)
  }

  const selectType = (t: TransformType) => {
    setType(t)
    setAnimT(null)
    // Rotating/flipping about the shape itself is the easiest first thing to understand —
    // default the center there; kids can still drag the purple dot elsewhere to explore.
    if (t === 'rotate') setParams((p) => ({ ...p, rotate: { ...p.rotate, cx: round1(anchor.x), cy: round1(anchor.y) } }))
    if (t === 'point-symmetry') setParams((p) => ({ ...p, 'point-symmetry': { cx: round1(anchor.x), cy: round1(anchor.y) } }))
    if (t === 'rotational-symmetry') setParams((p) => ({ ...p, rotate: { ...p.rotate, angleDeg: 0 } }))
  }

  const playAnimation = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const duration = 900
    const start = performance.now()
    const step = (now: number) => {
      const raw = Math.min(1, (now - start) / duration)
      setAnimT(easeInOutCubic(raw))
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        setTimeout(() => setAnimT(null), 500)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const onShapePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const [wx, wy] = clientToWorld(e.clientX, e.clientY)
    drag.current = { kind: 'shape', offX: wx - anchor.x, offY: wy - anchor.y }
  }

  const onCenterPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = { kind: 'center' }
  }

  const onPlanePointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const [wx, wy] = clientToWorld(e.clientX, e.clientY)
    if (drag.current.kind === 'shape') {
      setAnchor({ x: wx - drag.current.offX, y: wy - drag.current.offY })
    } else if (drag.current.kind === 'center') {
      if (type === 'rotate') setParams((p) => ({ ...p, rotate: { ...p.rotate, cx: round1(wx), cy: round1(wy) } }))
      else if (type === 'point-symmetry') setParams((p) => ({ ...p, 'point-symmetry': { cx: round1(wx), cy: round1(wy) } }))
    }
  }

  const onPlanePointerUp = () => {
    drag.current = null
  }

  const nudgeTranslate = (dx: number, dy: number) => {
    setAnimT(null)
    setParams((p) => ({
      ...p,
      translate: { dx: clamp(p.translate.dx + dx, -6, 6), dy: clamp(p.translate.dy + dy, -6, 6) },
    }))
  }

  const info = TRANSFORM_INFO[type]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Phép biến hình vui</h1>
      <p className="mt-2 text-slate-500">
        Chọn một hình, chọn một cách biến đổi, rồi bấm nút <span className="font-semibold text-indigo-600">▶ Xem hoạt hình</span> để xem
        hình di chuyển ngay trước mắt!
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
            <CoordinatePlane svgRef={svgRef} onPointerMove={onPlanePointerMove} onPointerUp={onPlanePointerUp} showNumbers={advancedOpen}>
              <ShapeOutline def={def} points={preImagePoints} stroke="#94a3b8" fill="none" dashed onPointerDown={onShapePointerDown} />
              {advancedOpen && <VertexLabels points={preImagePoints} prefix="" />}

              <ShapeOutline def={def} points={displayPoints} stroke="#1e293b" fill={def.color} onPointerDown={onShapePointerDown} />
              {advancedOpen && <VertexLabels points={displayPoints} prefix="'" />}

              {type === 'axis-symmetry' && <MirrorLine angleDeg={params['axis-symmetry'].axisAngleDeg} />}
              {centerParam && (
                <CenterMarker x={centerParam.cx} y={centerParam.cy} onPointerDown={onCenterPointerDown} />
              )}
              {type === 'rotational-symmetry' && <FixedCenterMarker x={anchor.x} y={anchor.y} />}
            </CoordinatePlane>
          </div>
          <p className="text-center text-xs text-slate-400">
            Hình mờ nét đứt: vị trí ban đầu (kéo được) — Hình màu: kết quả sau khi biến đổi
          </p>
          <button
            onClick={playAnimation}
            disabled={animT !== null}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
          >
            {animT !== null ? '✨ Đang chạy...' : '▶ Xem hoạt hình'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chọn hình</div>
            <div className="flex flex-wrap gap-2">
              {POINT_SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectShape(s.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition hover:scale-105 active:scale-95 ${
                    shapeId === s.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <PointShapeIcon def={s} light={shapeId === s.id} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cách biến đổi</div>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => selectType(t.id)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:scale-[1.02] active:scale-95 ${
                    type === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  } ${TYPES.length % 2 === 1 && i === TYPES.length - 1 ? 'col-span-2' : ''}`}
                >
                  <div className="text-base">
                    {t.emoji} {t.label}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{TYPES.find((t) => t.id === type)?.blurb}</p>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {type === 'translate' && (
                <div className="flex flex-col items-center gap-3">
                  <DPad onMove={nudgeTranslate} />
                  <p className="text-center text-sm font-medium text-indigo-600">{translateCaption(params.translate.dx, params.translate.dy)}</p>
                </div>
              )}

              {type === 'rotate' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => {
                          setAnimT(null)
                          setParams((p) => ({ ...p, rotate: { ...p.rotate, angleDeg: deg } }))
                        }}
                        className={`rounded-lg py-2 text-sm font-semibold transition hover:scale-105 active:scale-95 ${
                          params.rotate.angleDeg === deg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Quay {deg}°
                      </button>
                    ))}
                  </div>
                  <SliderRow
                    label="Quay tự do (°)"
                    value={params.rotate.angleDeg}
                    min={0}
                    max={360}
                    step={5}
                    onChange={(v) => {
                      setAnimT(null)
                      setParams((p) => ({ ...p, rotate: { ...p.rotate, angleDeg: v } }))
                    }}
                  />
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>🟣 Kéo chấm tím để đổi điểm quay I</span>
                    <button
                      onClick={() => setParams((p) => ({ ...p, rotate: { ...p.rotate, cx: round1(anchor.x), cy: round1(anchor.y) } }))}
                      className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-200"
                    >
                      Đưa tâm về hình
                    </button>
                  </div>
                </div>
              )}

              {type === 'point-symmetry' && (
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>🟣 Kéo chấm tím để chọn điểm lật I</span>
                  <button
                    onClick={() => setParams((p) => ({ ...p, 'point-symmetry': { cx: round1(anchor.x), cy: round1(anchor.y) } }))}
                    className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-200"
                  >
                    Đưa tâm về hình
                  </button>
                </div>
              )}

              {type === 'axis-symmetry' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['↔️ Trục ngang', 0],
                      ['↕️ Trục dọc', 90],
                      ['↗️ Gương chéo /', 45],
                      ['↘️ Gương chéo \\', 135],
                    ].map(([label, deg]) => (
                      <button
                        key={label as string}
                        onClick={() => {
                          setAnimT(null)
                          setParams((p) => ({ ...p, 'axis-symmetry': { axisAngleDeg: deg as number } }))
                        }}
                        className={`rounded-lg py-2 text-sm font-medium transition hover:scale-105 active:scale-95 ${
                          params['axis-symmetry'].axisAngleDeg === deg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <SliderRow
                    label="Nghiêng đường gương (°)"
                    value={params['axis-symmetry'].axisAngleDeg}
                    min={0}
                    max={180}
                    step={5}
                    onChange={(v) => {
                      setAnimT(null)
                      setParams((p) => ({ ...p, 'axis-symmetry': { axisAngleDeg: v } }))
                    }}
                  />
                </div>
              )}

              {type === 'rotational-symmetry' && (
                <div className="space-y-3">
                  {!Number.isFinite(rotSymOrder) ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-600">
                      🔵 Hình tròn luôn trùng khít ở <span className="font-semibold">mọi góc quay</span> — vì mọi điểm trên hình đều
                      cách tâm một khoảng bằng nhau!
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: rotSymOrder }, (_, k) => Math.round((k * 360) / rotSymOrder)).map((deg) => (
                          <button
                            key={deg}
                            onClick={() => {
                              setAnimT(null)
                              setParams((p) => ({ ...p, rotate: { ...p.rotate, angleDeg: deg } }))
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:scale-105 active:scale-95 ${
                              params.rotate.angleDeg === deg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                      <SliderRow
                        label="Tự chọn góc quay (°)"
                        value={params.rotate.angleDeg}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(v) => {
                          setAnimT(null)
                          setParams((p) => ({ ...p, rotate: { ...p.rotate, angleDeg: v } }))
                        }}
                      />
                    </>
                  )}
                  <p
                    className={`rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                      rotSymIsMatch ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rotSymIsMatch ? '✅ Trùng khít! Hình có đối xứng quay ở góc này.' : '↺ Chưa trùng khít — thử góc khác xem sao!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-indigo-200 bg-white/60 px-4 py-2.5 text-sm font-medium text-indigo-500 transition hover:bg-white"
          >
            <span>📐 Tọa độ &amp; công thức (dành cho ai muốn tìm hiểu thêm)</span>
            <span className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {advancedOpen && (
            <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-1 font-medium">Gốc</th>
                    <th className="pb-1 font-medium">Ảnh</th>
                  </tr>
                </thead>
                <tbody>
                  {preImagePoints.map((p, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1 font-mono text-slate-600">
                        {label(i)}({round1(p[0])}; {round1(p[1])})
                      </td>
                      <td className="py-1 font-mono font-semibold text-indigo-600">
                        {label(i)}'({round1(imagePoints[i][0])}; {round1(imagePoints[i][1])})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoCard description={info.description} properties={info.properties} formulas={[{ label: 'Công thức tọa độ', formula: info.formula(params) }]} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function translateCaption(dx: number, dy: number) {
  if (dx === 0 && dy === 0) return 'Bấm mũi tên để trượt hình nhé!'
  const parts: string[] = []
  if (dx > 0) parts.push(`sang phải ${dx} ô`)
  if (dx < 0) parts.push(`sang trái ${-dx} ô`)
  if (dy > 0) parts.push(`lên trên ${dy} ô`)
  if (dy < 0) parts.push(`xuống dưới ${-dy} ô`)
  return `Đã trượt: ${parts.join(', ')}`
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function DPad({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  const btn =
    'flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600 shadow-sm transition hover:scale-110 hover:bg-indigo-100 active:scale-95'
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
      <div />
      <button className={btn} onClick={() => onMove(0, 1)} aria-label="Lên">
        ↑
      </button>
      <div />
      <button className={btn} onClick={() => onMove(-1, 0)} aria-label="Trái">
        ←
      </button>
      <div className="flex items-center justify-center text-2xl">🧩</div>
      <button className={btn} onClick={() => onMove(1, 0)} aria-label="Phải">
        →
      </button>
      <div />
      <button className={btn} onClick={() => onMove(0, -1)} aria-label="Xuống">
        ↓
      </button>
      <div />
    </div>
  )
}

function label(i: number) {
  return VERTEX_LABELS[i] ?? `P${i}`
}
function round1(n: number) {
  return Math.round(n * 10) / 10
}

function SliderRow({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex justify-between text-slate-500">
        <span>{label}</span>
        <span className="font-mono font-semibold text-indigo-600">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-600" />
    </label>
  )
}

function PointShapeIcon({ def, light }: { def: PointShapeDef; light?: boolean }) {
  const stroke = light ? '#ffffff' : '#1e293b'
  if (def.kind === 'circle') {
    return (
      <svg width={16} height={16} viewBox="-1.6 -1.6 3.2 3.2">
        <circle cx={0} cy={0} r={1.3} fill={def.color} stroke={stroke} strokeWidth={0.25} />
      </svg>
    )
  }
  const pts = def.localPoints!
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const pad = 0.25
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  return (
    <svg width={16} height={16} viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} style={{ transform: 'scaleY(-1)' }}>
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={def.color} stroke={stroke} strokeWidth={0.25} strokeLinejoin="round" />
    </svg>
  )
}

function ShapeOutline({
  def,
  points,
  stroke,
  fill,
  dashed,
  onPointerDown,
}: {
  def: { kind: 'polygon' | 'circle'; radius?: number }
  points: [number, number][]
  stroke: string
  fill: string
  dashed?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
}) {
  if (def.kind === 'circle') {
    const [cx, cy] = worldToPx(points[0])
    const r = (def.radius ?? 1) * PLANE_SCALE
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={dashed ? '6 4' : undefined}
        fill={fill === 'none' ? 'transparent' : fill}
        fillOpacity={fill === 'none' ? 1 : 0.8}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
      />
    )
  }
  const px = points.map(worldToPx)
  return (
    <path
      d={pointsToPath(px)}
      stroke={stroke}
      strokeWidth={2}
      strokeDasharray={dashed ? '6 4' : undefined}
      fill={fill === 'none' ? 'transparent' : fill}
      fillOpacity={fill === 'none' ? 1 : 0.8}
      strokeLinejoin="round"
      className="cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
    />
  )
}

function VertexLabels({ points, prefix }: { points: [number, number][]; prefix: string }) {
  return (
    <>
      {points.map((p, i) => {
        const [px, py] = worldToPx(p)
        return (
          <text key={i} x={px + 8} y={py - 6} fontSize={12} fontWeight={600} fill="#334155" pointerEvents="none">
            {(VERTEX_LABELS[i] ?? `P${i}`) + prefix}
          </text>
        )
      })}
    </>
  )
}

function CenterMarker({ x, y, onPointerDown }: { x: number; y: number; onPointerDown: (e: React.PointerEvent) => void }) {
  const [px, py] = worldToPx([x, y])
  return (
    <g>
      <circle cx={px} cy={py} r={9} fill="#a855f7" fillOpacity={0.25} className="animate-pulse" pointerEvents="none" />
      <circle cx={px} cy={py} r={7} fill="#a855f7" stroke="white" strokeWidth={2} className="cursor-grab active:cursor-grabbing" onPointerDown={onPointerDown} />
      <text x={px + 12} y={py - 8} fontSize={13} fontWeight={700} fill="#a855f7">
        I
      </text>
    </g>
  )
}

/** Same visual role as CenterMarker, but not draggable — the rotational-symmetry centre always is the shape's own centre. */
function FixedCenterMarker({ x, y }: { x: number; y: number }) {
  const [px, py] = worldToPx([x, y])
  return <circle cx={px} cy={py} r={4} fill="#64748b" pointerEvents="none" />
}

function MirrorLine({ angleDeg }: { angleDeg: number }) {
  const rad = (angleDeg * Math.PI) / 180
  const len = 14
  const a: [number, number] = [-len * Math.cos(rad), -len * Math.sin(rad)]
  const b: [number, number] = [len * Math.cos(rad), len * Math.sin(rad)]
  const [x1, y1] = worldToPx(a)
  const [x2, y2] = worldToPx(b)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a855f7" strokeWidth={2} strokeDasharray="10 6" />
}
