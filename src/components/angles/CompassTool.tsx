import { useEffect, useRef, useState } from 'react'
import { angleOfPoint, arcPath, clamp, polarToCartesian } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'
import { Fold } from '../common/StudyLayout'
import RealCompass, { MeasureRuler, compassHinge } from './RealCompass'

const SIZE = 400
const PX_PER_CM = 20
const MIN_R = 10
const MAX_R = 200
const RULER_CM = 10
/** Drag snaps to whole millimetres. */
const MM = PX_PER_CM / 10
const DRAW_DURATION = 1800

const RADIUS_COLOR = '#dc2626'
const DIAMETER_COLOR = '#2563eb'
const RING_COLOR = '#f59e0b'
/** Each new circle gets the next colour, so circles of different sizes are easy to tell apart. */
const CIRCLE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6', '#14b8a6']

interface DrawnCircle {
  id: number
  cx: number
  cy: number
  r: number
  /** Direction of the radius when it was drawn (where the pencil started), for the measuring overlay. */
  angle: number
  color: string
}

/** 4 → "4", 3.25 → "3,3" (Vietnamese decimal comma). */
function fmtCm(px: number) {
  const v = Math.round((px / PX_PER_CM) * 10) / 10
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')
}

/** Text with a white outline so it reads on top of lines and fills. */
function Label({ x, y, text, color, size = 14 }: { x: number; y: number; text: string; color: string; size?: number }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={4}
      paintOrder="stroke"
      strokeLinejoin="round"
      pointerEvents="none"
    >
      {text}
    </text>
  )
}

const xy = ([x, y]: [number, number]) => ({ x, y })

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

let nextCircleId = 1

/** Stand the compass up (hinge above the radius) unless that pushes it off the picture; then use the other side. */
function pickSide(center: [number, number], pen: [number, number]): 1 | -1 {
  const up = compassHinge(center, pen).side
  const inside = ([x, y]: [number, number]) => x > 12 && x < SIZE - 12 && y > 12 && y < SIZE - 12
  if (inside(compassHinge(center, pen, up).hinge)) return up
  const other = (-up) as 1 | -1
  return inside(compassHinge(center, pen, other).hinge) ? other : up
}

export default function CompassTool() {
  const [center, setCenter] = useState<[number, number]>([200, 200])
  const [radius, setRadius] = useState(110)
  const [handleAngle, setHandleAngle] = useState(35)
  const [sweep, setSweep] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  /** The compass hasn't moved since the last circle was finished: the measuring overlays refer to that circle. */
  const [isDone, setIsDone] = useState(false)
  const [circles, setCircles] = useState<DrawnCircle[]>([])
  const [showLengths, setShowLengths] = useState(false)
  const [showParts, setShowParts] = useState(false)
  const [showRuler, setShowRuler] = useState(true)
  const [showCompass, setShowCompass] = useState(true)
  const [showRadiusLabels, setShowRadiusLabels] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<null | { kind: 'pen' } | { kind: 'center'; offX: number; offY: number }>(null)
  const rafRef = useRef<number | null>(null)
  /** Which side of the radius the compass hinge is on; fixed while drawing so the compass turns smoothly. */
  const drawSide = useRef<1 | -1>(1)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const [CX, CY] = center
  const color = CIRCLE_COLORS[circles.length % CIRCLE_COLORS.length]

  /** Anything that moves or reopens the compass ends the "just drawn" state (the circle itself stays). */
  const moved = () => {
    setIsDone(false)
    setShowLengths(false)
    setShowParts(false)
  }

  const updatePen = (clientX: number, clientY: number) => {
    const [x, y] = clientToSvg(svgRef.current!, clientX, clientY)
    setRadius(clamp(Math.round(Math.hypot(x - CX, y - CY) / MM) * MM, MIN_R, MAX_R))
    setHandleAngle(angleOfPoint(CX, CY, x, y))
  }

  const onPenPointerDown = (e: React.PointerEvent) => {
    if (isDrawing) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = { kind: 'pen' }
    moved()
    updatePen(e.clientX, e.clientY)
  }
  const onCenterPointerDown = (e: React.PointerEvent) => {
    if (isDrawing) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const [x, y] = clientToSvg(svgRef.current!, e.clientX, e.clientY)
    dragging.current = { kind: 'center', offX: x - CX, offY: y - CY }
    moved()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current
    if (!d) return
    if (d.kind === 'pen') return updatePen(e.clientX, e.clientY)
    const [x, y] = clientToSvg(svgRef.current!, e.clientX, e.clientY)
    const snap = (v: number) => clamp(Math.round(v / MM) * MM, 6, SIZE - 6)
    setCenter([snap(x - d.offX), snap(y - d.offY)])
  }
  const onPointerUp = () => {
    dragging.current = null
  }

  const draw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    drawSide.current = pickSide(center, polarToCartesian(CX, CY, radius, handleAngle))
    const circle: DrawnCircle = { id: nextCircleId++, cx: CX, cy: CY, r: radius, angle: handleAngle, color }
    setIsDrawing(true)
    moved()
    setSweep(0)
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DRAW_DURATION)
      setSweep(easeInOutCubic(t) * 360)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        setIsDrawing(false)
        setIsDone(true)
        setCircles((cs) => [...cs, circle])
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const clearAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsDrawing(false)
    setSweep(0)
    setCircles([])
    moved()
  }
  const undo = () => {
    setCircles((cs) => cs.slice(0, -1))
    moved()
  }

  const nudge = (dCm: number) => {
    if (isDrawing) return
    moved()
    setRadius((r) => clamp(Math.round((r + dCm * PX_PER_CM) / MM) * MM, MIN_R, MAX_R))
  }

  const last = circles[circles.length - 1]
  /** Radius / diameter / parts of the most recently drawn circle (available as long as there is one). */
  const overlays = !!last && !isDrawing && (showLengths || showParts)

  /**
   * Radius from the centre to the pencil tip; the diameter is drawn at right angles to it so the two never overlap.
   * Names ("bán kính") go on one side of each line, lengths ("r = 4 cm") on the other.
   */
  const measureLayer = (() => {
    if (!overlays || !last) return null
    const { cx: CX, cy: CY, r: radius, angle: h } = last
    const unit = (deg: number): [number, number] => {
      const [x, y] = polarToCartesian(0, 0, 1, deg)
      return [x, y]
    }
    const at = (r: number, deg: number): [number, number] => polarToCartesian(CX, CY, r, deg)
    /** Distance that keeps a centred label of this text clear of a line running along `lineDeg`. */
    const clear = (text: string, lineDeg: number) => {
      const [nx, ny] = unit(lineDeg + 90)
      return 8 + Math.abs(nx) * text.length * 3.9 + Math.abs(ny) * 9
    }
    const pen = at(radius, h)
    const d1 = at(radius, h + 90)
    const d2 = at(radius, h - 90)
    const rMid = at(radius / 2, h)
    const dUp = at(radius * 0.6, h + 90)
    const dDown = at(radius * 0.6, h - 90)
    const rName = 'bán kính'
    const rValue = `r = ${fmtCm(radius)} cm`
    const dName = 'đường kính'
    const dValue = `d = ${fmtCm(2 * radius)} cm`
    const off = (p: [number, number], deg: number, dist: number): [number, number] => {
      const [ux, uy] = unit(deg)
      return [p[0] + ux * dist, p[1] + uy * dist]
    }
    const ringLabel = at(radius + 22, h - 150)
    return (
      <g pointerEvents="none">
        {showParts && <circle cx={CX} cy={CY} r={radius} fill="none" stroke={RING_COLOR} strokeWidth={6} />}
        <line x1={d1[0]} y1={d1[1]} x2={d2[0]} y2={d2[1]} stroke={DIAMETER_COLOR} strokeWidth={2.5} strokeDasharray="7 5" />
        <line x1={CX} y1={CY} x2={pen[0]} y2={pen[1]} stroke={RADIUS_COLOR} strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={5} fill="#1e293b" stroke="#fff" strokeWidth={1.5} />
        {showLengths && <Label {...xy(off(rMid, h + 90, clear(rValue, h)))} text={rValue} color={RADIUS_COLOR} />}
        {showLengths && <Label {...xy(off(dUp, h + 180, clear(dValue, h + 90)))} text={dValue} color={DIAMETER_COLOR} />}
        {showParts && <Label {...xy(off(rMid, h - 90, clear(rName, h)))} text={rName} color={RADIUS_COLOR} />}
        {showParts && <Label {...xy(off(dDown, h + 180, clear(dName, h - 90)))} text={dName} color={DIAMETER_COLOR} />}
        {showParts && <Label {...xy(off([CX, CY], h + 180, 24))} text="tâm O" color="#1e293b" size={13} />}
        {showParts && <Label x={ringLabel[0]} y={ringLabel[1]} text="đường tròn" color="#b45309" />}
        {showParts && radius >= 60 && <Label {...xy(at(radius * 0.72, h + 180))} text="hình tròn" color="#4338ca" />}
      </g>
    )
  })()

  const drawEndDeg = handleAngle + sweep
  const [penX, penY] = polarToCartesian(CX, CY, radius, isDrawing ? drawEndDeg : handleAngle)
  const side = isDrawing ? drawSide.current : pickSide(center, [penX, penY])
  const { hinge } = compassHinge(center, [penX, penY], side)
  const hRad = (handleAngle * Math.PI) / 180
  const hingeLocalY = (hinge[0] - CX) * Math.sin(hRad) + (hinge[1] - CY) * Math.cos(hRad)
  const rulerSide: 1 | -1 = hingeLocalY > 0 ? -1 : 1
  const rulerOn = showRuler && !isDrawing && !overlays

  const grid = []
  for (let v = 0; v <= SIZE; v += PX_PER_CM) {
    grid.push(
      <line key={`v${v}`} x1={v} y1={0} x2={v} y2={SIZE} stroke="#eef2f7" strokeWidth={1} />,
      <line key={`h${v}`} x1={0} y1={v} x2={SIZE} y2={v} stroke="#eef2f7" strokeWidth={1} />,
    )
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {grid}

            {/* every circle drawn so far stays on the page */}
            {circles.map((c) => (
              <g key={c.id} pointerEvents="none">
                <circle cx={c.cx} cy={c.cy} r={c.r} fill={c.color} fillOpacity={0.07} stroke={c.color} strokeWidth={2.5} />
                <circle cx={c.cx} cy={c.cy} r={2.5} fill={c.color} />
                {showRadiusLabels && <Label x={c.cx} y={c.cy - c.r - 9} text={`r = ${fmtCm(c.r)} cm`} color={c.color} size={12} />}
              </g>
            ))}
            {isDrawing && sweep > 0 && (
              <path d={arcPath(CX, CY, radius, handleAngle, drawEndDeg)} fill="none" stroke={color} strokeWidth={2.5} />
            )}

            {measureLayer}
            {!overlays && (
              <>
                {rulerOn && (
                  <MeasureRuler
                    center={center}
                    angleDeg={handleAngle}
                    lengthPx={radius}
                    pxPerCm={PX_PER_CM}
                    maxCm={RULER_CM}
                    side={rulerSide}
                    label={`${fmtCm(radius)} cm`}
                  />
                )}
                {!rulerOn && (
                  <line x1={CX} y1={CY} x2={penX} y2={penY} stroke={RADIUS_COLOR} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 3" />
                )}
                {/* the real compass: needle on the centre, pencil on the drawing point */}
                {showCompass && <RealCompass center={center} pen={[penX, penY]} side={side} />}
              </>
            )}

            {/* needle point = centre: drag it to move the whole compass */}
            <g className={isDrawing ? '' : 'cursor-move'} onPointerDown={onCenterPointerDown}>
              <circle cx={CX} cy={CY} r={13} fill="#0f172a" fillOpacity={0.06} stroke="#0f172a" strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="3 3" />
              <circle cx={CX} cy={CY} r={3.5} fill="#0f172a" />
            </g>
            {/* pencil point: drag it to open the compass */}
            <g className={isDrawing ? '' : 'cursor-grab active:cursor-grabbing'} onPointerDown={onPenPointerDown}>
              <circle
                cx={penX}
                cy={penY}
                r={15}
                fill="#6366f1"
                fillOpacity={overlays ? 0.15 : 0.08}
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray={overlays ? undefined : '4 3'}
              />
            </g>
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">
          Kéo <b className="text-indigo-600">vòng tím</b> (đầu chì) để mở compa. Kéo <b className="text-slate-700">chấm đen</b> (đầu kim) để dời compa sang chỗ
          khác rồi vẽ thêm hình tròn. Mỗi ô lưới là 1 cm.
        </p>
        {last && !isDrawing && (
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                [showLengths, setShowLengths, '📏 Đường kính, bán kính'],
                [showParts, setShowParts, '⭕ Các thành phần'],
              ] as const
            ).map(([on, set, label]) => (
              <button
                key={label}
                onClick={() => set((v) => !v)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:scale-105 active:scale-95 ${
                  on ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {last && !isDrawing && showParts && (
          <ul className="w-full space-y-1.5 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
            {[
              ['#1e293b', 'Tâm O: điểm đặt đầu nhọn của compa, nằm chính giữa hình tròn.'],
              [RADIUS_COLOR, `Bán kính: đoạn thẳng nối tâm O với một điểm trên đường tròn (chính là độ mở của compa), r = ${fmtCm(last.r)} cm.`],
              [DIAMETER_COLOR, `Đường kính: đoạn thẳng đi qua tâm O, nối hai điểm trên đường tròn: d = 2 × r = ${fmtCm(2 * last.r)} cm.`],
              [RING_COLOR, `Đường tròn: nét cong do đầu bút chì vẽ ra. Độ dài đường tròn chính là chu vi: C = 2 × π × r ≈ ${fmtCm(2 * Math.PI * last.r)} cm.`],
              ['#4338ca', 'Hình tròn: gồm đường tròn và toàn bộ phần bên trong.'],
            ].map(([c, text]) => (
              <li key={c} className="flex gap-2">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c }} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
          <div className="text-sm text-slate-500">Bán kính compa (khoảng cách tâm — đầu bút)</div>
          <div className="text-3xl font-bold text-indigo-600">{fmtCm(radius)} cm</div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[-0.5, -0.1, 0.1, 0.5].map((d) => (
              <button
                key={d}
                onClick={() => nudge(d)}
                disabled={isDrawing}
                className="rounded-lg bg-slate-100 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95 disabled:opacity-50"
              >
                {d > 0 ? '+' : '−'}
                {String(Math.abs(d)).replace('.', ',')} cm
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setShowRuler((v) => !v)}
              aria-pressed={showRuler}
              className={`rounded-lg py-1.5 text-sm font-semibold transition active:scale-95 ${
                showRuler ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50'
              }`}
            >
              📏 {showRuler ? 'Ẩn thước đo' : 'Hiện thước đo'}
            </button>
            <button
              onClick={() => setShowCompass((v) => !v)}
              aria-pressed={showCompass}
              className={`rounded-lg py-1.5 text-sm font-semibold transition active:scale-95 ${
                showCompass ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              🧭 {showCompass ? 'Ẩn compa' : 'Hiện compa'}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={draw}
            disabled={isDrawing}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            style={{ background: `linear-gradient(90deg, ${color}, #8b5cf6)` }}
          >
            {isDrawing ? '✨ Đang vẽ...' : circles.length === 0 ? '✏️ Vẽ hình tròn' : '✏️ Vẽ thêm hình tròn'}
          </button>
        </div>

        {isDone && last && (
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-600">
            ✅ Xong! Mọi điểm trên đường tròn đều cách tâm đúng {fmtCm(last.r)} cm. Kéo chấm đen để dời compa và vẽ thêm nhé!
          </div>
        )}

        {circles.length > 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Các hình tròn đã vẽ ({circles.length})</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" checked={showRadiusLabels} onChange={(e) => setShowRadiusLabels(e.target.checked)} className="accent-indigo-600" />
                Ghi bán kính lên hình
              </label>
            </div>
            <ul className="space-y-1">
              {circles.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span>
                    Hình tròn {i + 1}: <b>r = {fmtCm(c.r)} cm</b>, d = {fmtCm(2 * c.r)} cm
                  </span>
                  <button
                    onClick={() => {
                      setCircles((cs) => cs.filter((x) => x.id !== c.id))
                      moved()
                    }}
                    className="ml-auto text-xs font-medium text-rose-500 hover:underline"
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={undo} className="font-medium text-slate-500 hover:underline">
                ↶ Xoá hình vừa vẽ
              </button>
              <button onClick={clearAll} className="font-medium text-rose-500 hover:underline">
                Xoá hết, vẽ lại từ đầu
              </button>
            </div>
          </div>
        )}

        <Fold title="🧭 Cách vẽ hình tròn bằng compa">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Xác định độ dài bán kính R muốn vẽ. Đặt compa lên thước thẳng: đầu kim ở vạch 0, mở compa đến khi đầu chì chạm đúng vạch R.</li>
            <li>Đặt đầu nhọn của compa cố định tại điểm làm tâm, không để bị xê dịch.</li>
            <li>Xoay đầu chì một vòng quanh tâm — vì đầu chì luôn cách tâm đúng bằng R, nó vẽ ra một đường tròn hoàn chỉnh.</li>
          </ol>
        </Fold>
      </div>
    </div>
  )
}
