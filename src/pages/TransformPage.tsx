import { useEffect, useRef, useState } from 'react'
import CoordinatePlane, { PLANE_SCALE, PLANE_SIZE, worldToPx, pxToWorld } from '../components/common/CoordinatePlane'
import { clientToSvg } from '../utils/svgPoint'
import { POINT_SHAPES, pointShapesMap, VERTEX_LABELS, type PatternPart, type PointShapeDef } from '../data/pointShapes'
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

/** One-line explanation shown under the "đường dóng" button for each transformation. */
const GUIDE_NOTE: Record<TransformType, string> = {
  translate: 'Các mũi tên nối mỗi đỉnh với đỉnh mới đều song song và dài bằng nhau.',
  rotate: "Mỗi đỉnh quay quanh tâm I: IM = IM' và mọi đỉnh quay cùng một góc.",
  'point-symmetry': 'Đường nối mỗi đỉnh với đỉnh đối xứng đi qua tâm I, và I là trung điểm của đoạn đó.',
  'axis-symmetry': 'Đường nối mỗi đỉnh với đỉnh đối xứng vuông góc với trục, và trục cắt đoạn đó tại trung điểm.',
  'rotational-symmetry': 'Mỗi đỉnh quay quanh tâm của hình, khoảng cách tới tâm không đổi.',
}

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
  const [showLengths, setShowLengths] = useState(false)
  const [showCoords, setShowCoords] = useState(false)
  const [showGuides, setShowGuides] = useState(false)
  const [showAxes, setShowAxes] = useState(true)
  const [showNames, setShowNames] = useState(true)
  /** Rotational symmetry turning direction: 1 = anticlockwise (positive angle), -1 = clockwise. */
  const [rotDir, setRotDir] = useState<1 | -1>(1)
  const [shapeScale, setShapeScale] = useState(1.4)
  const [animT, setAnimT] = useState<number | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<null | { kind: 'shape'; offX: number; offY: number } | { kind: 'center' }>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const baseDef = pointShapesMap[shapeId]
  // "Cỡ hình" slider: the same shape, drawn bigger or smaller.
  const def: PointShapeDef = {
    ...baseDef,
    localPoints: baseDef.localPoints?.map(([x, y]) => [x * shapeScale, y * shapeScale] as [number, number]),
    radius: baseDef.radius !== undefined ? baseDef.radius * shapeScale : undefined,
    parts: baseDef.parts?.map((p) =>
      p.kind === 'circle'
        ? { ...p, c: [p.c[0] * shapeScale, p.c[1] * shapeScale] as [number, number], r: p.r * shapeScale }
        : { ...p, points: p.points.map(([x, y]) => [x * shapeScale, y * shapeScale] as [number, number]) },
    ),
  }
  /** Where a local point of the shape ends up: on the original (translated to the anchor) or on the image. */
  const toWorld = ([x, y]: [number, number]): [number, number] => [x + anchor.x, y + anchor.y]
  const toImage = (p: [number, number]): [number, number] =>
    animT !== null ? applyTransformEased(type, toWorld(p), effectiveParams, animT) : applyTransform(type, toWorld(p), effectiveParams)

  const clientToWorld = (clientX: number, clientY: number): [number, number] => {
    const [px, py] = clientToSvg(svgRef.current!, clientX, clientY)
    return pxToWorld(px, py)
  }

  const preImagePoints: [number, number][] =
    def.kind === 'polygon' ? def.localPoints!.map(([x, y]) => [x + anchor.x, y + anchor.y]) : [[anchor.x, anchor.y]]

  // Rotational-symmetry checks are always about the shape's own centre — it isn't a free,
  // draggable point like the "Quay hình" centre, it just tracks wherever the shape currently is.
  const effectiveParams: TransformParams =
    type === 'rotational-symmetry'
      ? { ...params, rotate: { ...params.rotate, cx: anchor.x, cy: anchor.y, angleDeg: params.rotate.angleDeg * rotDir } }
      : type === 'rotate'
        ? { ...params, rotate: { ...params.rotate, angleDeg: params.rotate.angleDeg * rotDir } }
        : params

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

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
          <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
            <CoordinatePlane
              svgRef={svgRef}
              onPointerMove={onPlanePointerMove}
              onPointerUp={onPlanePointerUp}
              showNumbers={advancedOpen || showCoords}
              everyNumber={showCoords}
              showAxes={showAxes}
            >
              {/* Both shapes share the same colour; the original has a dashed outline and a "Hình gốc" badge. */}
              <ShapeOutline def={def} points={preImagePoints} stroke="#1e293b" fill={def.color} dashed onPointerDown={onShapePointerDown} />
              {def.parts && <PatternParts parts={def.parts} map={toWorld} />}

              <ShapeOutline def={def} points={displayPoints} stroke="#1e293b" fill={def.color} strokeWidth={2.5} onPointerDown={onShapePointerDown} />
              {def.parts && <PatternParts parts={def.parts} map={toImage} />}
              {/* Redraw the original's dashed outline on top so it stays visible where the two shapes overlap. */}
              {!def.hideOutline && <ShapeOutline def={def} points={preImagePoints} stroke="#1e293b" fill="none" dashed ghost />}
              {showGuides && (
                <GuideLines
                  type={type}
                  pre={preImagePoints}
                  img={displayPoints}
                  center={
                    type === 'rotational-symmetry'
                      ? { x: anchor.x, y: anchor.y }
                      : centerParam
                        ? { x: centerParam.cx, y: centerParam.cy }
                        : null
                  }
                  axisAngleDeg={params['axis-symmetry'].axisAngleDeg}
                  sweepDeg={params.rotate.angleDeg * rotDir * (animT ?? 1)}
                />
              )}
              {showLengths && !def.hideOutline && <SideLengths def={def} points={preImagePoints} color="#64748b" />}
              {showLengths && !def.hideOutline && <SideLengths def={def} points={displayPoints} color="#0f172a" />}

              {type === 'axis-symmetry' && <MirrorLine angleDeg={params['axis-symmetry'].axisAngleDeg} />}
              {centerParam && (
                <CenterMarker x={centerParam.cx} y={centerParam.cy} onPointerDown={onCenterPointerDown} />
              )}
              {type === 'rotational-symmetry' && <FixedCenterMarker x={anchor.x} y={anchor.y} />}
              {/* Vertex names A, B… / A', B'… (button "Ẩn tên đỉnh"); "Hiện tọa độ" adds the coordinates. */}
              {(showNames || showCoords) && (
                <CoordLabelLayer
                  namesOnly={!showCoords}
                  hideNames={!showNames}
                  center={showCoords && centerParam ? { x: centerParam.cx, y: centerParam.cy } : null}
                  groups={[
                    { points: preImagePoints, prefix: '', color: '#64748b', circleR: def.kind === 'circle' ? def.radius : undefined },
                    { points: displayPoints, prefix: "'", color: '#1e293b', circleR: def.kind === 'circle' ? def.radius : undefined },
                  ]}
                />
              )}
            </CoordinatePlane>
          </div>
          <p className="text-center text-sm text-slate-500">
            Hai hình cùng màu: hình gốc có viền nét đứt và đỉnh A, B, C…; hình sau khi biến đổi có viền nét liền và đỉnh A', B', C'…
          </p>
          <button
            onClick={playAnimation}
            disabled={animT !== null}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
          >
            {animT !== null ? '✨ Đang chạy...' : '▶ Xem hoạt hình'}
          </button>
          <button
            onClick={() => setShowGuides((v) => !v)}
            aria-pressed={showGuides}
            className={`w-full rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
              showGuides ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50'
            }`}
          >
            ┅ {showGuides ? 'Ẩn đường dóng' : 'Hiện đường dóng từ các đỉnh'}
          </button>
          {showGuides && <p className="text-center text-sm text-slate-500">{GUIDE_NOTE[type]}</p>}
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (showAxes) setShowCoords(false)
                setShowAxes(!showAxes)
              }}
              aria-pressed={!showAxes}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
                showAxes ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50' : 'bg-slate-700 text-white'
              }`}
            >
              ✛ {showAxes ? 'Ẩn trục tọa độ' : 'Hiện trục tọa độ'}
            </button>
            <button
              onClick={() => setShowNames((v) => !v)}
              aria-pressed={!showNames}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
                showNames ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50' : 'bg-slate-700 text-white'
              }`}
            >
              🔤 {showNames ? 'Ẩn tên đỉnh' : 'Hiện tên đỉnh'}
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              onClick={() => {
                // Coordinates are read off the axes, so showing them brings the axes back.
                if (!showCoords) setShowAxes(true)
                setShowCoords(!showCoords)
              }}
              aria-pressed={showCoords}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
                showCoords ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
              }`}
            >
              📍 {showCoords ? 'Ẩn tọa độ' : 'Hiện tọa độ các điểm'}
            </button>
            <button
              onClick={() => setShowLengths((v) => !v)}
              aria-pressed={showLengths}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
                showLengths ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
              }`}
            >
              📏 {showLengths ? 'Ẩn độ dài cạnh' : 'Hiện độ dài cạnh'}
            </button>
          </div>
          {showCoords && (
            <p className="text-center text-sm text-slate-500">
              Tọa độ viết dạng <b>A(hoành độ; tung độ)</b>: số thứ nhất đọc trên trục Ox, số thứ hai đọc trên trục Oy. Điểm có dấu ' là điểm sau
              khi biến đổi.
            </p>
          )}
          {showLengths && (
            <p className="text-center text-sm text-slate-500">
              So sánh hình gốc (số xám) và hình mới (số đen): độ dài các cạnh <b>không đổi</b>!
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chọn hình</div>
            <div className="flex flex-wrap gap-2">
              {POINT_SHAPES.filter((s) => s.group !== 'pattern').map((s) => (
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
            <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Hình có họa tiết</div>
            <div className="flex flex-wrap gap-2">
              {POINT_SHAPES.filter((s) => s.group === 'pattern').map((s) => (
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
            <label className="mt-3 block text-sm">
              <div className="mb-1 flex justify-between text-slate-600">
                <span>Cỡ hình</span>
                <span className="font-mono font-semibold text-indigo-600">{shapeScale.toFixed(1).replace('.', ',')} ×</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={2.4}
                step={0.1}
                value={shapeScale}
                onChange={(e) => {
                  setAnimT(null)
                  setShapeScale(Number(e.target.value))
                }}
                className="w-full accent-indigo-600"
              />
            </label>
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
                  <DirectionToggle
                    dir={rotDir}
                    onChange={(d) => {
                      setAnimT(null)
                      setRotDir(d)
                    }}
                  />
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
                  <DirectionCaption angle={params.rotate.angleDeg} dir={rotDir} />
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
                      <DirectionToggle
                        dir={rotDir}
                        onChange={(d) => {
                          setAnimT(null)
                          setRotDir(d)
                        }}
                      />
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
                      <DirectionCaption angle={params.rotate.angleDeg} dir={rotDir} />
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
              <InfoCard description={info.description} properties={info.properties} formulas={[{ label: 'Công thức tọa độ', formula: info.formula(type === 'rotational-symmetry' || type === 'rotate' ? effectiveParams : params) }]} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** ↺ / ↻ buttons choosing the turning direction (shared by "Phép quay" and "Phép đối xứng quay"). */
function DirectionToggle({ dir, onChange }: { dir: 1 | -1; onChange: (d: 1 | -1) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          [1, '↺ Ngược chiều kim đồng hồ'],
          [-1, '↻ Cùng chiều kim đồng hồ'],
        ] as const
      ).map(([d, label]) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          aria-pressed={dir === d}
          className={`rounded-lg px-2 py-2 text-sm font-semibold transition active:scale-95 ${
            dir === d ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** "Đang quay 90° ↻ cùng chiều kim đồng hồ (… góc âm: −90°)". */
function DirectionCaption({ angle, dir }: { angle: number; dir: 1 | -1 }) {
  return (
    <p className="text-center text-sm text-slate-500">
      Đang quay <b>{angle}°</b> {dir === 1 ? '↺ ngược chiều kim đồng hồ' : '↻ cùng chiều kim đồng hồ'}
      {dir === -1 && angle > 0 && <> (trong công thức tọa độ viết là góc âm: −{angle}°)</>}
    </p>
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
  if (def.parts) {
    const all = def.parts.flatMap((p) => (p.kind === 'circle' ? [[p.c[0] - p.r, p.c[1] - p.r], [p.c[0] + p.r, p.c[1] + p.r]] : p.points))
    const xs = all.map((p) => p[0])
    const ys = all.map((p) => p[1])
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const size = Math.max(maxX - minX, maxY - minY) * 1.1
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    return (
      <svg width={22} height={22} viewBox={`${cx - size / 2} ${cy - size / 2} ${size} ${size}`} style={{ transform: 'scaleY(-1)' }}>
        {def.parts.map((p, i) =>
          p.kind === 'circle' ? (
            <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.r} fill={p.fill} />
          ) : (
            <polygon key={i} points={p.points.map((q) => q.join(',')).join(' ')} fill={p.fill} stroke="#1e293b" strokeWidth={size * 0.015} />
          ),
        )}
      </svg>
    )
  }
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

/** Length of every side (in grid squares) written just outside the shape; the radius for a circle. */
function SideLengths({ def, points, color }: { def: { kind: 'polygon' | 'circle'; radius?: number }; points: [number, number][]; color: string }) {
  const fmt = (v: number) => {
    const r = Math.round(v * 10) / 10
    return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',')
  }
  const label = (key: string, x: number, y: number, t: string) => (
    <text
      key={key}
      x={x}
      y={y}
      fontSize={13}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={3.5}
      paintOrder="stroke"
      pointerEvents="none"
    >
      {t}
    </text>
  )
  if (def.kind === 'circle') {
    const [cx, cy] = worldToPx(points[0])
    const r = (def.radius ?? 1) * PLANE_SCALE
    return (
      <g pointerEvents="none">
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#2563eb" strokeWidth={1.5} strokeDasharray="5 3" />
        <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="#dc2626" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={2.5} fill={color} />
        {label('r', cx + 26, cy - r / 2, `r = ${fmt(def.radius ?? 1)}`)}
        {label('d', cx - r / 2, cy + 11, `d = ${fmt(2 * (def.radius ?? 1))}`)}
      </g>
    )
  }
  const px = points.map(worldToPx)
  const cx = px.reduce((s, p) => s + p[0], 0) / px.length
  const cy = px.reduce((s, p) => s + p[1], 0) / px.length
  return (
    <g pointerEvents="none">
      {points.map((p, i) => {
        const q = points[(i + 1) % points.length]
        const a = px[i]
        const b = px[(i + 1) % px.length]
        const mx = (a[0] + b[0]) / 2
        const my = (a[1] + b[1]) / 2
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        let nx = -(b[1] - a[1]) / len
        let ny = (b[0] - a[0]) / len
        if (nx * (mx - cx) + ny * (my - cy) < 0) {
          nx = -nx
          ny = -ny
        }
        const off = 9 + Math.abs(nx) * 9
        return label(`l${i}`, mx + nx * off, my + ny * off, fmt(Math.hypot(q[0] - p[0], q[1] - p[1])))
      })}
    </g>
  )
}

const GUIDE = '#ea580c'

/**
 * Dashed construction lines ("đường dóng") from each vertex M of the original shape to its image M', drawn the
 * way the textbook explains each transformation: perpendicular to the mirror line and cut in half by it (axis
 * symmetry), through the centre I and cut in half there (point symmetry), equal parallel arrows (translation),
 * or IM, IM' and the arc between them (rotation).
 */
function GuideLines({
  type,
  pre,
  img,
  center,
  axisAngleDeg,
  sweepDeg,
}: {
  type: TransformType
  pre: [number, number][]
  img: [number, number][]
  center: { x: number; y: number } | null
  axisAngleDeg: number
  sweepDeg: number
}) {
  const tick = (key: string, a: [number, number], b: [number, number]) => {
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = (-(b[1] - a[1]) / len) * 5
    const ny = ((b[0] - a[0]) / len) * 5
    return <line key={key} x1={mx - nx} y1={my - ny} x2={mx + nx} y2={my + ny} stroke={GUIDE} strokeWidth={2} strokeLinecap="round" />
  }
  const out: React.ReactNode[] = []
  pre.forEach((m, i) => {
    const M = worldToPx(m)
    const M2 = worldToPx(img[i])
    const dist = Math.hypot(M2[0] - M[0], M2[1] - M[1])
    if (type === 'rotate' || type === 'rotational-symmetry') {
      if (!center) return
      const I = worldToPx([center.x, center.y])
      const r = Math.hypot(M[0] - I[0], M[1] - I[1])
      if (r < 1) return
      out.push(<line key={`a${i}`} x1={I[0]} y1={I[1]} x2={M[0]} y2={M[1]} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" />)
      out.push(<line key={`b${i}`} x1={I[0]} y1={I[1]} x2={M2[0]} y2={M2[1]} stroke={GUIDE} strokeWidth={1.5} strokeDasharray="5 4" />)
      // Positive = anticlockwise (sweep-flag 0 on screen, where y points down); negative = clockwise (flag 1).
      const sweep = Math.abs(sweepDeg) % 360
      const flag = sweepDeg < 0 ? 1 : 0
      if (sweep > 0.5 && sweep < 359.5)
        // World angles turn anticlockwise; on screen (y downwards) that is sweep-flag 0.
        out.push(
          <path
            key={`c${i}`}
            d={`M ${M[0]} ${M[1]} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} ${flag} ${M2[0]} ${M2[1]}`}
            fill="none"
            stroke={GUIDE}
            strokeWidth={1.5}
            strokeDasharray="2 4"
            strokeLinecap="round"
          />,
        )
      return
    }
    if (dist < 1) return
    if (type === 'translate') {
      out.push(
        <line key={`t${i}`} x1={M[0]} y1={M[1]} x2={M2[0]} y2={M2[1]} stroke={GUIDE} strokeWidth={1.5} strokeDasharray="5 4" markerEnd="url(#guide-arrow)" />,
      )
      return
    }
    out.push(<line key={`l${i}`} x1={M[0]} y1={M[1]} x2={M2[0]} y2={M2[1]} stroke={GUIDE} strokeWidth={1.5} strokeDasharray="5 4" />)
    const mid: [number, number] = [(M[0] + M2[0]) / 2, (M[1] + M2[1]) / 2]
    out.push(tick(`h1${i}`, M, mid), tick(`h2${i}`, mid, M2))
    if (type === 'axis-symmetry') {
      // Right-angle mark where MM' crosses the mirror line.
      const phi = (axisAngleDeg * Math.PI) / 180
      const ax: [number, number] = [Math.cos(phi), -Math.sin(phi)]
      const ux: [number, number] = [(M[0] - mid[0]) / (dist / 2), (M[1] - mid[1]) / (dist / 2)]
      const s = 7
      const p1: [number, number] = [mid[0] + ux[0] * s, mid[1] + ux[1] * s]
      const p3: [number, number] = [mid[0] + ax[0] * s, mid[1] + ax[1] * s]
      const p2: [number, number] = [p1[0] + ax[0] * s, p1[1] + ax[1] * s]
      out.push(<path key={`r${i}`} d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={GUIDE} strokeWidth={1.3} />)
    }
  })
  return (
    <g pointerEvents="none">
      <defs>
        <marker id="guide-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={GUIDE} />
        </marker>
      </defs>
      {out}
    </g>
  )
}

/** The coloured pieces of a patterned shape, each point mapped through `map` (so the pattern moves with the shape). */
function PatternParts({ parts, map }: { parts: PatternPart[]; map: (p: [number, number]) => [number, number] }) {
  return (
    <g pointerEvents="none">
      {parts.map((p, i) => {
        if (p.kind === 'circle') {
          const [cx, cy] = worldToPx(map(p.c))
          return <circle key={i} cx={cx} cy={cy} r={p.r * PLANE_SCALE} fill={p.fill} stroke={p.stroke ?? 'none'} strokeWidth={1} />
        }
        return (
          <path
            key={i}
            d={pointsToPath(p.points.map((q) => worldToPx(map(q))))}
            fill={p.fill}
            stroke={p.stroke ?? 'none'}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        )
      })}
    </g>
  )
}

function ShapeOutline({
  def,
  points,
  stroke,
  fill,
  dashed,
  onPointerDown,
  strokeWidth = 2,
  ghost = false,
}: {
  def: { kind: 'polygon' | 'circle'; radius?: number; hideOutline?: boolean }
  points: [number, number][]
  stroke: string
  fill: string
  dashed?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
  strokeWidth?: number
  /** Outline only, ignores the mouse (used to redraw the original's border on top). */
  ghost?: boolean
}) {
  if (def.hideOutline) {
    stroke = 'transparent'
    fill = 'transparent'
  }
  const interaction = ghost
    ? { pointerEvents: 'none' as const, fill: 'none' }
    : { className: 'cursor-grab active:cursor-grabbing', onPointerDown, fill: fill === 'none' ? 'transparent' : fill }
  if (def.kind === 'circle') {
    const [cx, cy] = worldToPx(points[0])
    const r = (def.radius ?? 1) * PLANE_SCALE
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '6 4' : undefined}
        fillOpacity={fill === 'none' ? 1 : 0.8}
        {...interaction}
      />
    )
  }
  const px = points.map(worldToPx)
  return (
    <path
      d={pointsToPath(px)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? '6 4' : undefined}
      fillOpacity={fill === 'none' ? 1 : 0.8}
      strokeLinejoin="round"
      {...interaction}
    />
  )
}

/** "−3", "1,5": Vietnamese decimal comma and a real minus sign, rounded to 1 decimal. */
function fmtCoord(v: number) {
  const r = Math.round(v * 10) / 10 || 0
  const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1).replace('.', ',')
  return r < 0 ? `−${s}` : s
}

interface CoordGroup {
  points: [number, number][]
  prefix: string
  color: string
  /** Radius in grid squares when the group is a circle (its single point is the centre). */
  circleR?: number
}

/**
 * Every vertex of the original and transformed shapes marked with a dot and its coordinates, e.g. "A(−3; 1,5)",
 * plus the centre I. Labels are placed one by one: each tries 8 directions around its point (starting with
 * "away from its shape") and takes the first spot that does not cover another label or either shape.
 */
function CoordLabelLayer({
  groups,
  center,
  namesOnly = false,
  hideNames = false,
}: {
  groups: CoordGroup[]
  center: { x: number; y: number } | null
  /** Just "A", "A'"… without the coordinates. */
  namesOnly?: boolean
  /** Coordinates without the letter, e.g. "(−3; 1,5)". */
  hideNames?: boolean
}) {
  type Box = { x: number; y: number; w: number; h: number }
  const placed: Box[] = []
  const shapesPx = groups.map((g) => ({ px: g.points.map(worldToPx), r: g.circleR !== undefined ? g.circleR * PLANE_SCALE : undefined }))
  const insideShape = (x: number, y: number) =>
    shapesPx.some(({ px, r }) => {
      if (r !== undefined) return Math.hypot(x - px[0][0], y - px[0][1]) < r
      let hit = false
      for (let i = 0, j = px.length - 1; i < px.length; j = i++) {
        const [xi, yi] = px[i]
        const [xj, yj] = px[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
      }
      return hit
    })
  const cost = (b: Box) => {
    let c = 0
    for (const o of placed) if (b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h) c += 10
    for (const fx of [0, 0.25, 0.5, 0.75, 1])
      for (const fy of [0, 0.5, 1]) if (insideShape(b.x + b.w * fx, b.y + b.h * fy)) c += 1
    if (b.x < 0 || b.y < 0 || b.x + b.w > PLANE_SIZE || b.y + b.h > PLANE_SIZE) c += 5
    return c
  }
  const place = (x: number, y: number, away: [number, number], text: string, size: number) => {
    const w = text.length * size * 0.56
    const h = size * 1.25
    const base = Math.atan2(away[1], away[0])
    let best: Box | null = null
    let bestCost = Infinity
    for (const k of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const a = base + (k * Math.PI) / 4
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      const reach = 7 + Math.abs(dx) * (w / 2) + Math.abs(dy) * (h / 2)
      const box = { x: x + dx * reach - w / 2, y: y + dy * reach - h / 2, w, h }
      const c = cost(box)
      if (c < bestCost) {
        bestCost = c
        best = box
      }
      if (c === 0) break
    }
    placed.push(best!)
    return best!
  }

  const items: { key: string; dot: [number, number]; box: Box; text: string; color: string; size: number }[] = []
  if (center) {
    const [x, y] = worldToPx([center.x, center.y])
    const text = `I(${fmtCoord(center.x)}; ${fmtCoord(center.y)})`
    items.push({ key: 'I', dot: [x, y], box: place(x, y, [1, 1], text, 12), text, color: '#a855f7', size: 12 })
  }
  groups.forEach((g, gi) => {
    const px = shapesPx[gi].px
    const cx = px.reduce((s, p) => s + p[0], 0) / px.length
    const cy = px.reduce((s, p) => s + p[1], 0) / px.length
    const size = namesOnly ? (g.points.length > 8 ? 11 : 14) : g.points.length > 8 ? 10 : 12
    g.points.forEach((p, i) => {
      const [x, y] = px[i]
      const away: [number, number] = Math.hypot(x - cx, y - cy) < 1e-6 ? [1, -1] : [x - cx, y - cy]
      const name = (VERTEX_LABELS[i] ?? `P${i + 1}`) + g.prefix
      const text = namesOnly ? name : `${hideNames ? '' : name}(${fmtCoord(p[0])}; ${fmtCoord(p[1])})`
      items.push({ key: `${gi}-${i}`, dot: [x, y], box: place(x, y, away, text, size), text, color: g.color, size })
    })
  })

  return (
    <g pointerEvents="none">
      {items.map((it) => (
        <circle key={`d${it.key}`} cx={it.dot[0]} cy={it.dot[1]} r={3} fill={it.color} stroke="#fff" strokeWidth={1.2} />
      ))}
      {items.map((it) => (
        <text
          key={`t${it.key}`}
          x={it.box.x + it.box.w / 2}
          y={it.box.y + it.box.h / 2}
          fontSize={it.size}
          fontWeight={700}
          fill={it.color}
          textAnchor="middle"
          dominantBaseline="central"
          stroke="#fff"
          strokeWidth={3.5}
          paintOrder="stroke"
        >
          {it.text}
        </text>
      ))}
    </g>
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
