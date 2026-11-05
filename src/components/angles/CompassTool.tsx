import { useEffect, useRef, useState } from 'react'
import { angleOfPoint, arcPath, clamp, polarToCartesian } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'
import { Fold } from '../common/StudyLayout'

const CX = 200
const CY = 200
const PX_PER_CM = 20
const MIN_R = 20
const MAX_R = 150
const DRAW_DURATION = 1800

const RADIUS_COLOR = '#dc2626'
const DIAMETER_COLOR = '#2563eb'
const RING_COLOR = '#f59e0b'

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

export default function CompassTool() {
  const [radius, setRadius] = useState(110)
  const [handleAngle, setHandleAngle] = useState(35)
  const [sweep, setSweep] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showLengths, setShowLengths] = useState(false)
  const [showParts, setShowParts] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    return clientToSvg(svgRef.current!, clientX, clientY)
  }

  const updateFromPoint = (clientX: number, clientY: number) => {
    const [x, y] = clientToLocal(clientX, clientY)
    const r = clamp(Math.hypot(x - CX, y - CY), MIN_R, MAX_R)
    const deg = angleOfPoint(CX, CY, x, y)
    setRadius(r)
    setHandleAngle(deg)
  }

  const onHandlePointerDown = (e: React.PointerEvent) => {
    if (isDrawing) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = true
    updateFromPoint(e.clientX, e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    updateFromPoint(e.clientX, e.clientY)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const draw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsDrawing(true)
    setIsDone(false)
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
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsDrawing(false)
    setIsDone(false)
    setSweep(0)
    setShowLengths(false)
    setShowParts(false)
  }

  const overlays = isDone && (showLengths || showParts)

  /**
   * Radius from the centre to the pencil tip; the diameter is drawn at right angles to it so the two never overlap.
   * Names ("bán kính") go on one side of each line, lengths ("r = 4 cm") on the other.
   */
  const measureLayer = (() => {
    if (!overlays) return null
    const h = handleAngle
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
    // One label per quarter around the centre: r value | bán kính on either side of the radius,
    // d value and "đường kính" on the two halves of the diameter, both on the side away from the radius.
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
  const [pivotX, pivotY] = [CX, CY - 32]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {[...Array(Math.floor(MAX_R / PX_PER_CM))].map((_, i) => (
              <circle key={i} cx={CX} cy={CY} r={(i + 1) * PX_PER_CM} fill="none" stroke="#f1f5f9" strokeWidth={1} />
            ))}

            {isDone && <circle cx={CX} cy={CY} r={radius} fill="#6366f120" stroke="#6366f1" strokeWidth={2.5} />}
            {isDrawing && sweep > 0 && (
              <path d={arcPath(CX, CY, radius, handleAngle, drawEndDeg)} fill="none" stroke="#6366f1" strokeWidth={2.5} />
            )}

            {!overlays && (
              <>
                {/* compass legs illustration */}
                <line x1={pivotX} y1={pivotY} x2={CX} y2={CY} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
                <line x1={pivotX} y1={pivotY} x2={penX} y2={penY} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
                <circle cx={pivotX} cy={pivotY} r={5} fill="#64748b" />

                <line x1={CX} y1={CY} x2={penX} y2={penY} stroke="#c7d2fe" strokeWidth={1.5} strokeDasharray="4 3" />
                <circle cx={CX} cy={CY} r={5} fill="#1e293b" />
                <text x={CX} y={CY + 20} fontSize={11} fill="#64748b" textAnchor="middle">
                  tâm
                </text>
              </>
            )}
            {measureLayer}

            <g
              className={isDrawing ? '' : 'cursor-grab active:cursor-grabbing'}
              onPointerDown={onHandlePointerDown}
            >
              <circle cx={penX} cy={penY} r={14} fill="#6366f1" fillOpacity={0.15} stroke="#6366f1" strokeWidth={2} />
              <text x={penX} y={penY + 5} fontSize={14} textAnchor="middle">
                ✏️
              </text>
            </g>
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">Kéo đầu bút chì để mở compa theo bán kính mong muốn</p>
        {isDone && (
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
        {isDone && showParts && (
          <ul className="w-full space-y-1.5 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
            {[
              ['#1e293b', 'Tâm O: điểm đặt đầu nhọn của compa, nằm chính giữa hình tròn.'],
              [RADIUS_COLOR, `Bán kính: đoạn thẳng nối tâm O với một điểm trên đường tròn (chính là độ mở của compa), r = ${fmtCm(radius)} cm.`],
              [DIAMETER_COLOR, `Đường kính: đoạn thẳng đi qua tâm O, nối hai điểm trên đường tròn: d = 2 × r = ${fmtCm(2 * radius)} cm.`],
              [RING_COLOR, `Đường tròn: nét cong do đầu bút chì vẽ ra. Độ dài đường tròn chính là chu vi: C = 2 × π × r ≈ ${fmtCm(2 * Math.PI * radius)} cm.`],
              ['#4338ca', 'Hình tròn: gồm đường tròn và toàn bộ phần bên trong.'],
            ].map(([color, text]) => (
              <li key={color} className="flex gap-2">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
          <div className="text-sm text-slate-500">Bán kính compa (khoảng cách tâm — đầu bút)</div>
          <div className="text-3xl font-bold text-indigo-600">{(radius / PX_PER_CM).toFixed(1)} cm</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={draw}
            disabled={isDrawing}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          >
            {isDrawing ? '✨ Đang vẽ...' : '✏️ Vẽ hình tròn'}
          </button>
          <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
            Vẽ lại
          </button>
        </div>

        {isDone && (
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-600">
            ✅ Xong! Mọi điểm trên đường tròn đều cách tâm đúng {(radius / PX_PER_CM).toFixed(1)} cm.
          </div>
        )}

        <Fold title="🧭 Cách vẽ hình tròn bằng compa">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Xác định độ dài bán kính R muốn vẽ, mở compa sao cho khoảng cách giữa hai đầu đúng bằng R.</li>
            <li>Đặt đầu nhọn của compa cố định tại điểm làm tâm, không để bị xê dịch.</li>
            <li>Xoay đầu chì một vòng quanh tâm — vì đầu chì luôn cách tâm đúng bằng R, nó vẽ ra một đường tròn hoàn chỉnh.</li>
          </ol>
        </Fold>
      </div>
    </div>
  )
}
