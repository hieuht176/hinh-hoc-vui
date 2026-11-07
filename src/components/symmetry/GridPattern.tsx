import { useRef, useState } from 'react'
import { clientToSvg } from '../../utils/svgPoint'
import {
  AXES,
  axisById,
  completePattern,
  groupFromAxes,
  hintForAxisCount,
  orbit,
  symmetricAxes,
  type AxisId,
  type Cells,
  type SymmetryHint,
} from '../../utils/symmetry'
import { Panel, SmallBtn, ToggleBtn } from './MultiAxisShapes'

const PALETTE = [
  { name: 'xám', hex: '#8f8f94' },
  { name: 'xanh da trời', hex: '#00b4d8' },
  { name: 'vàng', hex: '#fbb12b' },
  { name: 'xanh lá', hex: '#7cc540' },
  { name: 'tím', hex: '#5b2a86' },
  { name: 'cam', hex: '#f57c22' },
  { name: 'đỏ', hex: '#e8202a' },
  { name: 'hồng', hex: '#ec4899' },
  { name: 'xanh dương', hex: '#2563eb' },
  { name: 'đen', hex: '#1e293b' },
]
const colorName = (hex: string | null) => (hex ? (PALETTE.find((p) => p.hex === hex)?.name ?? hex) : 'để trống')

type Tool = { kind: 'paint'; color: string } | { kind: 'erase' } | { kind: 'label' }
type Labels = Record<number, string>

interface Preset {
  id: string
  label: string
  n: number
  prompt: string
  cells: (n: number) => Cells
  labels?: Labels
  axes: AxisId[]
  target: number | null
}

const G = PALETTE[0].hex
const fromList = (n: number, list: [number, number, string][]) => {
  const c: Cells = Array(n * n).fill(null)
  list.forEach(([r, col, hex]) => (c[r * n + col] = hex))
  return c
}
const BOOK12: [number, number, string][] = [
  [0, 0, G],
  [0, 4, G],
  [3, 3, G],
  [4, 4, G],
]
const [CY, YE, GR, PU, OR, RE] = ['#00b4d8', '#fbb12b', '#7cc540', '#5b2a86', '#f57c22', '#e8202a']
const TILE: string[][] = [
  [CY, YE, CY, GR],
  [PU, GR, PU, OR],
  [CY, RE, OR, YE],
  [YE, RE, GR, CY],
]

const PRESETS: Preset[] = [
  {
    id: 'two-axes',
    label: 'Bài: đúng 2 trục',
    n: 5,
    prompt: 'Tô màu thêm hai ô vuông nữa để hoạ tiết sau có đúng 2 trục đối xứng.',
    cells: (n) => fromList(n, BOOK12),
    axes: [],
    target: 2,
  },
  {
    id: 'four-axes',
    label: 'Bài: ít nhất mấy ô để có 4 trục',
    n: 5,
    prompt: 'Phải tô đậm ít nhất bao nhiêu ô vuông nữa để hoạ tiết sau có đúng 4 trục đối xứng?',
    cells: (n) => fromList(n, BOOK12),
    axes: [],
    target: 4,
  },
  {
    id: 'tile',
    label: 'Bài: viên gạch 8×8, đoán màu ô A–G',
    n: 8,
    prompt:
      'Quan sát hoạ tiết viên gạch. Nếu hoạ tiết này được lấy đối xứng qua hai trục đối xứng gương, các ô A, B, C, D, E, F, G sẽ có màu gì? Tô màu phần còn lại để hoàn thiện hoạ tiết.',
    cells: (n) => fromList(n, TILE.flatMap((row, r) => row.map((hex, c) => [r, c, hex] as [number, number, string]))),
    labels: { [1 * 8 + 4]: 'A', [7 * 8 + 0]: 'B', [3 * 8 + 6]: 'C', [6 * 8 + 2]: 'D', [4 * 8 + 4]: 'E', [4 * 8 + 6]: 'F', [6 * 8 + 6]: 'G' },
    axes: ['h', 'v'],
    target: null,
  },
  { id: 'empty', label: 'Lưới trống', n: 6, prompt: '', cells: (n) => Array(n * n).fill(null), axes: ['h', 'v'], target: null },
]

const BOARD = 440
const PAD = 30

export default function GridPattern() {
  const p0 = PRESETS[0]
  const [n, setN] = useState(p0.n)
  const [cells, setCells] = useState<Cells>(() => p0.cells(p0.n))
  const [labels, setLabels] = useState<Labels>({})
  const [base, setBase] = useState<{ cells: Cells; labels: Labels }>(() => ({ cells: p0.cells(p0.n), labels: {} }))
  const [prompt, setPrompt] = useState(p0.prompt)
  const [axes, setAxes] = useState<AxisId[]>(p0.axes)
  const [mirrorPaint, setMirrorPaint] = useState(false)
  const [tool, setTool] = useState<Tool>({ kind: 'paint', color: G })
  const [showCheck, setShowCheck] = useState(false)
  const [target, setTarget] = useState<number | null>(p0.target)
  const [hint, setHint] = useState<SymmetryHint | 'none' | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const stroke = useRef<{ mode: 'paint' | 'erase'; last: number } | null>(null)

  const cs = BOARD / n
  const W = BOARD + PAD * 2
  const found = symmetricAxes(cells, n)
  const added = cells.filter((c, i) => c !== null && base.cells[i] === null).length
  const removed = cells.filter((c, i) => c === null && base.cells[i] !== null).length
  const isBlank = cells.every((c) => c === null)
  const completed = completePattern(cells, n, axes)
  const labelEntries = Object.entries(labels)
    .map(([i, l]) => [Number(i), l] as const)
    .sort((a, b) => a[1].localeCompare(b[1]))

  const loadPreset = (p: Preset) => {
    const c = p.cells(p.n)
    setN(p.n)
    setCells(c)
    setLabels(p.labels ?? {})
    setBase({ cells: c, labels: p.labels ?? {} })
    setPrompt(p.prompt)
    setAxes(p.axes)
    setTarget(p.target)
    setHint(null)
    setShowCheck(false)
    setShowAnswers(false)
    setMirrorPaint(false)
  }

  const resize = (size: number) => {
    const c: Cells = Array(size * size).fill(null)
    setN(size)
    setCells(c)
    setLabels({})
    setBase({ cells: c, labels: {} })
    setHint(null)
  }

  const cellAt = (e: React.PointerEvent): number | null => {
    const [x, y] = clientToSvg(svgRef.current!, e.clientX, e.clientY)
    const c = Math.floor((x - PAD) / cs)
    const r = Math.floor((y - PAD) / cs)
    return r >= 0 && r < n && c >= 0 && c < n ? r * n + c : null
  }

  const paint = (i: number, mode: 'paint' | 'erase') => {
    const targets = mirrorPaint && axes.length ? orbit(groupFromAxes(axes), i, n) : [i]
    const colour = mode === 'erase' || tool.kind !== 'paint' ? null : tool.color
    setCells((prev) => {
      const next = [...prev]
      targets.forEach((j) => (next[j] = colour))
      return next
    })
    setHint(null)
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const i = cellAt(e)
    if (i === null) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (tool.kind === 'label') {
      setLabels((prev) => {
        const next = { ...prev }
        if (next[i]) delete next[i]
        else {
          const used = new Set(Object.values(next))
          next[i] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !used.has(l)) ?? '?'
        }
        return next
      })
      return
    }
    const mode = tool.kind === 'erase' || cells[i] === tool.color ? 'erase' : 'paint'
    stroke.current = { mode, last: i }
    paint(i, mode)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const s = stroke.current
    if (!s) return
    const i = cellAt(e)
    if (i === null || i === s.last) return
    s.last = i
    paint(i, s.mode)
  }

  const askHint = () => {
    if (!target) return
    setHint(hintForAxisCount(cells, n, target) ?? 'none')
  }
  const applyHint = () => {
    if (!hint || hint === 'none') return
    setCells((prev) => {
      const next = [...prev]
      hint.fill.forEach((f) => (next[f.index] = f.color))
      return next
    })
    setHint(null)
    setShowCheck(true)
  }

  const hintCells = hint && hint !== 'none' ? new Map(hint.fill.map((f) => [f.index, f.color])) : null
  const mid = PAD + BOARD / 2
  const ext = 22
  const axisSeg: Record<AxisId, [number, number, number, number]> = {
    h: [PAD - ext, mid, W - PAD + ext, mid],
    v: [mid, PAD - ext, mid, W - PAD + ext],
    d1: [PAD - ext * 0.7, W - PAD + ext * 0.7, W - PAD + ext * 0.7, PAD - ext * 0.7],
    d2: [PAD - ext * 0.7, PAD - ext * 0.7, W - PAD + ext * 0.7, W - PAD + ext * 0.7],
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-20">
        {prompt && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-slate-700">{prompt}</p>}
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${W}`}
            className="mx-auto block h-auto w-full max-h-[72vh] touch-none select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => (stroke.current = null)}
            onPointerLeave={() => (stroke.current = null)}
          >
            {cells.map((c, i) => {
              const x = PAD + (i % n) * cs
              const y = PAD + Math.floor(i / n) * cs
              const h = hintCells?.get(i)
              return (
                <g key={i} className="cursor-pointer">
                  <rect x={x} y={y} width={cs} height={cs} fill={c ?? '#ffffff'} />
                  {h && (
                    <rect x={x + 3} y={y + 3} width={cs - 6} height={cs - 6} fill={h} fillOpacity={0.35} stroke="#f59e0b" strokeWidth={3} strokeDasharray="6 4" className="animate-pulse" />
                  )}
                </g>
              )
            })}
            {Array.from({ length: n + 1 }, (_, k) => (
              <g key={k} pointerEvents="none">
                <line x1={PAD} y1={PAD + k * cs} x2={PAD + BOARD} y2={PAD + k * cs} stroke="#1e293b" strokeWidth={k === 0 || k === n ? 2 : 1.2} />
                <line x1={PAD + k * cs} y1={PAD} x2={PAD + k * cs} y2={PAD + BOARD} stroke="#1e293b" strokeWidth={k === 0 || k === n ? 2 : 1.2} />
              </g>
            ))}
            {showCheck &&
              found.map((a) => {
                const [x1, y1, x2, y2] = axisSeg[a]
                return <line key={`f${a}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth={9} strokeOpacity={0.35} strokeLinecap="round" pointerEvents="none" />
              })}
            {AXES.filter((a) => axes.includes(a.id)).map((a) => {
              const [x1, y1, x2, y2] = axisSeg[a.id]
              return <line key={a.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.color} strokeWidth={3} strokeDasharray="9 6" pointerEvents="none" />
            })}
            {labelEntries.map(([i, l]) => {
              const x = PAD + (i % n) * cs + cs / 2
              const y = PAD + Math.floor(i / n) * cs + cs / 2
              return (
                <text
                  key={`l${i}`}
                  x={x}
                  y={y}
                  fontSize={Math.min(26, cs * 0.5)}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#1e293b"
                  stroke="#fff"
                  strokeWidth={4}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {l}
                </text>
              )
            })}
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500">
          Bấm hoặc kéo trên lưới để tô. Bấm lại vào ô cùng màu để xoá. {mirrorPaint && axes.length > 0 && '🪞 Đang tô đối xứng: mỗi nét tô hiện ra ở mọi vị trí đối xứng.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ToggleBtn on={showCheck} onClick={() => setShowCheck((v) => !v)} onLabel="🙈 Ẩn kiểm tra" offLabel="🔍 Kiểm tra số trục" accent="emerald" />
          <button
            onClick={() => {
              setCells(base.cells)
              setLabels(base.labels)
              setHint(null)
            }}
            className="rounded-xl bg-white px-2 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
          >
            ↺ Làm lại từ đề
          </button>
        </div>
        {showCheck && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
            {isBlank ? (
              'Lưới đang trống. Hãy tô vài ô rồi kiểm tra nhé!'
            ) : (
              <>
                Hoạ tiết có <b className="text-base">{found.length}</b> trục đối xứng
                {found.length > 0 && <>: {found.map((a) => axisById[a].label.toLowerCase()).join(', ')}</>} (vẽ màu xanh trên lưới).
                {(added > 0 || removed > 0) && (
                  <div>
                    So với đề: đã tô thêm <b>{added}</b> ô{removed > 0 && <>, xoá {removed} ô</>}.
                  </div>
                )}
                {target !== null && (
                  <div className="mt-1 font-semibold">
                    {found.length === target ? `✅ Đạt yêu cầu: đúng ${target} trục đối xứng!` : `❌ Chưa đạt: đề yêu cầu đúng ${target} trục.`}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Panel title="Bài mẫu">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => loadPreset(p)} className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
                {p.label}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm text-slate-500">
            Đề bài (GV có thể sửa)
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Gõ đề bài để chiếu cho cả lớp…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <span className="mr-1">Cỡ lưới:</span>
            {[4, 5, 6, 7, 8, 9, 10].map((s) => (
              <button
                key={s}
                onClick={() => resize(s)}
                className={`rounded-lg px-2.5 py-1 font-semibold ${n === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setBase({ cells, labels })
              setHint(null)
            }}
            className="mt-3 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-200"
          >
            📌 Lưu hình hiện tại làm đề
          </button>
          <p className="mt-1 text-xs text-slate-400">GV tô sẵn vài ô, đặt nhãn rồi bấm lưu. Học sinh làm sai có thể bấm "Làm lại từ đề".</p>
        </Panel>

        <Panel title="Bút tô">
          <div className="flex flex-wrap items-center gap-2">
            {PALETTE.map((p) => {
              const on = tool.kind === 'paint' && tool.color === p.hex
              return (
                <button
                  key={p.hex}
                  onClick={() => setTool({ kind: 'paint', color: p.hex })}
                  aria-label={`Tô màu ${p.name}`}
                  title={p.name}
                  className={`h-8 w-8 rounded-lg border-2 transition hover:scale-110 ${on ? 'scale-110 border-slate-900 ring-2 ring-indigo-300' : 'border-white shadow'}`}
                  style={{ background: p.hex }}
                />
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SmallBtn onClick={() => setTool({ kind: 'erase' })} active={tool.kind === 'erase'}>
              🧽 Tẩy
            </SmallBtn>
            <SmallBtn onClick={() => setTool({ kind: 'label' })} active={tool.kind === 'label'}>
              🔤 Đặt nhãn A, B, C…
            </SmallBtn>
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            <button
              onClick={() => {
                setCells(Array(n * n).fill(null))
                setHint(null)
              }}
              className="font-medium text-rose-500 hover:underline"
            >
              Xoá hết màu
            </button>
            {labelEntries.length > 0 && (
              <button onClick={() => setLabels({})} className="font-medium text-rose-500 hover:underline">
                Xoá hết nhãn
              </button>
            )}
          </div>
        </Panel>

        <Panel title="Trục đối xứng gương (bật cùng lúc nhiều trục)">
          <div className="grid grid-cols-2 gap-2">
            {AXES.map((a) => {
              const on = axes.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => setAxes((cur) => (on ? cur.filter((x) => x !== a.id) : [...cur, a.id]))}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-95"
                  style={on ? { background: a.color, color: '#fff' } : { background: '#f1f5f9', color: '#475569' }}
                >
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: on ? '#fff' : a.color }} />
                  {a.label}
                  <span className="ml-auto">{on ? '✓' : ''}</span>
                </button>
              )
            })}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={mirrorPaint} onChange={(e) => setMirrorPaint(e.target.checked)} className="accent-indigo-600" />
            🪞 Tô đối xứng tự động theo các trục đang bật
          </label>
          <button
            disabled={axes.length === 0}
            onClick={() => {
              setCells(completed)
              setHint(null)
            }}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            ✨ Hoàn thiện hoạ tiết qua các trục đang bật
          </button>
        </Panel>

        {labelEntries.length > 0 && (
          <Panel title="Đáp án các ô có nhãn">
            {axes.length === 0 ? (
              <p className="text-sm text-slate-500">Bật trục đối xứng để xem các ô có nhãn sẽ có màu gì.</p>
            ) : !showAnswers ? (
              <button onClick={() => setShowAnswers(true)} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600">
                👀 Hiện đáp án
              </button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {labelEntries.map(([i, l]) => (
                    <div key={l} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                      <b className="w-4">{l}</b>
                      <span className="inline-block h-5 w-5 rounded border border-slate-300" style={{ background: completed[i] ?? '#fff' }} />
                      <span className="text-slate-600">{colorName(completed[i])}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowAnswers(false)} className="mt-2 text-xs font-medium text-slate-500 hover:underline">
                  Ẩn đáp án
                </button>
              </>
            )}
          </Panel>
        )}

        <Panel title="Gợi ý cho bài tìm số trục">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            Mục tiêu: đúng
            {[1, 2, 4].map((k) => (
              <button
                key={k}
                onClick={() => {
                  setTarget(k)
                  setHint(null)
                }}
                className={`rounded-lg px-3 py-1 font-semibold ${target === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {k}
              </button>
            ))}
            trục
          </div>
          <button
            disabled={!target}
            onClick={askHint}
            className="mt-3 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-300 disabled:opacity-50"
          >
            💡 Gợi ý: tô thêm ít ô nhất
          </button>
          {hint === 'none' && <p className="mt-2 text-sm text-rose-600">Không tìm được cách chỉ tô thêm ô (có thể cần xoá bớt ô hoặc đổi màu).</p>}
          {hint && hint !== 'none' && (
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              {hint.fill.length === 0 ? (
                <p>✅ Hoạ tiết đã có đúng {target} trục rồi!</p>
              ) : (
                <p>
                  Cần tô thêm ít nhất <b className="text-base text-amber-700">{hint.fill.length}</b> ô (các ô viền cam nhấp nháy). Khi đó trục đối xứng là:{' '}
                  {hint.axes.map((a) => axisById[a].label.toLowerCase()).join(', ')}.
                </p>
              )}
              {hint.fill.length > 0 && (
                <div className="flex gap-2">
                  <SmallBtn onClick={applyHint}>🖌 Tô luôn</SmallBtn>
                  <SmallBtn onClick={() => setHint(null)}>Ẩn gợi ý</SmallBtn>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
