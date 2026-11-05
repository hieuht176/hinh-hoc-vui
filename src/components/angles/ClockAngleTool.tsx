import { useEffect, useRef, useState } from 'react'
import { classifyAngle } from '../../data/angleTypes'
import { clientToSvg } from '../../utils/svgPoint'
import { Fold } from '../common/StudyLayout'

const SIZE = 380
const CX = SIZE / 2
const CY = SIZE / 2
const FACE_R = 165
const HOUR_LEN = 92
const MINUTE_LEN = 153
const ARC_R = 42
const HOUR_COLOR = '#f97316'
const MINUTE_COLOR = '#4f46e5'

/**
 * One clock hand: a coloured bar ending in an arrow head whose tip points exactly at the hour / minute,
 * plus a wide invisible strip along the whole hand so it is easy to grab anywhere.
 */
function ClockHand({
  deg,
  length,
  width,
  head,
  color,
  onPointerDown,
}: {
  deg: number
  length: number
  width: number
  head: number
  color: string
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const [tx, ty] = clockPoint(deg, length)
  const [bx, by] = clockPoint(deg, length - head * 1.6)
  const [lx, ly] = clockPoint(deg - 90, head)
  const [rx, ry] = clockPoint(deg + 90, head)
  // Corners of the arrow head = base point ± half-width at right angles to the hand.
  const left: [number, number] = [bx + (lx - CX), by + (ly - CY)]
  const right: [number, number] = [bx + (rx - CX), by + (ry - CY)]
  return (
    <g className="cursor-grab active:cursor-grabbing" onPointerDown={onPointerDown}>
      <line x1={CX} y1={CY} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${tx},${ty} ${left[0]},${left[1]} ${right[0]},${right[1]}`} fill={color} stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
      <line x1={CX} y1={CY} x2={tx} y2={ty} stroke="transparent" strokeWidth={28} strokeLinecap="round" />
    </g>
  )
}

type Mode = 'simple' | 'real'

/** Point at `deg` degrees measured clockwise from 12 o'clock. */
function clockPoint(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)]
}

/** Clockwise-from-12 angle (0–360) of a point on the SVG. */
function clockAngleOf(x: number, y: number): number {
  const deg = (Math.atan2(x - CX, -(y - CY)) * 180) / Math.PI
  return (deg + 360) % 360
}

/** Vietnamese number format: 5.5 → "5,5". */
function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')
}

function timeLabel(total: number): string {
  const h = Math.floor(total / 60) % 12
  const m = total % 60
  return `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`
}

function handAngles(total: number, mode: Mode) {
  const minute = (total % 60) * 6
  const hour = mode === 'real' ? (total % 720) * 0.5 : (Math.floor(total / 60) % 12) * 30
  return { hour, minute }
}

function angleBetween(total: number, mode: Mode) {
  const { hour, minute } = handAngles(total, mode)
  const d = Math.abs(hour - minute) % 360
  const small = Math.min(d, 360 - d)
  return { small, large: 360 - small }
}

const PRESETS = [0, 60, 120, 180, 240, 360, 540, 630]
const CHALLENGE_TARGETS = [0, 30, 60, 90, 120, 150, 180]

export default function ClockAngleTool() {
  const [total, setTotal] = useState(180) // minutes after 12:00, 0–719 (3:00 like the textbook picture)
  const [mode, setMode] = useState<Mode>('simple')
  const [showLarge, setShowLarge] = useState(false)
  const [challenge, setChallenge] = useState<number | null>(null)
  const [found, setFound] = useState<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<null | 'hour' | 'minute'>(null)

  const { hour, minute } = handAngles(total, mode)
  const { small, large } = angleBetween(total, mode)
  const smallType = small === 0 ? null : classifyAngle(small)
  const largeType = large === 360 ? null : classifyAngle(large)
  const arcColor = smallType?.color ?? '#64748b'

  const isChallengeHit = challenge !== null && small === challenge
  const nowLabel = timeLabel(total)
  useEffect(() => {
    // Remember every distinct time the class discovers for the current target angle.
    if (isChallengeHit) setFound((f) => (f.includes(nowLabel) ? f : [...f, nowLabel]))
  }, [isChallengeHit, nowLabel])

  const setTime = (t: number) => setTotal(((t % 720) + 720) % 720)

  const toLocal = (clientX: number, clientY: number): [number, number] => {
    return clientToSvg(svgRef.current!, clientX, clientY)
  }

  const onPointerDown = (which: 'hour' | 'minute') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = which
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const [x, y] = toLocal(e.clientX, e.clientY)
    const deg = clockAngleOf(x, y)
    if (drag.current === 'minute') {
      // Moving the minute hand past 12 carries the hour forward/back, just like a real clock.
      const newMin = Math.round(deg / 6) % 60
      let delta = newMin - (total % 60)
      if (delta > 30) delta -= 60
      if (delta < -30) delta += 60
      setTime(total + delta)
    } else if (mode === 'real') {
      setTime(Math.round(deg / 0.5))
    } else {
      const newHour = Math.round(deg / 30) % 12
      setTime(newHour * 60 + (total % 60))
    }
  }

  const onPointerUp = () => {
    drag.current = null
  }

  const newChallenge = () => {
    const options = CHALLENGE_TARGETS.filter((t) => t !== challenge)
    setChallenge(options[Math.floor(Math.random() * options.length)])
    setFound([])
  }

  // Arc for the smaller angle, drawn clockwise from whichever hand comes first.
  const cw = (minute - hour + 360) % 360
  const arcStart = cw <= 180 ? hour : minute
  const [ax1, ay1] = clockPoint(arcStart, ARC_R)
  const [ax2, ay2] = clockPoint(arcStart + small, ARC_R)
  const smallArc = small > 0 ? `M ${CX} ${CY} L ${ax1} ${ay1} A ${ARC_R} ${ARC_R} 0 0 1 ${ax2} ${ay2} Z` : ''
  const LARGE_R = ARC_R + 18
  const [lx1, ly1] = clockPoint(arcStart + small, LARGE_R)
  const [lx2, ly2] = clockPoint(arcStart + 360, LARGE_R)
  const largeArc = large < 360 ? `M ${lx1} ${ly1} A ${LARGE_R} ${LARGE_R} 0 ${large > 180 ? 1 : 0} 1 ${lx2} ${ly2}` : ''

  const ticks = []
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0
    const [x1, y1] = clockPoint(i * 6, FACE_R - 4)
    const [x2, y2] = clockPoint(i * 6, FACE_R - (major ? 18 : 10))
    ticks.push(<line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={major ? 3 : 1.2} />)
  }
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i
    const [x, y] = clockPoint(i * 30, FACE_R - 38)
    return (
      <text
        key={`n${n}`}
        x={x}
        y={y}
        fontSize={24}
        fontWeight={600}
        fill="#1e293b"
        textAnchor="middle"
        dominantBaseline="central"
        stroke="#fff"
        strokeWidth={4}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {n}
      </text>
    )
  })

  // Right-angle square marker (like the textbook convention) when the hands are perpendicular.
  let rightMarker = null
  if (small === 90) {
    const s = 18
    const [p1x, p1y] = clockPoint(arcStart, s)
    const [p3x, p3y] = clockPoint(arcStart + 90, s)
    const p2x = p1x + p3x - CX
    const p2y = p1y + p3y - CY
    rightMarker = <path d={`M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`} fill="none" stroke="#0f172a" strokeWidth={2} />
  }

  const [lblX, lblY] = clockPoint(arcStart + small / 2, ARC_R + 26)

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
            onPointerLeave={onPointerUp}
          >
            <circle cx={CX} cy={CY} r={FACE_R + 10} fill="#be185d" />
            <circle cx={CX} cy={CY} r={FACE_R} fill="#fff" stroke="#f9a8d4" strokeWidth={3} />
            {ticks}

            {smallArc && <path d={smallArc} fill={arcColor} fillOpacity={0.25} stroke={arcColor} strokeWidth={2} />}
            {showLarge && largeArc && <path d={largeArc} fill="none" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="6 4" />}
            {rightMarker}

            <ClockHand deg={hour} length={HOUR_LEN} width={10} head={13} color={HOUR_COLOR} onPointerDown={onPointerDown('hour')} />
            <ClockHand deg={minute} length={MINUTE_LEN} width={6} head={11} color={MINUTE_COLOR} onPointerDown={onPointerDown('minute')} />
            <circle cx={CX} cy={CY} r={8} fill="#be185d" stroke="#fff" strokeWidth={2} />
            {numbers}

            {small > 0 && (
              <text x={lblX} y={lblY} fontSize={15} fontWeight={700} fill={arcColor} textAnchor="middle" dominantBaseline="central">
                {fmt(small)}°
              </text>
            )}

          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">
          Kéo <span className="font-semibold text-indigo-600">kim dài màu xanh</span> (kim phút) hoặc{' '}
          <span className="font-semibold text-orange-500">kim ngắn màu cam</span> (kim giờ) · đầu mũi tên chỉ vào số
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => setTime(total - 60)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            −1 giờ
          </button>
          <button onClick={() => setTime(total - 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            −1 phút
          </button>
          <div className="min-w-20 rounded-lg bg-slate-800 px-3 py-1.5 text-center font-mono text-xl font-bold text-white">{nowLabel}</div>
          <button onClick={() => setTime(total + 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            +1 phút
          </button>
          <button onClick={() => setTime(total + 60)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            +1 giờ
          </button>
        </div>
        <div className="flex max-w-sm flex-wrap justify-center gap-2">
          {PRESETS.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition hover:scale-105 ${
                total === t ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {timeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Kiểu đồng hồ</div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['simple', 'Đơn giản: kim giờ chỉ đúng vạch số'],
                ['real', 'Đồng hồ thật: kim giờ nhích dần'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  mode === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {mode === 'simple'
              ? 'Kim giờ đứng yên ở vạch số của giờ, phù hợp khi mới học (ví dụ lúc 3:30 kim giờ vẫn chỉ số 3).'
              : 'Giống đồng hồ thật: mỗi phút kim phút quay 6°, kim giờ quay 0,5° (lúc 3:30 kim giờ nằm giữa số 3 và số 4).'}
          </p>
        </div>

        <div className="rounded-2xl border-2 px-5 py-4 text-center shadow-sm" style={{ borderColor: arcColor, backgroundColor: `${arcColor}10` }}>
          <div className="text-sm text-slate-500">Lúc {nowLabel}, góc nhỏ giữa hai kim là</div>
          <div className="text-4xl font-bold" style={{ color: arcColor }}>
            {fmt(small)}°
          </div>
          <div className="mt-1 text-base font-semibold text-slate-700">
            {smallType ? smallType.name : 'Hai kim trùng nhau'}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showLarge} onChange={(e) => setShowLarge(e.target.checked)} className="accent-violet-600" />
            Hiện cả góc phía ngoài (phần còn lại của vòng tròn)
          </label>
          {showLarge && (
            <div className="mt-2 text-sm text-violet-600">
              Góc phía ngoài: <span className="font-mono font-bold">{fmt(large)}°</span>
              {largeType ? ` — ${largeType.name}` : ' — tròn một vòng'} · {fmt(small)}° + {fmt(large)}° = 360°
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Thử thách</div>
            <button onClick={newChallenge} className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-500">
              🎲 {challenge === null ? 'Bắt đầu' : 'Góc khác'}
            </button>
          </div>
          {challenge === null ? (
            <p className="mt-2 text-sm text-slate-500">Bấm "Bắt đầu" để nhận một số đo góc, rồi tìm thời gian sao cho hai kim tạo thành góc đó.</p>
          ) : (
            <div className="mt-2 text-sm text-slate-600">
              <p>
                Tìm thời gian để hai kim tạo góc <span className="text-lg font-bold text-indigo-600">{challenge}°</span>. Có bao nhiêu cách?
              </p>
              <p className={`mt-1 font-semibold ${isChallengeHit ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isChallengeHit ? `✅ Đúng rồi! Lúc ${nowLabel} hai kim tạo góc ${challenge}°.` : '↺ Xoay kim để tìm…'}
              </p>
              {found.length > 0 && (
                <p className="mt-1">
                  Các thời gian đã tìm được: <span className="font-mono font-semibold">{found.join(' · ')}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <Fold title="💡 Mẹo tính nhanh">
          <ul className="list-disc space-y-1 pl-4">
            <li>Cả mặt đồng hồ là một vòng tròn 360°, chia thành 12 khoảng bằng nhau → mỗi khoảng giữa hai số liền nhau là 360° : 12 = 30°.</li>
            <li>Lúc 3 giờ, hai kim cách nhau 3 khoảng → 3 × 30° = 90° (góc vuông).</li>
            <li>Kim phút quay 360° trong 60 phút → 6° mỗi phút. Kim giờ quay 30° trong 60 phút → 0,5° mỗi phút.</li>
          </ul>
        </Fold>

        <Fold title="🧠 Tư duy như một nhà Toán học (câu hỏi cho cả lớp)">
          <ol className="list-[lower-alpha] space-y-3 pl-5">
            <li>
              Viết thời gian mà hai kim đồng hồ tạo thành góc <b>nhỏ nhất</b>.
              <details className="mt-1 rounded-lg bg-white/80 px-3 py-2">
                <summary className="cursor-pointer font-medium text-violet-600">Gợi ý cho giáo viên</summary>
                <p className="mt-1">
                  Lúc <b>12:00</b> hai kim trùng nhau → 0°. Có thể hỏi lớp: "0° có được xem là một góc không?". Nếu chỉ xét giờ đúng và hai kim
                  không trùng nhau thì góc nhỏ nhất là 30° (lúc 1:00 hoặc 11:00).
                </p>
                <p className="mt-1">
                  Với <b>đồng hồ thật</b> còn có góc rất nhỏ, ví dụ lúc <b>2:11</b> chỉ còn 0,5° (kim giờ ở 65,5°, kim phút ở 66°), hãy cho học
                  sinh chuyển sang chế độ "Đồng hồ thật" để kiểm tra.
                </p>
              </details>
            </li>
            <li>
              Viết thời gian mà hai kim đồng hồ tạo thành góc <b>lớn nhất</b>.
              <details className="mt-1 rounded-lg bg-white/80 px-3 py-2">
                <summary className="cursor-pointer font-medium text-violet-600">Gợi ý cho giáo viên</summary>
                <p className="mt-1">
                  Lúc <b>6:00</b> hai kim nằm thẳng hàng, ngược chiều nhau → 180° (góc bẹt). Đây là góc lớn nhất nếu ta luôn đo phần góc nhỏ
                  giữa hai kim.
                </p>
              </details>
            </li>
            <li>
              Em có thể dùng kim đồng hồ để tạo ra góc nhỏ hơn hoặc lớn hơn không? Phản biện và hoàn thiện câu trả lời của em.
              <details className="mt-1 rounded-lg bg-white/80 px-3 py-2">
                <summary className="cursor-pointer font-medium text-violet-600">Gợi ý cho giáo viên</summary>
                <p className="mt-1">
                  Bật "Hiện cả góc phía ngoài": hai kim luôn chia mặt đồng hồ thành <b>hai góc</b> có tổng 360°. Nếu xét góc phía ngoài thì có
                  thể lớn hơn 180° (góc lõm), ví dụ lúc 1:00 góc phía ngoài là 330°.
                </p>
                <p className="mt-1">
                  Câu trả lời ở câu a và b còn phụ thuộc vào cách hiểu: kim giờ nhảy theo từng giờ hay nhích dần như đồng hồ thật, và có tính
                  góc 0° hay không. Đây là điểm tốt để học sinh tranh luận và tự hoàn thiện câu trả lời.
                </p>
              </details>
            </li>
          </ol>
        </Fold>
      </div>
    </div>
  )
}
