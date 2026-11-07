import { useRef, useState } from 'react'
import CoordinatePlane, { PLANE_RANGE, PLANE_SCALE, pxToWorld, worldToPx } from '../common/CoordinatePlane'
import { clientToSvg } from '../../utils/svgPoint'
import { pointsToPath } from '../../utils/polygon'
import { POINT_SHAPES, type PatternPart } from '../../data/pointShapes'
import { AXES, applyMat, axesInGroup, axisById, groupFromAxes, type AxisId, type Mat } from '../../utils/symmetry'

type Pt = [number, number]

/** One shape the teacher put on the grid. Points are relative to (x, y). */
interface Item {
  id: number
  name: string
  points?: Pt[]
  circleR?: number
  parts?: PatternPart[]
  hideOutline?: boolean
  color: string
  x: number
  y: number
}

interface LibraryShape {
  id: string
  name: string
  points?: Pt[]
  circleR?: number
  parts?: PatternPart[]
  hideOutline?: boolean
  color: string
}

/** Shapes from the textbook exercises (sized to whole grid squares) plus a few lopsided ones that show the flip clearly. */
const EXTRA_SHAPES: LibraryShape[] = [
  { id: 'diamond', name: 'Hình vuông xoay', color: '#38bdf8', points: [[0, 1], [1, 0], [0, -1], [-1, 0]] },
  { id: 'rect21', name: 'HCN 2×1', color: '#fb923c', points: [[-1, 0.5], [1, 0.5], [1, -0.5], [-1, -0.5]] },
  { id: 'right-tri', name: 'Tam giác vuông', color: '#a78bfa', points: [[-1.5, 1], [1.5, 1], [1.5, -1]] },
  { id: 'L', name: 'Chữ L', color: '#34d399', points: [[-1, 1.5], [0, 1.5], [0, -0.5], [1, -0.5], [1, -1.5], [-1, -1.5]] },
  { id: 'flag', name: 'Lá cờ', color: '#f87171', points: [[-1, -1.5], [-0.6, -1.5], [-0.6, 0.3], [1.2, 0.9], [-0.6, 1.5], [-1, 1.5]] },
]

const LIBRARY: LibraryShape[] = [
  ...EXTRA_SHAPES,
  ...POINT_SHAPES.map((s) => ({
    id: s.id,
    name: s.name,
    points: s.localPoints?.map(([x, y]) => [x * 0.8, y * 0.8] as Pt),
    circleR: s.radius !== undefined ? s.radius * 0.8 : undefined,
    parts: s.parts?.map((p) => scalePart(p, 0.8)),
    hideOutline: s.hideOutline,
    color: s.color,
  })),
]

const COLORS = ['#38bdf8', '#fb923c', '#a78bfa', '#34d399', '#f87171', '#facc15', '#f472b6', '#94a3b8']

/** Where new shapes go: top-left quarter first, like the textbook exercises. */
const SPOTS: Pt[] = [
  [-4, 4], [-6, 6], [-2, 6], [-6, 2], [-2, 2], [4, 4], [-4, -4], [4, -4], [-5, 5], [-3, 3],
]

let nextId = 1
const make = (s: LibraryShape, x: number, y: number, color = s.color): Item => ({
  id: nextId++,
  name: s.name,
  points: s.points?.map((p) => [...p] as Pt),
  circleR: s.circleR,
  parts: s.parts,
  hideOutline: s.hideOutline,
  color,
  x,
  y,
})
const lib = (id: string) => LIBRARY.find((s) => s.id === id)!

const PRESETS: { id: string; label: string; prompt: string; axes: AxisId[]; items: () => Item[] }[] = [
  {
    id: 'book4',
    label: 'Bài mẫu: 3 hình, 2 trục',
    prompt:
      'Sao chép và hoàn thiện hoạ tiết sau bằng cách lấy đối xứng các hình qua cả hai trục đối xứng gương cho đến khi có ba hình trong mỗi góc phần tư.',
    axes: ['h', 'v'],
    items: () => [
      make(lib('diamond'), -5, 4, '#38bdf8'),
      make(lib('rect21'), 2, 4.5, '#fb923c'),
      make(lib('right-tri'), -3.5, -2, '#a78bfa'),
    ],
  },
  {
    id: 'four-axes',
    label: 'Bông tuyết 4 trục',
    prompt: 'Bật cả 4 trục. Mỗi hình sẽ có mấy bản sao? Hãy đoán trước rồi bấm "Hiện kết quả".',
    axes: ['h', 'v', 'd1', 'd2'],
    items: () => [make(lib('L'), -2, 5, '#34d399'), make(lib('flag'), -5.5, 2, '#f87171')],
  },
  { id: 'empty', label: 'Mặt phẳng trống', prompt: '', axes: ['h', 'v'], items: () => [] },
]

export default function MultiAxisShapes() {
  const first = PRESETS[0]
  const [items, setItems] = useState<Item[]>(first.items)
  const [axes, setAxes] = useState<AxisId[]>(first.axes)
  const [prompt, setPrompt] = useState(first.prompt)
  const [selected, setSelected] = useState<number | null>(null)
  const [showImages, setShowImages] = useState(true)
  const [snap, setSnap] = useState(true)
  const [sameLook, setSameLook] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: number; offX: number; offY: number } | null>(null)

  const group = groupFromAxes(axes)
  const images: Mat[] = group.slice(1)
  const forced = axesInGroup(group).filter((a) => !axes.includes(a))
  const sel = items.find((i) => i.id === selected) ?? null

  const loadPreset = (id: string) => {
    const p = PRESETS.find((q) => q.id === id)!
    setItems(p.items())
    setAxes(p.axes)
    setPrompt(p.prompt)
    setSelected(null)
  }

  const toggleAxis = (a: AxisId) => setAxes((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))

  const addShape = (s: LibraryShape) => {
    const used = new Set(items.map((i) => `${i.x},${i.y}`))
    const [x, y] = SPOTS.find(([sx, sy]) => !used.has(`${sx},${sy}`)) ?? [-4, 4]
    const it = make(s, x, y)
    setItems((cur) => [...cur, it])
    setSelected(it.id)
  }

  const update = (id: number, f: (it: Item) => Item) => setItems((cur) => cur.map((it) => (it.id === id ? f(it) : it)))

  const rotateSel = (deg: number) => {
    if (!sel) return
    const r = (deg * Math.PI) / 180
    const rot = ([x, y]: Pt): Pt => [round(x * Math.cos(r) - y * Math.sin(r)), round(x * Math.sin(r) + y * Math.cos(r))]
    update(sel.id, (it) => ({ ...it, points: it.points?.map(rot), parts: it.parts?.map((p) => mapPart(p, rot)) }))
  }
  const scaleSel = (k: number) => {
    if (!sel) return
    const sc = ([x, y]: Pt): Pt => [round(x * k), round(y * k)]
    update(sel.id, (it) => ({
      ...it,
      points: it.points?.map(sc),
      circleR: it.circleR !== undefined ? round(it.circleR * k) : undefined,
      parts: it.parts?.map((p) => scalePart(p, k)),
    }))
  }
  const flipSel = () => {
    if (!sel) return
    const f = ([x, y]: Pt): Pt => [-x, y]
    update(sel.id, (it) => ({ ...it, points: it.points?.map(f), parts: it.parts?.map((p) => mapPart(p, f)) }))
  }
  const duplicateSel = () => {
    if (!sel) return
    const copy: Item = { ...sel, id: nextId++, x: clampPos(sel.x + 1), y: clampPos(sel.y - 1) }
    setItems((cur) => [...cur, copy])
    setSelected(copy.id)
  }
  const deleteSel = () => {
    if (!sel) return
    setItems((cur) => cur.filter((i) => i.id !== sel.id))
    setSelected(null)
  }

  const toWorld = (e: React.PointerEvent): Pt => {
    const [px, py] = clientToSvg(svgRef.current!, e.clientX, e.clientY)
    return pxToWorld(px, py)
  }
  const onItemDown = (e: React.PointerEvent, it: Item) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const [wx, wy] = toWorld(e)
    drag.current = { id: it.id, offX: wx - it.x, offY: wy - it.y }
    setSelected(it.id)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const [wx, wy] = toWorld(e)
    const s = (v: number) => clampPos(snap ? Math.round(v * 2) / 2 : round(v))
    update(d.id, (it) => ({ ...it, x: s(wx - d.offX), y: s(wy - d.offY) }))
  }

  const copiesPerShape = group.length

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-20">
        {prompt && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-slate-700">{prompt}</p>}
        <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
          <CoordinatePlane
            svgRef={svgRef}
            showAxes={false}
            showNumbers={false}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onPointerDown={() => setSelected(null)}
          >
            {showImages &&
              items.map((it) =>
                images.map((m, k) => (
                  <ItemShape key={`${it.id}-${k}`} item={it} map={(p) => applyMat(m, p)} opacity={sameLook ? 0.85 : 0.5} dashed={!sameLook} />
                )),
              )}
            {AXES.filter((a) => axes.includes(a.id) || (showImages && forced.includes(a.id))).map((a) => (
              <AxisLine key={a.id} angleDeg={a.angleDeg} color={a.color} faint={!axes.includes(a.id)} />
            ))}
            {items.map((it) => (
              <ItemShape
                key={it.id}
                item={it}
                map={(p) => p}
                opacity={0.9}
                selected={it.id === selected}
                onPointerDown={(e) => onItemDown(e, it)}
              />
            ))}
          </CoordinatePlane>
        </div>
        <p className="text-center text-sm text-slate-500">
          {sameLook
            ? 'Hình gốc và ảnh giống hệt nhau, đúng như trong sách.'
            : 'Hình gốc tô đậm, có thể kéo thả. Ảnh đối xứng tô nhạt, viền nét đứt.'}{' '}
          {showImages && items.length > 0 && (
            <>
              Mỗi hình có <b>{copiesPerShape}</b> bản (kể cả hình gốc).
            </>
          )}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ToggleBtn on={showImages} onClick={() => setShowImages((v) => !v)} onLabel="🙈 Ẩn kết quả" offLabel="👀 Hiện kết quả" accent="orange" />
          <ToggleBtn on={sameLook} onClick={() => setSameLook((v) => !v)} onLabel="🎨 Ảnh tô nhạt" offLabel="🎨 Ảnh giống hệt gốc" accent="indigo" />
        </div>
      </div>

      <div className="space-y-4">
        <Panel title="Bài mẫu">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => loadPreset(p.id)} className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
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
        </Panel>

        <Panel title="Trục đối xứng (bật cùng lúc nhiều trục)">
          <div className="grid grid-cols-2 gap-2">
            {AXES.map((a) => {
              const on = axes.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAxis(a.id)}
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
          <div className="mt-2 flex gap-2 text-xs">
            <button onClick={() => setAxes(['h', 'v', 'd1', 'd2'])} className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-200">
              Bật cả 4 trục
            </button>
            <button onClick={() => setAxes([])} className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-200">
              Tắt hết
            </button>
          </div>
          {forced.length > 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-700">
              💡 Lấy đối xứng liên tiếp qua các trục đang bật, hoạ tiết tự có thêm trục{' '}
              <b>{forced.map((a) => axisById[a].label.toLowerCase()).join(', ')}</b> (vẽ mờ trên hình).
            </p>
          )}
        </Panel>

        <Panel title="Thêm hình (bấm để thêm, có thể thêm nhiều hình)">
          <div className="flex flex-wrap gap-1.5">
            {LIBRARY.map((s) => (
              <button
                key={s.id}
                onClick={() => addShape(s)}
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-medium text-indigo-600 transition hover:scale-105 hover:bg-indigo-100 active:scale-95"
              >
                <MiniIcon shape={s} />
                {s.name}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-indigo-600" />
            Khi kéo, hình bám theo ô lưới
          </label>
        </Panel>

        <Panel title={sel ? `Hình đang chọn: ${sel.name}` : `Các hình trên lưới (${items.length})`}>
          {!sel ? (
            <p className="text-sm text-slate-500">
              {items.length === 0 ? 'Chưa có hình nào. Bấm một hình ở trên để thêm vào.' : 'Bấm vào một hình gốc trên lưới để xoay, đổi cỡ, đổi màu hoặc xoá.'}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <SmallBtn onClick={() => rotateSel(45)}>⟲ 45°</SmallBtn>
                <SmallBtn onClick={() => rotateSel(-45)}>⟳ 45°</SmallBtn>
                <SmallBtn onClick={() => rotateSel(90)}>⟲ 90°</SmallBtn>
                <SmallBtn onClick={flipSel}>⇋ Lật</SmallBtn>
                <SmallBtn onClick={() => scaleSel(0.8)}>➖ Nhỏ</SmallBtn>
                <SmallBtn onClick={() => scaleSel(1.25)}>➕ To</SmallBtn>
                <SmallBtn onClick={duplicateSel}>⧉ Nhân bản</SmallBtn>
                <SmallBtn onClick={deleteSel} danger>
                  🗑 Xoá
                </SmallBtn>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Màu:</span>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => update(sel.id, (it) => ({ ...it, color: c }))}
                    aria-label={`Màu ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${sel.color === c ? 'border-slate-800' : 'border-white shadow'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
          {items.length > 0 && (
            <button
              onClick={() => {
                setItems([])
                setSelected(null)
              }}
              className="mt-3 text-xs font-medium text-rose-500 hover:underline"
            >
              Xoá tất cả hình
            </button>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ drawing helpers */

function ItemShape({
  item,
  map,
  opacity,
  dashed,
  selected,
  onPointerDown,
}: {
  item: Item
  map: (p: Pt) => Pt
  opacity: number
  dashed?: boolean
  selected?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
}) {
  const w = (p: Pt): Pt => map([p[0] + item.x, p[1] + item.y])
  const interactive = onPointerDown
    ? { className: 'cursor-grab active:cursor-grabbing', onPointerDown }
    : { pointerEvents: 'none' as const }
  const stroke = item.hideOutline ? 'transparent' : '#1e293b'
  const fill = item.hideOutline ? 'transparent' : item.color
  let outline: React.ReactNode = null
  let halo: React.ReactNode = null
  if (item.circleR !== undefined) {
    const [cx, cy] = worldToPx(w([0, 0]))
    const r = item.circleR * PLANE_SCALE
    outline = <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={2} strokeDasharray={dashed ? '6 4' : undefined} {...interactive} />
    if (selected) halo = <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#6366f1" strokeWidth={4} strokeOpacity={0.45} pointerEvents="none" />
  } else if (item.points) {
    const d = pointsToPath(item.points.map((p) => worldToPx(w(p))))
    outline = (
      <path d={d} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth={2.2} strokeLinejoin="round" strokeDasharray={dashed ? '6 4' : undefined} {...interactive} />
    )
    if (selected) halo = <path d={d} fill="none" stroke="#6366f1" strokeWidth={9} strokeOpacity={0.35} strokeLinejoin="round" pointerEvents="none" />
  }
  return (
    <g>
      {halo}
      {outline}
      {item.parts && (
        <g pointerEvents="none" opacity={dashed ? 0.6 : 1}>
          {item.parts.map((p, i) =>
            p.kind === 'circle' ? (
              <circle key={i} cx={worldToPx(w(p.c))[0]} cy={worldToPx(w(p.c))[1]} r={p.r * PLANE_SCALE} fill={p.fill} stroke={p.stroke ?? 'none'} />
            ) : (
              <path key={i} d={pointsToPath(p.points.map((q) => worldToPx(w(q))))} fill={p.fill} stroke={p.stroke ?? 'none'} strokeLinejoin="round" />
            ),
          )}
        </g>
      )}
    </g>
  )
}

function AxisLine({ angleDeg, color, faint }: { angleDeg: number; color: string; faint?: boolean }) {
  const r = (angleDeg * Math.PI) / 180
  const len = PLANE_RANGE * 1.5
  const [x1, y1] = worldToPx([-len * Math.cos(r), -len * Math.sin(r)])
  const [x2, y2] = worldToPx([len * Math.cos(r), len * Math.sin(r)])
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={faint ? 1.5 : 2.5}
      strokeOpacity={faint ? 0.45 : 1}
      strokeDasharray={faint ? '3 5' : '10 6'}
      pointerEvents="none"
    />
  )
}

function MiniIcon({ shape }: { shape: LibraryShape }) {
  const pts: Pt[] =
    shape.points ??
    (shape.parts?.flatMap((p) => (p.kind === 'circle' ? [[p.c[0] - p.r, p.c[1] - p.r] as Pt, [p.c[0] + p.r, p.c[1] + p.r] as Pt] : p.points)) ?? [
      [-shape.circleR!, -shape.circleR!],
      [shape.circleR!, shape.circleR!],
    ])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.15 || 1
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2
  const sw = size * 0.06
  return (
    <svg width={18} height={18} viewBox={`${cx - size / 2} ${cy - size / 2} ${size} ${size}`} style={{ transform: 'scaleY(-1)' }}>
      {shape.circleR !== undefined && <circle cx={0} cy={0} r={shape.circleR} fill={shape.color} stroke="#1e293b" strokeWidth={sw} />}
      {shape.points && !shape.hideOutline && <polygon points={shape.points.map((p) => p.join(',')).join(' ')} fill={shape.color} stroke="#1e293b" strokeWidth={sw} strokeLinejoin="round" />}
      {shape.parts?.map((p, i) =>
        p.kind === 'circle' ? <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.r} fill={p.fill} /> : <polygon key={i} points={p.points.map((q) => q.join(',')).join(' ')} fill={p.fill} />,
      )}
    </svg>
  )
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      {children}
    </div>
  )
}

export function SmallBtn({ onClick, children, danger, active }: { onClick: () => void; children: React.ReactNode; danger?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-2 text-sm font-semibold transition active:scale-95 ${
        active ? 'bg-indigo-600 text-white' : danger ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

export function ToggleBtn({
  on,
  onClick,
  onLabel,
  offLabel,
  accent,
}: {
  on: boolean
  onClick: () => void
  onLabel: string
  offLabel: string
  accent: 'orange' | 'indigo' | 'emerald'
}) {
  const tone = {
    orange: on ? 'bg-white text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50' : 'bg-orange-500 text-white',
    indigo: on ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50',
    emerald: on ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-50',
  }[accent]
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${tone}`}>
      {on ? onLabel : offLabel}
    </button>
  )
}

/* ------------------------------------------------------------------ geometry helpers */

function round(v: number) {
  return Math.round(v * 1000) / 1000
}
function clampPos(v: number) {
  return Math.max(-PLANE_RANGE + 0.5, Math.min(PLANE_RANGE - 0.5, v))
}
function mapPart(p: PatternPart, f: (q: Pt) => Pt): PatternPart {
  return p.kind === 'circle' ? { ...p, c: f(p.c) } : { ...p, points: p.points.map(f) }
}
function scalePart(p: PatternPart, k: number): PatternPart {
  return p.kind === 'circle'
    ? { ...p, c: [p.c[0] * k, p.c[1] * k], r: p.r * k }
    : { ...p, points: p.points.map(([x, y]) => [x * k, y * k] as Pt) }
}
