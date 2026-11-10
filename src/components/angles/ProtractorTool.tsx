import { useEffect, useRef, useState } from 'react'
import { angleOfPoint, arcPath, polarToCartesian } from '../../utils/angleMath'
import { clientToSvg } from '../../utils/svgPoint'
import { Fold } from '../common/StudyLayout'
import protractorUrl from '../../assets/protractor.png'

type P = [number, number]

const W = 440
const H = 380
const VERTEX: P = [220, 250]
const RAY_LEN = 212
const TOLERANCE = 2

/*
 * protractor.png (photo of a real protractor, background made transparent). Measured on the photo:
 * the centre mark is at (236.5, 323.5), the baseline is level, the plastic edge is 230 px from the centre and the
 * degree marks sit at about 200–226 px. The inner black scale has 0° on the right, the outer red one 0° on the left.
 */
const IMG_W = 500
const IMG_H = 366
const IMG_CENTER: P = [236.5, 323.5]
const IMG_EDGE_R = 230
const IMG_TICK_R = 212
const PROT_R = 150
const SCALE = PROT_R / IMG_EDGE_R
const TICK_R = IMG_TICK_R * SCALE

type Mode = 'draw' | 'measure' | 'free'
interface Pose {
  x: number
  y: number
  /** Turn of the protractor, degrees anticlockwise (0 = baseline horizontal, 0° of the black scale on the right). */
  rot: number
}

const norm180 = (d: number) => {
  let a = ((d % 360) + 360) % 360
  if (a > 180) a -= 360
  return a
}
const randInt = (a: number, b: number) => Math.round(a + Math.random() * (b - a))
const randomTarget = () => randInt(3, 33) * 5

/** A pose next to the angle, slightly turned, so the pupil has to slide and turn it into place. */
const offPose = (base: number): Pose => ({ x: 178, y: 350, rot: base - 22 })

const STEPS = [
  'Đặt tâm của thước (điểm giữa cạnh thẳng) trùng với đỉnh O của góc.',
  'Xoay thước để cạnh thẳng nằm dọc theo cạnh OA, vạch 0 của vòng số màu đen nằm trên OA.',
  'Cạnh OB đi qua vạch nào trên vòng số màu đen thì đó là số đo của góc AOB.',
]

export default function ProtractorTool() {
  const [mode, setMode] = useState<Mode>('draw')
  const [target, setTarget] = useState(randomTarget)
  const [base, setBase] = useState(0)
  const [open, setOpen] = useState(40)
  const [pose, setPose] = useState<Pose>({ x: VERTEX[0], y: VERTEX[1], rot: 0 })
  const [showProt, setShowProt] = useState(true)
  const [showValue, setShowValue] = useState(true)
  const [anim, setAnim] = useState<number | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<null | { kind: 'B' | 'A' | 'rot' } | { kind: 'move'; offX: number; offY: number }>(null)
  const rafRef = useRef<number | null>(null)
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const centred = Math.hypot(pose.x - VERTEX[0], pose.y - VERTEX[1]) < 0.5
  const aligned = Math.abs(norm180(pose.rot - base)) < 0.5
  const placed = centred && aligned
  const diff = Math.abs(open - target)
  const isCorrect = mode === 'draw' && diff <= TOLERANCE

  const toSvg = (e: React.PointerEvent): P => clientToSvg(svgRef.current!, e.clientX, e.clientY)

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setAnim(null)
  }

  const start = (kind: 'B' | 'A' | 'rot' | 'move') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    stopAnim()
    if (kind === 'move') {
      const [x, y] = toSvg(e)
      dragging.current = { kind, offX: x - pose.x, offY: y - pose.y }
    } else dragging.current = { kind }
  }

  const onMove = (e: React.PointerEvent) => {
    const d = dragging.current
    if (!d) return
    const [x, y] = toSvg(e)
    if (d.kind === 'B') {
      let rel = norm180(angleOfPoint(VERTEX[0], VERTEX[1], x, y) - base)
      if (rel < 0) rel = rel < -90 ? 180 : 0
      setOpen(Math.round(rel))
    } else if (d.kind === 'A') {
      const nb = Math.round(angleOfPoint(VERTEX[0], VERTEX[1], x, y))
      // a protractor that was lined up stays lined up with the angle
      if (placed) setPose((p) => ({ ...p, rot: nb }))
      setBase(nb)
    } else if (d.kind === 'move') {
      let nx = x - d.offX
      let ny = y - d.offY
      if (Math.hypot(nx - VERTEX[0], ny - VERTEX[1]) < 10) [nx, ny] = VERTEX
      setPose((p) => ({ ...p, x: nx, y: ny }))
    } else {
      let r = angleOfPoint(pose.x, pose.y, x, y) - 180
      if (Math.abs(norm180(r - base)) < 5) r = base
      setPose((p) => ({ ...p, rot: r }))
    }
  }
  const onUp = () => {
    dragging.current = null
  }

  /** "Đặt thước giúp em": slide the centre onto O, then turn the baseline onto OA. */
  const placeForMe = () => {
    stopAnim()
    setShowProt(true)
    const from = { ...pose }
    const toRot = from.rot + norm180(base - from.rot)
    const t0 = performance.now()
    const DUR = 2200
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR)
      const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2)
      const m = ease(Math.min(1, t / 0.5))
      const r = ease(Math.max(0, Math.min(1, (t - 0.55) / 0.4)))
      setPose({ x: from.x + (VERTEX[0] - from.x) * m, y: from.y + (VERTEX[1] - from.y) * m, rot: from.rot + (toRot - from.rot) * r })
      setAnim(t)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else {
        rafRef.current = null
        setPose({ x: VERTEX[0], y: VERTEX[1], rot: base })
        setAnim(null)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const takeAway = () => {
    stopAnim()
    setPose(offPose(base))
  }

  const switchMode = (m: Mode) => {
    stopAnim()
    setMode(m)
    if (m === 'draw') {
      setBase(0)
      setOpen(0)
      setTarget(randomTarget())
      setPose({ x: VERTEX[0], y: VERTEX[1], rot: 0 })
      setShowValue(true)
    } else if (m === 'measure') {
      newMeasure()
    } else {
      setShowValue(true)
    }
  }

  const newMeasure = () => {
    stopAnim()
    const b = randInt(-5, 5) * 5
    setBase(b)
    setOpen(randInt(4, 32) * 5 + randInt(0, 4))
    setPose(offPose(b))
    setShowValue(false)
  }

  const newTarget = () => {
    setTarget(randomTarget())
    setOpen(0)
  }

  /* ------------------------------------------------------------------ drawing */
  const A = polarToCartesian(VERTEX[0], VERTEX[1], RAY_LEN, base)
  const B = polarToCartesian(VERTEX[0], VERTEX[1], RAY_LEN, base + open)
  const rayColor = isCorrect ? '#16a34a' : '#6366f1'
  const midDeg = base + open / 2
  const valuePos = polarToCartesian(VERTEX[0], VERTEX[1], open < 40 ? 62 : 48, midDeg)
  const readDot = polarToCartesian(VERTEX[0], VERTEX[1], TICK_R, base + open)
  const readLabel = polarToCartesian(VERTEX[0], VERTEX[1], PROT_R + 36, base + open)
  const zeroDot = polarToCartesian(VERTEX[0], VERTEX[1], TICK_R, base)
  const targetDot = polarToCartesian(VERTEX[0], VERTEX[1], PROT_R + 8, base + target)
  const labelAt = (p: P, deg: number, d: number): P => polarToCartesian(p[0], p[1], d, deg)
  const stepDone = [centred, placed, placed]
  const activeStep = !centred ? 0 : !aligned ? 1 : 2
  const animStep = anim === null ? null : anim < 0.52 ? 0 : anim < 0.97 ? 1 : 2

  const protTransform = `translate(${pose.x} ${pose.y}) rotate(${-pose.rot})`
  /** Turning knob just past the left end of the straight edge (away from OA and from the readings). */
  const knob: P = [-PROT_R - 20, 0]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
            onPointerMove={onMove}
            onPointerUp={onUp}
          >
            {/* the angle AOB */}
            {showValue && open > 0 && (
              <path
                d={`M ${VERTEX[0]} ${VERTEX[1]} L ${polarToCartesian(VERTEX[0], VERTEX[1], 34, base).join(' ')} ${arcPath(VERTEX[0], VERTEX[1], 34, base, base + open).replace(/^M[^A]*/, '')} Z`}
                fill="#f59e0b"
                fillOpacity={0.18}
                stroke="#f59e0b"
                strokeWidth={1.5}
              />
            )}
            <line x1={VERTEX[0]} y1={VERTEX[1]} x2={A[0]} y2={A[1]} stroke="#1e293b" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={VERTEX[0]} y1={VERTEX[1]} x2={B[0]} y2={B[1]} stroke={rayColor} strokeWidth={3.5} strokeLinecap="round" />

            {/* the real protractor, drawn over the angle (it is clear plastic) */}
            {showProt && (
              <g transform={protTransform}>
                <g pointerEvents="none" style={{ filter: 'drop-shadow(1px 2px 2px rgba(15,23,42,0.22))' }}>
                  <image
                    href={protractorUrl}
                    width={IMG_W}
                    height={IMG_H}
                    transform={`scale(${SCALE}) translate(${-IMG_CENTER[0]} ${-IMG_CENTER[1]})`}
                    preserveAspectRatio="none"
                  />
                </g>
                {/* grab area: whole protractor */}
                <path
                  d={`M ${-PROT_R} 0 A ${PROT_R} ${PROT_R} 0 0 1 ${PROT_R} 0 L ${PROT_R} 13 L ${-PROT_R} 13 Z`}
                  fill="transparent"
                  className="cursor-move"
                  onPointerDown={start('move')}
                />
                {/* centre mark */}
                <circle cx={0} cy={0} r={3} fill={centred ? '#16a34a' : '#e11d48'} pointerEvents="none" />
                {/* turning knob */}
                <g className="cursor-grab active:cursor-grabbing" onPointerDown={start('rot')}>
                  <line x1={-PROT_R} y1={0} x2={knob[0]} y2={knob[1]} stroke="#0ea5e9" strokeWidth={2} />
                  <circle cx={knob[0]} cy={knob[1]} r={10} fill="#0ea5e9" stroke="#fff" strokeWidth={2} />
                  <text x={knob[0]} y={knob[1] + 0.5} fontSize={12} textAnchor="middle" dominantBaseline="central" fill="#fff" pointerEvents="none">
                    ⟲
                  </text>
                </g>
              </g>
            )}

            {/* reading on the protractor once it is placed properly */}
            {showProt && placed && (
              <g pointerEvents="none">
                <circle cx={zeroDot[0]} cy={zeroDot[1]} r={4} fill="#1e293b" stroke="#fff" strokeWidth={1.5} />
                <circle cx={readDot[0]} cy={readDot[1]} r={5} fill="#dc2626" stroke="#fff" strokeWidth={1.5} />
                <Callout x={readLabel[0]} y={readLabel[1]} text={`${open}°`} color="#dc2626" />
              </g>
            )}

            {mode === 'draw' && (
              <circle cx={targetDot[0]} cy={targetDot[1]} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} pointerEvents="none" />
            )}

            {/* names */}
            <Name p={labelAt(VERTEX, base + open / 2 + 180, 16)} text="O" />
            <Name p={labelAt(A, base - 90, 13)} text="A" />
            <Name p={labelAt(B, base + open + 90, 13)} text="B" />
            {showValue && open > 0 && <Callout x={valuePos[0]} y={valuePos[1]} text={`${open}°`} color="#b45309" small />}

            {/* handles */}
            <circle cx={VERTEX[0]} cy={VERTEX[1]} r={4.5} fill="#1e293b" pointerEvents="none" />
            {mode !== 'measure' && (
              <circle
                cx={B[0]}
                cy={B[1]}
                r={13}
                fill={rayColor}
                fillOpacity={0.2}
                stroke={rayColor}
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={start('B')}
              />
            )}
            {mode === 'free' && (
              <circle
                cx={A[0]}
                cy={A[1]}
                r={12}
                fill="#1e293b"
                fillOpacity={0.12}
                stroke="#1e293b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={start('A')}
              />
            )}
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">
          {mode === 'measure'
            ? 'Kéo thước để di chuyển, kéo núm xanh ⟲ để xoay thước. Đặt đúng chỗ, thước sẽ tự hít vào.'
            : mode === 'draw'
              ? 'Kéo chấm tím (đầu cạnh OB) đến đúng vạch trên vòng số màu đen.'
              : 'Kéo đầu cạnh OB (tím) để mở góc, kéo đầu cạnh OA (đen) để xoay cả góc.'}
        </p>
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            onClick={() => setShowProt((v) => !v)}
            aria-pressed={showProt}
            className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
              showProt ? 'bg-white text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50' : 'bg-sky-600 text-white'
            }`}
          >
            📐 {showProt ? 'Ẩn thước đo độ' : 'Hiện thước đo độ'}
          </button>
          <button
            onClick={() => setShowValue((v) => !v)}
            aria-pressed={showValue}
            className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
              showValue ? 'bg-amber-500 text-white' : 'bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50'
            }`}
          >
            🔢 {showValue ? 'Ẩn số đo trên hình' : 'Hiện số đo trên hình'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-indigo-50 p-1">
          {(
            [
              ['draw', '✏️ Vẽ góc'],
              ['measure', '📐 Đo góc'],
              ['free', '🔓 Tự do'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-xl px-2 py-2 text-sm font-semibold transition ${mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-500 hover:text-indigo-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'draw' && (
          <div
            className={`rounded-2xl border-2 px-5 py-4 text-center shadow-sm transition ${
              isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-indigo-100 bg-white'
            }`}
          >
            <div className="text-sm text-slate-500">Hãy vẽ một góc có số đo</div>
            <div className="text-3xl font-bold text-indigo-600">{target}°</div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Bạn đang vẽ: <span className="font-mono font-semibold text-slate-700">{open}°</span>
            </div>
            <p className={`mt-2 text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isCorrect ? '✅ Chính xác! Đúng góc rồi!' : diff <= 10 ? '↺ Gần đúng rồi, chỉnh thêm chút nữa!' : '↺ Kéo chấm tím tới vạch có chấm cam'}
            </p>
            <button onClick={newTarget} className="mt-3 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500">
              🎲 Góc mới
            </button>
          </div>
        )}

        {mode === 'measure' && (
          <div className={`rounded-2xl border-2 px-5 py-4 text-center shadow-sm transition ${placed ? 'border-emerald-400 bg-emerald-50' : 'border-indigo-100 bg-white'}`}>
            <div className="text-sm text-slate-500">Dùng thước đo độ để đo góc</div>
            <div className="text-3xl font-bold text-indigo-600">AOB = {placed && showProt ? `${open}°` : '?'}</div>
            <p className={`mt-2 text-sm font-semibold ${placed ? 'text-emerald-600' : 'text-slate-400'}`}>
              {!showProt
                ? 'Bấm "Hiện thước đo độ" để đo nhé.'
                : placed
                  ? `✅ Đặt thước đúng! Cạnh OB đi qua vạch ${open}° trên vòng số màu đen.`
                  : `Làm theo bước ${activeStep + 1} ở dưới.`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button onClick={newMeasure} className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500">
                🎲 Góc khác
              </button>
              <button onClick={takeAway} className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                ↩ Đặt thước ra ngoài
              </button>
            </div>
          </div>
        )}

        {mode === 'free' && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
            <div className="text-sm text-slate-500">Số đo góc AOB</div>
            <div className="text-3xl font-bold text-indigo-600">{open}°</div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button onClick={takeAway} className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                ↩ Đặt thước ra ngoài
              </button>
            </div>
          </div>
        )}

        {/* how to place the protractor */}
        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cách đặt thước đo độ</span>
            <button
              onClick={placeForMe}
              disabled={anim !== null}
              className="shrink-0 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
            >
              {anim !== null ? '✨ Đang đặt…' : '▶ Đặt thước giúp em'}
            </button>
          </div>
          <ol className="space-y-1.5">
            {STEPS.map((s, i) => {
              const done = stepDone[i] && showProt
              const now = animStep === i || (animStep === null && showProt && activeStep === i && !placed)
              return (
                <li
                  key={i}
                  className={`flex gap-2 rounded-lg px-2.5 py-1.5 text-sm leading-relaxed transition ${
                    now ? 'bg-sky-50 font-semibold text-sky-800 ring-1 ring-sky-200' : done ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <span className="shrink-0">{done ? '✅' : `${i + 1}.`}</span>
                  <span>
                    {s}
                    {i === 2 && placed && showProt && <b className="text-rose-600"> → {open}°</b>}
                  </span>
                </li>
              )
            })}
          </ol>
          {placed && showProt && open > 0 && open < 180 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              ⚠️ Đừng đọc nhầm vòng số màu đỏ! Vòng đỏ bắt đầu từ 0 ở phía bên kia, nên tại cạnh OB nó ghi {180 - open}° (= 180° − {open}°).
            </p>
          )}
        </div>

        <Fold title="📏 Cách vẽ góc bằng thước đo độ">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Vẽ tia OA. Đặt tâm thước trùng với điểm O, cạnh thẳng của thước nằm trên tia OA (vạch 0 ở phía A).</li>
            <li>Tìm vạch chia ứng với số đo góc cần vẽ trên vòng số bắt đầu từ 0 ở phía A.</li>
            <li>Đánh dấu điểm B tại vạch đó, bỏ thước ra rồi vẽ tia OB — ta được góc AOB cần vẽ.</li>
          </ol>
        </Fold>
      </div>
    </div>
  )
}

function Name({ p, text }: { p: P; text: string }) {
  return (
    <text
      x={p[0]}
      y={p[1]}
      fontSize={15}
      fontWeight={800}
      fill="#1e293b"
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={4}
      paintOrder="stroke"
      pointerEvents="none"
    >
      {text}
    </text>
  )
}

function Callout({ x, y, text, color, small }: { x: number; y: number; text: string; color: string; small?: boolean }) {
  const w = text.length * (small ? 8 : 9.5) + 12
  const h = small ? 20 : 24
  return (
    <g pointerEvents="none">
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill="#fff" stroke={color} strokeWidth={2} />
      <text x={x} y={y + 0.5} fontSize={small ? 13 : 15} fontWeight={800} fill={color} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  )
}
