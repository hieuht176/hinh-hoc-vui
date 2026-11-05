import { useEffect, useRef, useState } from 'react'
import { clamp } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'

const X0 = 90
const Y0 = 40
const MAX_OFFSET = 55

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function HalfSplitDemo() {
  const [W, setW] = useState(220)
  const [H, setH] = useState(140)
  const [t, setT] = useState(0) // 0 = joined, 1 = split apart, 2 = overlaid
  const rafRef = useRef<number | null>(null)
  const dragging = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const goTo = (target: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const from = t
    const start = performance.now()
    const duration = 700
    const step = (now: number) => {
      const raw = Math.min(1, (now - start) / duration)
      setT(from + (target - from) * easeInOutCubic(raw))
      if (raw < 1) rafRef.current = requestAnimationFrame(step)
      else rafRef.current = null
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const TL: [number, number] = [X0, Y0]
  const TR: [number, number] = [X0 + W, Y0]
  const BL: [number, number] = [X0, Y0 + H]
  const BR: [number, number] = [X0 + W, Y0 + H]
  const M: [number, number] = [(TL[0] + BR[0]) / 2, (TL[1] + BR[1]) / 2]
  const diagLen = Math.hypot(W, H) || 1
  const p: [number, number] = [H / diagLen, -W / diagLen]

  const offset1 = Math.min(t, 1) * MAX_OFFSET
  const g1Transform = `translate(${p[0] * offset1} ${p[1] * offset1})`

  let g2Transform: string
  if (t <= 1) {
    const offset2 = -t * MAX_OFFSET
    g2Transform = `translate(${p[0] * offset2} ${p[1] * offset2})`
  } else {
    const p2 = t - 1
    const scalar = -MAX_OFFSET + p2 * 2 * MAX_OFFSET
    const rotation = p2 * 180
    const cx = M[0] + p[0] * scalar
    const cy = M[1] + p[1] * scalar
    g2Transform = `translate(${cx} ${cy}) rotate(${rotation}) translate(${-M[0]} ${-M[1]})`
  }

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    return clientToSvg(svgRef.current!, clientX, clientY)
  }
  const onCornerPointerDown = (e: React.PointerEvent) => {
    if (t !== 0) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = true
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const [x, y] = clientToLocal(e.clientX, e.clientY)
    setW(clamp(x - X0, 90, 300))
    setH(clamp(y - Y0, 70, 220))
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const area = W * H
  const half = area / 2
  const stageLabel = t < 0.3 ? 'joined' : t < 1.3 ? 'split' : 'overlaid'

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox="0 0 420 280"
            className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {t === 0 && <rect x={X0} y={Y0} width={W} height={H} fill="none" stroke="#cbd5e1" strokeDasharray="5 4" strokeWidth={1.5} />}

            <g transform={g1Transform}>
              <polygon points={`${TL.join(',')} ${TR.join(',')} ${BR.join(',')}`} fill="#6366f1aa" stroke="#1e293b" strokeWidth={2} strokeLinejoin="round" />
            </g>
            <g transform={g2Transform}>
              <polygon points={`${TL.join(',')} ${BL.join(',')} ${BR.join(',')}`} fill="#f9731688" stroke="#1e293b" strokeWidth={2} strokeLinejoin="round" />
            </g>

            {t === 0 && (
              <circle
                cx={BR[0]}
                cy={BR[1]}
                r={12}
                fill="#1e293b22"
                stroke="#1e293b"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={onCornerPointerDown}
              />
            )}
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">{t === 0 ? 'Kéo góc dưới-phải để đổi kích thước hình chữ nhật' : ' '}</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Số đo</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-slate-400">Hình chữ nhật</div>
              <div className="font-mono text-lg font-bold text-slate-700">{area.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Tam giác tím</div>
              <div className="font-mono text-lg font-bold text-indigo-600">{half.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Tam giác cam</div>
              <div className="font-mono text-lg font-bold text-orange-500">{half.toFixed(0)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center shadow-sm">
          <div className="text-sm text-slate-500">Đường chéo chia hình chữ nhật thành 2 tam giác bằng nhau</div>
          <div className="text-xl font-bold text-emerald-600">S(tam giác) = ½ × S(hình chữ nhật) = ½ × dài × rộng</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => goTo(0)}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            ↺ Về hình chữ nhật
          </button>
          <button
            onClick={() => goTo(1)}
            className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
          >
            ✂️ Tách rời hai tam giác
          </button>
          <button
            onClick={() => goTo(2)}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
          >
            🔄 Chồng lên nhau để so sánh
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
          {stageLabel === 'joined' && (
            <p>Hình chữ nhật có đường chéo chia thành 2 tam giác vuông. Bấm <b>"Tách rời"</b> để xem rõ từng tam giác.</p>
          )}
          {stageLabel === 'split' && (
            <p>Hai tam giác đã tách rời — mỗi tam giác chiếm đúng một nửa hình chữ nhật. Bấm <b>"Chồng lên nhau"</b> để kiểm chứng chúng bằng nhau tuyệt đối.</p>
          )}
          {stageLabel === 'overlaid' && (
            <p>Xoay tam giác cam 180° quanh trung điểm đường chéo, nó khớp <b>chính xác</b> lên tam giác tím — chứng tỏ hai tam giác bằng nhau, mỗi tam giác đúng bằng nửa diện tích hình chữ nhật.</p>
          )}
        </div>
      </div>
    </div>
  )
}
