import { useRef, useState } from 'react'
import { angleOfPoint, arcPath, interiorAngleDeg, polarToCartesian } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'

type Pt = [number, number]

const COLORS = ['#6366f1', '#f97316', '#0ea5e9']
const LABELS = ['A', 'B', 'C']

export default function TriangleAngleSum() {
  const [points, setPoints] = useState<Pt[]>([
    [90, 290],
    [330, 290],
    [230, 70],
  ])
  const svgRef = useRef<SVGSVGElement>(null)
  const dragIndex = useRef<number | null>(null)

  const clientToLocal = (clientX: number, clientY: number): Pt => {
    return clientToSvg(svgRef.current!, clientX, clientY)
  }

  const onHandlePointerDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragIndex.current = i
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragIndex.current === null) return
    const p = clientToLocal(e.clientX, e.clientY)
    setPoints((prev) => prev.map((pt, i) => (i === dragIndex.current ? p : pt)))
  }
  const onPointerUp = () => {
    dragIndex.current = null
  }

  const angles = points.map((v, i) => interiorAngleDeg(v, points[(i + 1) % 3], points[(i + 2) % 3]))
  const sum = angles[0] + angles[1] + angles[2]

  const arcs = points.map((v, i) => {
    const p1 = points[(i + 1) % 3]
    const p2 = points[(i + 2) % 3]
    const a1 = angleOfPoint(v[0], v[1], p1[0], p1[1])
    const a2 = angleOfPoint(v[0], v[1], p2[0], p2[1])
    const rawSweep = ((a2 - a1) % 360 + 360) % 360
    const matches = Math.abs(rawSweep - angles[i]) < 1
    const [start, end] = matches ? [a1, a2] : [a2, a1]
    const r = Math.min(34, 0.35 * Math.min(Math.hypot(p1[0] - v[0], p1[1] - v[1]), Math.hypot(p2[0] - v[0], p2[1] - v[1])))
    const midDeg = start + angles[i] / 2
    const [labelX, labelY] = polarToCartesian(v[0], v[1], r + 18, midDeg)
    return { d: arcPath(v[0], v[1], r, start, end), labelX, labelY }
  })

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox="0 0 400 310"
            className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <polygon
              points={points.map((p) => p.join(',')).join(' ')}
              fill="#6366f114"
              stroke="#1e293b"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {arcs.map((a, i) => (
              <path key={i} d={a.d} fill="none" stroke={COLORS[i]} strokeWidth={2.5} />
            ))}
            {arcs.map((a, i) => (
              <text key={i} x={a.labelX} y={a.labelY} fontSize={13} fontWeight={700} fill={COLORS[i]} textAnchor="middle">
                {angles[i].toFixed(0)}°
              </text>
            ))}
            {points.map((p, i) => (
              <text
                key={`lb${i}`}
                x={p[0] + (p[0] < 200 ? -18 : 18)}
                y={p[1] + (p[1] > 180 ? 18 : -12)}
                fontSize={14}
                fontWeight={700}
                fill="#334155"
                textAnchor="middle"
              >
                {LABELS[i]}
              </text>
            ))}
            {points.map((p, i) => (
              <circle
                key={`h${i}`}
                cx={p[0]}
                cy={p[1]}
                r={12}
                fill={COLORS[i]}
                fillOpacity={0.2}
                stroke={COLORS[i]}
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={onHandlePointerDown(i)}
              />
            ))}
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">Kéo các đỉnh A, B, C để thay đổi hình dạng tam giác</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {LABELS.map((l, i) => (
            <div key={l} className="rounded-xl border border-indigo-100 bg-white p-3 text-center shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS[i] }}>
                Góc {l}
              </div>
              <div className="text-xl font-bold text-slate-700">{angles[i].toFixed(1)}°</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center shadow-sm">
          <div className="text-sm text-slate-500">Tổng ba góc trong tam giác</div>
          <div className="text-2xl font-bold text-emerald-600">
            {angles[0].toFixed(1)}° + {angles[1].toFixed(1)}° + {angles[2].toFixed(1)}° = {sum.toFixed(1)}°
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Kéo đỉnh đi đâu thì tổng ba góc vẫn luôn bằng <b>180°</b>, đúng bằng một góc bẹt!
          </p>
        </div>
      </div>
    </div>
  )
}
