import { useRef, useState } from 'react'
import { angleOfPoint, polarToCartesian } from '../../utils/angleMath'

const CX = 200
const CY = 230
const OUTER_R = 170
const RAY_LEN = 165
const TOLERANCE = 3

function randomTarget() {
  const steps = Math.round((15 + Math.random() * 150) / 5)
  return steps * 5
}

export default function ProtractorTool() {
  const [freeMode, setFreeMode] = useState(false)
  const [target, setTarget] = useState(randomTarget)
  const [angleDeg, setAngleDeg] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const diff = Math.abs(angleDeg - target)
  const isCorrect = !freeMode && diff <= TOLERANCE

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scale = 400 / rect.width
    return [(clientX - rect.left) * scale, (clientY - rect.top) * scale]
  }

  const updateFromPoint = (clientX: number, clientY: number) => {
    const [x, y] = clientToLocal(clientX, clientY)
    let deg = angleOfPoint(CX, CY, x, y)
    if (deg > 180) deg = deg < 270 ? 180 : 0
    setAngleDeg(Math.round(deg))
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

  const newTarget = () => {
    setTarget(randomTarget())
    setAngleDeg(0)
  }

  const ticks = []
  for (let d = 0; d <= 180; d += 5) {
    const isMajor = d % 10 === 0
    const inner = isMajor ? OUTER_R - 20 : OUTER_R - 12
    const [x1, y1] = polarToCartesian(CX, CY, OUTER_R, d)
    const [x2, y2] = polarToCartesian(CX, CY, inner, d)
    ticks.push(<line key={`t${d}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={isMajor ? 1.5 : 1} />)
    if (isMajor) {
      const [lx, ly] = polarToCartesian(CX, CY, OUTER_R + 16, d)
      ticks.push(
        <text key={`l${d}`} x={lx} y={ly} fontSize={11} fontWeight={600} fill="#334155" textAnchor="middle" dominantBaseline="middle">
          {d}
        </text>,
      )
    }
  }

  const [rayX, rayY] = polarToCartesian(CX, CY, RAY_LEN, angleDeg)
  const [targetX, targetY] = polarToCartesian(CX, CY, OUTER_R + 4, target)

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
          <svg
            ref={svgRef}
            width={340}
            height={250}
            viewBox="0 0 400 245"
            className="touch-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <path
              d={`M ${CX - OUTER_R} ${CY} A ${OUTER_R} ${OUTER_R} 0 0 1 ${CX + OUTER_R} ${CY} Z`}
              fill="#eef2ff"
              stroke="#c7d2fe"
              strokeWidth={2}
            />
            {ticks}
            <line x1={CX - OUTER_R - 4} y1={CY} x2={CX + OUTER_R + 4} y2={CY} stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />

            {!freeMode && (
              <>
                <line x1={CX} y1={CY} x2={targetX} y2={targetY} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" />
                <circle cx={targetX} cy={targetY} r={4} fill="#f59e0b" />
              </>
            )}

            <line x1={CX} y1={CY} x2={rayX} y2={rayY} stroke={isCorrect ? '#16a34a' : '#6366f1'} strokeWidth={4} strokeLinecap="round" />
            <circle cx={CX} cy={CY} r={5} fill="#1e293b" />
            <circle
              cx={rayX}
              cy={rayY}
              r={13}
              fill={isCorrect ? '#16a34a' : '#6366f1'}
              fillOpacity={0.2}
              stroke={isCorrect ? '#16a34a' : '#6366f1'}
              strokeWidth={2}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={onHandlePointerDown}
            />
          </svg>
        </div>
        <p className="text-center text-xs text-slate-400">Kéo chấm xanh theo đúng vạch trên thước đo độ</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chế độ</div>
            <div className="text-sm font-medium text-slate-600">{freeMode ? 'Tự do khám phá' : 'Luyện tập theo mục tiêu'}</div>
          </div>
          <button
            onClick={() => setFreeMode((v) => !v)}
            className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
          >
            {freeMode ? 'Chuyển sang luyện tập' : 'Chuyển sang tự do'}
          </button>
        </div>

        {!freeMode && (
          <div
            className={`rounded-2xl border-2 px-5 py-4 text-center shadow-sm transition ${
              isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-indigo-100 bg-white'
            }`}
          >
            <div className="text-sm text-slate-500">Hãy vẽ một góc có số đo</div>
            <div className="text-3xl font-bold text-indigo-600">{target}°</div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Bạn đang vẽ: <span className="font-mono font-semibold text-slate-700">{angleDeg}°</span>
            </div>
            <p className={`mt-2 text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isCorrect ? '✅ Chính xác! Đúng góc rồi!' : diff <= 10 ? '↺ Gần đúng rồi, chỉnh thêm chút nữa!' : '↺ Kéo chấm xanh để khớp với vạch cam'}
            </p>
            <button onClick={newTarget} className="mt-3 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500">
              🎲 Góc mới
            </button>
          </div>
        )}

        {freeMode && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
            <div className="text-sm text-slate-500">Số đo góc hiện tại</div>
            <div className="text-3xl font-bold text-indigo-600">{angleDeg}°</div>
            <p className="mt-2 text-sm text-slate-400">Kéo tự do để tập đọc số đo trên thước đo độ</p>
          </div>
        )}

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">Cách vẽ góc bằng thước đo độ</div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Đặt tâm thước trùng với đỉnh góc, cạnh 0° trùng với một cạnh có sẵn của góc.</li>
            <li>Tìm vạch chia ứng với số đo góc cần vẽ trên vành thước.</li>
            <li>Đánh dấu điểm tại vạch đó, rồi nối đỉnh góc với điểm vừa đánh dấu — đó chính là cạnh còn lại của góc.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
