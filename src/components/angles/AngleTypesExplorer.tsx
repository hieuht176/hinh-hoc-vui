import { useRef, useState } from 'react'
import { ANGLE_TYPES, classifyAngle } from '../../data/angleTypes'
import { angleOfPoint, arcPath, polarToCartesian } from '../../utils/angleMath'

const CX = 130
const CY = 260
const RAY_LEN = 170
const ARC_R = 46

export default function AngleTypesExplorer() {
  const [angleDeg, setAngleDeg] = useState(50)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const current = classifyAngle(angleDeg)

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scale = 400 / rect.width
    return [(clientX - rect.left) * scale, (clientY - rect.top) * scale]
  }

  const updateFromPoint = (clientX: number, clientY: number) => {
    const [x, y] = clientToLocal(clientX, clientY)
    let deg = Math.round(angleOfPoint(CX, CY, x, y))
    if (deg <= 0) deg = 1
    if (deg >= 360) deg = 359
    setAngleDeg(deg)
  }

  const onHandlePointerDown = (e: React.PointerEvent) => {
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

  const [rayX, rayY] = polarToCartesian(CX, CY, RAY_LEN, angleDeg)
  const [baseX, baseY] = polarToCartesian(CX, CY, RAY_LEN, 0)
  const [labelX, labelY] = polarToCartesian(CX, CY, ARC_R + 22, angleDeg / 2)

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
          <svg
            ref={svgRef}
            width={340}
            height={280}
            viewBox="0 0 400 280"
            className="touch-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {angleDeg > 0 && angleDeg < 360 && (
              <path d={arcPath(CX, CY, ARC_R, 0, angleDeg)} fill="none" stroke={current?.color ?? '#94a3b8'} strokeWidth={3} />
            )}
            <line x1={CX} y1={CY} x2={baseX} y2={baseY} stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
            <line x1={CX} y1={CY} x2={rayX} y2={rayY} stroke={current?.color ?? '#1e293b'} strokeWidth={4} strokeLinecap="round" />
            <circle cx={CX} cy={CY} r={5} fill="#1e293b" />
            <circle
              cx={rayX}
              cy={rayY}
              r={13}
              fill={current?.color ?? '#94a3b8'}
              fillOpacity={0.2}
              stroke={current?.color ?? '#94a3b8'}
              strokeWidth={2}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={onHandlePointerDown}
            />
            <text x={labelX} y={labelY} fontSize={16} fontWeight={700} fill="#334155" textAnchor="middle">
              {angleDeg}°
            </text>
          </svg>
        </div>
        <p className="text-center text-xs text-slate-400">Kéo chấm màu để thay đổi số đo góc</p>
        <input
          type="range"
          min={1}
          max={359}
          step={1}
          value={angleDeg}
          onChange={(e) => setAngleDeg(Number(e.target.value))}
          className="w-full max-w-[280px] accent-indigo-600"
        />
      </div>

      <div className="space-y-4">
        <div
          className="rounded-2xl border-2 px-5 py-4 text-center shadow-sm transition"
          style={{ borderColor: current?.color ?? '#cbd5e1', background: current ? `${current.color}14` : '#f8fafc' }}
        >
          <div className="text-sm text-slate-500">Góc hiện tại {angleDeg}° là</div>
          <div className="text-2xl font-bold" style={{ color: current?.color ?? '#64748b' }}>
            {current?.name ?? 'Chưa xác định'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ANGLE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setAngleDeg(t.example)}
              className={`rounded-2xl border-2 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                current?.id === t.id ? '' : 'border-transparent'
              }`}
              style={current?.id === t.id ? { borderColor: t.color, background: `${t.color}10` } : undefined}
            >
              <div className="flex items-center gap-2">
                <MiniAngleIcon deg={t.example} color={t.color} />
                <div>
                  <div className="text-sm font-bold text-slate-700">{t.name}</div>
                  <div className="font-mono text-xs text-slate-400">{t.range}</div>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniAngleIcon({ deg, color }: { deg: number; color: string }) {
  const cx = 20
  const cy = 34
  const len = 26
  const [rx, ry] = polarToCartesian(cx, cy, len, deg)
  const [bx, by] = polarToCartesian(cx, cy, len, 0)
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="shrink-0">
      {deg > 0 && deg < 360 && <path d={arcPath(cx, cy, 12, 0, deg)} fill="none" stroke={color} strokeWidth={2} />}
      <line x1={cx} y1={cy} x2={bx} y2={by} stroke="#1e293b" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={rx} y2={ry} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}
