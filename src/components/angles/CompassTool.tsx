import { useEffect, useRef, useState } from 'react'
import { angleOfPoint, arcPath, clamp, polarToCartesian } from '../../utils/angleMath'

const CX = 200
const CY = 200
const PX_PER_CM = 20
const MIN_R = 20
const MAX_R = 150
const DRAW_DURATION = 1800

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function CompassTool() {
  const [radius, setRadius] = useState(80)
  const [handleAngle, setHandleAngle] = useState(35)
  const [sweep, setSweep] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scale = 400 / rect.width
    return [(clientX - rect.left) * scale, (clientY - rect.top) * scale]
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
  }

  const drawEndDeg = handleAngle + sweep
  const [penX, penY] = polarToCartesian(CX, CY, radius, isDrawing ? drawEndDeg : handleAngle)
  const [pivotX, pivotY] = [CX, CY - 32]

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
          <svg
            ref={svgRef}
            width={340}
            height={340}
            viewBox="0 0 400 400"
            className="touch-none rounded-xl bg-white"
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

            {/* compass legs illustration */}
            <line x1={pivotX} y1={pivotY} x2={CX} y2={CY} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
            <line x1={pivotX} y1={pivotY} x2={penX} y2={penY} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
            <circle cx={pivotX} cy={pivotY} r={5} fill="#64748b" />

            <line x1={CX} y1={CY} x2={penX} y2={penY} stroke="#c7d2fe" strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={CX} cy={CY} r={5} fill="#1e293b" />
            <text x={CX} y={CY + 20} fontSize={11} fill="#64748b" textAnchor="middle">
              tâm
            </text>

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
        <p className="text-center text-xs text-slate-400">Kéo đầu bút chì để mở compa theo bán kính mong muốn</p>
      </div>

      <div className="space-y-4">
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

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">Cách vẽ hình tròn bằng compa</div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Xác định độ dài bán kính R muốn vẽ, mở compa sao cho khoảng cách giữa hai đầu đúng bằng R.</li>
            <li>Đặt đầu nhọn của compa cố định tại điểm làm tâm, không để bị xê dịch.</li>
            <li>Xoay đầu chì một vòng quanh tâm — vì đầu chì luôn cách tâm đúng bằng R, nó vẽ ra một đường tròn hoàn chỉnh.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
