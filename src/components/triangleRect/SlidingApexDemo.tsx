import { useRef, useState } from 'react'
import { clamp } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'
import { Fold } from '../common/StudyLayout'

const X0 = 90
const Y0 = 50

export default function SlidingApexDemo() {
  const [W, setW] = useState(240)
  const [H, setH] = useState(160)
  const [apexX, setApexX] = useState(X0 + 240 * 0.35)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const ax = clamp(apexX, X0, X0 + W)

  const TL: [number, number] = [X0, Y0]
  const TR: [number, number] = [X0 + W, Y0]
  const BL: [number, number] = [X0, Y0 + H]
  const BR: [number, number] = [X0 + W, Y0 + H]
  const Apex: [number, number] = [ax, Y0]

  const clientToLocal = (clientX: number, clientY: number): [number, number] => {
    return clientToSvg(svgRef.current!, clientX, clientY)
  }
  const onApexPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = true
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const [x] = clientToLocal(e.clientX, e.clientY)
    setApexX(clamp(x, X0, X0 + W))
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const rectArea = W * H
  const triArea = 0.5 * W * H
  const leftArea = 0.5 * H * (ax - X0)
  const rightArea = 0.5 * H * (X0 + W - ax)

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
            <rect x={X0} y={Y0} width={W} height={H} fill="none" stroke="#cbd5e1" strokeDasharray="5 4" strokeWidth={1.5} />

            <polygon points={`${TL.join(',')} ${Apex.join(',')} ${BL.join(',')}`} fill="#fbbf2477" stroke="#d97706" strokeWidth={1.5} />
            <polygon points={`${TR.join(',')} ${BR.join(',')} ${Apex.join(',')}`} fill="#fbbf2477" stroke="#d97706" strokeWidth={1.5} />
            <polygon points={`${Apex.join(',')} ${BL.join(',')} ${BR.join(',')}`} fill="#6366f1aa" stroke="#1e293b" strokeWidth={2.5} strokeLinejoin="round" />

            <line x1={ax} y1={Y0} x2={ax} y2={Y0 + H} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" />

            <circle
              cx={ax}
              cy={Y0}
              r={12}
              fill="#1e293b22"
              stroke="#1e293b"
              strokeWidth={2}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={onApexPointerDown}
            />
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">Kéo đỉnh tam giác trượt ngang — đáy và chiều cao không đổi</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-white p-3 text-center shadow-sm">
            <div className="text-xs text-slate-400">Tam giác (tím)</div>
            <div className="font-mono text-xl font-bold text-indigo-600">{triArea.toFixed(0)}</div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white p-3 text-center shadow-sm">
            <div className="text-xs text-slate-400">2 mảnh thừa (cam) cộng lại</div>
            <div className="font-mono text-xl font-bold text-amber-600">{(leftArea + rightArea).toFixed(0)}</div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center shadow-sm">
          <div className="text-sm text-slate-500">Hình chữ nhật = Tam giác + 2 mảnh thừa</div>
          <div className="text-lg font-bold text-emerald-600">
            {rectArea.toFixed(0)} = {triArea.toFixed(0)} + {(leftArea + rightArea).toFixed(0)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dù kéo đỉnh sang trái hay phải, diện tích tam giác <b>luôn giữ nguyên</b> — đúng bằng một nửa hình chữ nhật!
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <div className="mb-1 flex justify-between text-slate-500">
              <span>Đáy (chiều dài hình chữ nhật)</span>
              <span className="font-mono font-semibold text-indigo-600">{W}</span>
            </div>
            <input
              type="range"
              min={140}
              max={300}
              step={5}
              value={W}
              onChange={(e) => {
                const newW = Number(e.target.value)
                setApexX((x) => clamp(x, X0, X0 + newW))
                setW(newW)
              }}
              className="w-full accent-indigo-600"
            />
          </label>
          <label className="block text-sm">
            <div className="mb-1 flex justify-between text-slate-500">
              <span>Chiều cao</span>
              <span className="font-mono font-semibold text-indigo-600">{H}</span>
            </div>
            <input type="range" min={80} max={210} step={5} value={H} onChange={(e) => setH(Number(e.target.value))} className="w-full accent-indigo-600" />
          </label>
        </div>

        <Fold title="🤔 Vì sao lại như vậy?">
          Diện tích tam giác chỉ phụ thuộc vào <b>đáy</b> và <b>chiều cao</b>, không phụ thuộc vào việc đỉnh nằm ở đâu trên cạnh trên. Đường cao (nét
          đứt) chia hình chữ nhật thành 2 hình chữ nhật nhỏ; mỗi hình chữ nhật nhỏ lại bị cạnh tam giác chia đôi thành 2 tam giác bằng nhau —
          một nửa thuộc tam giác tím, một nửa là mảnh cam. Vì vậy tam giác tím luôn bằng đúng một nửa hình chữ nhật.
        </Fold>
      </div>
    </div>
  )
}
