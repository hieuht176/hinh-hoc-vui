import { useEffect, useMemo, useRef, useState } from 'react'
import { shapes2D, shapes2DMap } from '../../data/shapes2d'
import { getGeometry2D } from '../../utils/render2d'
import { pointsToPath } from '../../utils/polygon'
import {
  aroundVertexDemo,
  centralVertex,
  coverage,
  FRAME_H,
  FRAME_W,
  gridOfRound,
  fillGapsWithSquares,
  growTiling,
  toneTiles,
  type Poly,
  type Pt,
} from '../../utils/tiling'
import ShapeSvg2D from '../viewer2d/ShapeSvg2D'
import StudyLayout, { Fold, Panel, STAGE_SVG } from '../common/StudyLayout'

/** Every tile is drawn at this size (distance from centre to the furthest corner), whatever its real size. */
const TILE_RADIUS = 44
const WEDGE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
/** How much white to mix into the tile colour for each of the 3 tones (solid colours, so the red gap hatch never shows through). */
const TONES = [0, 0.38, 0.62]

function tint(hex: string, white: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (255 - c) * white))
  return `rgb(${ch.join(',')})`
}

const fmtDeg = (d: number) => `${Math.round(d * 10) / 10}°`.replace('.', ',')

/** Filled pie slice at v between the rays towards `from` and `to` (the corner of one tile). */
function wedgePath(v: Pt, from: Pt, to: Pt, r: number) {
  const u = Math.atan2(from[1] - v[1], from[0] - v[0])
  const w = Math.atan2(to[1] - v[1], to[0] - v[0])
  const cross = Math.cos(u) * Math.sin(w) - Math.sin(u) * Math.cos(w)
  return `M ${v[0]} ${v[1]} L ${v[0] + r * Math.cos(u)} ${v[1] + r * Math.sin(u)} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${
    v[0] + r * Math.cos(w)
  } ${v[1] + r * Math.sin(w)} Z`
}

export default function TilingMode() {
  const [shapeId, setShapeId] = useState('hexagon')
  const [shown, setShown] = useState(0)
  const [showVertex, setShowVertex] = useState(false)
  const [filled, setFilled] = useState(false)
  const timer = useRef<number | null>(null)

  const def = shapes2DMap[shapeId]

  const model = useMemo(() => {
    const geo = getGeometry2D(def, def.defaultParams)
    if (geo.kind === 'polygon') {
      const R = Math.max(...geo.points.map(([x, y]) => Math.hypot(x, y)))
      const base: Poly = geo.points.map(([x, y]) => [(x / R) * TILE_RADIUS, (y / R) * TILE_RADIUS])
      const tiles = growTiling(base, 260, shapeId === 'octagon' ? 2 : 1)
      const cov = coverage(tiles)
      const fits = cov > 0.995
      // Only the regular octagon gets the "fill the holes with squares" option (the classic octagon + square floor).
      const squares = shapeId === 'octagon' ? fillGapsWithSquares(tiles) : []
      const filledStar = squares.length ? centralVertex([...tiles, ...squares]) : null
      return {
        kind: 'polygon' as const,
        base,
        tiles,
        tones: toneTiles(tiles),
        cov,
        fits,
        star: fits ? centralVertex(tiles) : null,
        demo: fits ? null : aroundVertexDemo(base),
        squares,
        filledStar,
      }
    }
    const rx = TILE_RADIUS
    const ry = geo.kind === 'circle' ? TILE_RADIUS : (TILE_RADIUS * geo.ry) / geo.rx
    const tiles = gridOfRound(rx, ry)
    return { kind: 'round' as const, base: null, tiles, tones: tiles.map((t) => t.flip), cov: coverage(tiles), fits: false, star: null, demo: null, squares: [], filledStar: null }
  }, [def, shapeId])

  const total = model.tiles.length
  const done = shown >= total

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])

  const play = () => {
    stop()
    setShown(1)
    setFilled(false)
    const step = Math.max(1, Math.ceil(total / 70))
    timer.current = window.setInterval(() => {
      setShown((s) => {
        const next = Math.min(total, s + step)
        if (next >= total) stop()
        return next
      })
    }, 35)
  }

  const pick = (id: string) => {
    stop()
    setShapeId(id)
    setShown(0)
    setShowVertex(false)
    setFilled(false)
  }

  const filledOn = filled && model.squares.length > 0
  const fits = filledOn || model.fits
  const star = filledOn ? model.filledStar : model.star
  const pct = Math.round(model.cov * 1000) / 10

  return (
    <StudyLayout
      visual={
        <>
          <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">
            <svg viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} className={STAGE_SVG}>
              <defs>
                <pattern id="gap-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill="#fee2e2" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#f87171" strokeWidth="3" />
                </pattern>
                <clipPath id="floor">
                  <rect width={FRAME_W} height={FRAME_H} rx={10} />
                </clipPath>
              </defs>
              <rect width={FRAME_W} height={FRAME_H} rx={10} fill={shown > 0 ? 'url(#gap-hatch)' : '#f8fafc'} />
              <g clipPath="url(#floor)">
                {model.tiles.slice(0, shown).map((t, i) => (
                  <path
                    key={i}
                    d={pointsToPath(t.points)}
                    fill={tint(def.color, TONES[model.tones[i] ?? 0])}
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                ))}
                {done &&
                  filledOn &&
                  model.squares.map((t, i) => (
                    <path
                      key={`sq${i}`}
                      d={pointsToPath(t.points)}
                      fill={tint('#0ea5e9', 0.2)}
                      stroke="#fff"
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                  ))}
                {done && showVertex && star && (
                  <g>
                    {star.corners.map((c, k) => (
                      <path key={k} d={wedgePath(star.vertex, c.from, c.to, 26)} fill={WEDGE_COLORS[k % WEDGE_COLORS.length]} stroke="#fff" strokeWidth={1.5} />
                    ))}
                    <circle cx={star.vertex[0]} cy={star.vertex[1]} r={34} fill="none" stroke="#0f172a" strokeWidth={2.5} strokeDasharray="5 4" />
                  </g>
                )}
              </g>
              <rect width={FRAME_W} height={FRAME_H} rx={10} fill="none" stroke="#94a3b8" strokeWidth={2} />
              {shown === 0 && (
                <text x={FRAME_W / 2} y={FRAME_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={18} fill="#94a3b8">
                  Bấm “▶ Lát nền” để bắt đầu lát
                </text>
              )}
            </svg>
          </div>
          <p className="text-center text-sm text-slate-500">
            Các viên gạch giống hệt nhau, ghép khít cạnh vào nhau · <span className="font-semibold text-red-500">phần kẻ sọc đỏ</span> là chỗ hở
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={play} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
              ▶ Lát nền
            </button>
            <button
              onClick={() => {
                stop()
                setShown(total)
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-50"
            >
              ⏭ Lát ngay
            </button>
            {done && model.squares.length > 0 && (
              <button
                onClick={() => setFilled((v) => !v)}
                aria-pressed={filled}
                className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  filled ? 'bg-sky-500 text-white' : 'bg-white text-sky-600 ring-1 ring-sky-300 hover:bg-sky-50'
                }`}
              >
                🟦 {filled ? 'Bỏ hình vuông' : 'Lấp chỗ hở bằng hình vuông'}
              </button>
            )}
            {model.kind === 'polygon' && fits && (
              <button
                onClick={() => {
                  stop()
                  setShown(total)
                  setShowVertex((v) => !v)
                }}
                aria-pressed={showVertex}
                className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  showVertex ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
                }`}
              >
                🔍 Soi một đỉnh
              </button>
            )}
            <button
              onClick={() => {
                stop()
                setShown(0)
                setShowVertex(false)
                setFilled(false)
              }}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              ↺ Xóa
            </button>
          </div>
        </>
      }
      side={
        <>
          <Panel title="Chọn viên gạch">
            <div className="grid grid-cols-4 gap-2">
              {shapes2D.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border p-1 text-[11px] leading-tight transition hover:-translate-y-0.5 active:scale-95 ${
                    s.id === shapeId ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-indigo-50 bg-indigo-50/40 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <ShapeSvg2D def={s} params={s.defaultParams} size={44} />
                  <span className="line-clamp-2 text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </Panel>

          {done && (
            <div
              className={`rounded-2xl border-2 px-5 py-4 text-center shadow-sm ${
                fits ? 'border-emerald-400 bg-emerald-50' : 'border-red-300 bg-red-50'
              }`}
            >
              <div className={`text-xl font-bold ${fits ? 'text-emerald-600' : 'text-red-500'}`}>
                {filledOn ? '✅ Bát giác đều + hình vuông lát kín được!' : model.fits ? `✅ ${def.name} lát kín được!` : `❌ ${def.name} không lát kín được`}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {filledOn
                  ? 'Mỗi chỗ hở được lấp vừa khít bằng một hình vuông, nền được phủ kín 100%.'
                  : model.fits ? 'Phủ kín 100% nền, không hở, không chồng lên nhau.' : `Chỉ phủ được khoảng ${String(pct).replace('.', ',')}% nền, còn lại là chỗ hở.`}
              </div>
            </div>
          )}

          {done && (
            <Panel title="🔍 Ghép quanh một đỉnh">
              {model.kind === 'round' ? (
                <p className="text-sm leading-relaxed text-slate-700">
                  {def.name} <b>không có đỉnh, không có góc</b>. Các viên chỉ chạm nhau tại một điểm nên giữa chúng luôn còn chỗ hở.
                </p>
              ) : star ? (
                <VertexStarView star={star} color={def.color} squareColor={filledOn ? '#0ea5e9' : undefined} />
              ) : model.demo && model.base ? (
                <GapDemoView base={model.base} demo={model.demo} color={def.color} isOctagon={shapeId === 'octagon'} />
              ) : null}
            </Panel>
          )}

          <Fold title="💡 Điều cần nhớ">
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Một hình lát kín được nền khi các góc ghép quanh <b>mỗi đỉnh</b> cộng lại <b>đúng 360°</b> (một vòng tròn).
              </li>
              <li>Ít hơn 360° thì còn hở; nhiều hơn 360° thì các viên bị chồng lên nhau.</li>
              <li>
                <b>Mọi tam giác</b> và <b>mọi tứ giác</b> đều lát kín được. Trong các đa giác đều, chỉ có <b>tam giác đều, hình vuông và lục giác đều</b>.
              </li>
            </ul>
          </Fold>
        </>
      }
    />
  )
}

/** Close-up of one vertex of a complete tiling: each tile's corner in its own colour, and the angles added up. */
function VertexStarView({
  star,
  color,
  squareColor,
}: {
  star: NonNullable<ReturnType<typeof centralVertex>>
  color: string
  /** Colour for the filler squares (octagon + square floor), so they stand out from the octagons. */
  squareColor?: string
}) {
  const v = star.vertex
  const R = 62
  return (
    <div>
      <svg viewBox={`${v[0] - R} ${v[1] - R} ${2 * R} ${2 * R}`} className="mx-auto block h-44 w-44">
        <defs>
          <clipPath id="star-clip">
            <circle cx={v[0]} cy={v[1]} r={R - 2} />
          </clipPath>
        </defs>
        <g clipPath="url(#star-clip)">
          {star.corners.map((c, k) => (
            <path key={`t${k}`} d={pointsToPath(c.tile)} fill={squareColor && c.tile.length === 4 ? squareColor : color} fillOpacity={0.3} stroke="#fff" strokeWidth={1.5} />
          ))}
          {star.corners.map((c, k) => (
            <path key={`w${k}`} d={wedgePath(v, c.from, c.to, 30)} fill={WEDGE_COLORS[k % WEDGE_COLORS.length]} stroke="#fff" strokeWidth={1.2} />
          ))}
        </g>
        <circle cx={v[0]} cy={v[1]} r={2.5} fill="#0f172a" />
      </svg>
      <p className="mt-2 text-center text-sm font-semibold leading-relaxed">
        {star.corners.map((c, k) => (
          <span key={k}>
            {k > 0 && <span className="text-slate-400"> + </span>}
            <span style={{ color: WEDGE_COLORS[k % WEDGE_COLORS.length] }}>{fmtDeg(c.angle)}</span>
          </span>
        ))}
        <span className="text-slate-700"> = 360°</span>
      </p>
      <p className="mt-1 text-center text-sm text-slate-600">Các góc ghép quanh đỉnh vừa đủ một vòng tròn, nên không có chỗ hở.</p>
    </div>
  )
}

/** For a shape that cannot tile: as many copies as fit around one corner, and the left-over gap in red. */
function GapDemoView({
  base,
  demo,
  color,
  isOctagon,
}: {
  base: Poly
  demo: ReturnType<typeof aroundVertexDemo>
  color: string
  isOctagon: boolean
}) {
  const v = base[0]
  const R = TILE_RADIUS * 2
  const gapStart = ((demo.start + demo.dir * demo.count * demo.angle) * Math.PI) / 180
  const gapEnd = ((demo.start + demo.dir * 360) * Math.PI) / 180
  const r = 42
  const gapPath = `M ${v[0]} ${v[1]} L ${v[0] + r * Math.cos(gapStart)} ${v[1] + r * Math.sin(gapStart)} A ${r} ${r} 0 ${demo.gap > 180 ? 1 : 0} ${
    demo.dir > 0 ? 1 : 0
  } ${v[0] + r * Math.cos(gapEnd)} ${v[1] + r * Math.sin(gapEnd)} Z`
  const mid = (gapStart + gapEnd) / 2
  const n = base.length
  return (
    <div>
      <svg viewBox={`${v[0] - R} ${v[1] - R} ${2 * R} ${2 * R}`} className="mx-auto block h-48 w-48">
        {demo.copies.map((c, k) => (
          <g key={k}>
            <path d={pointsToPath(c)} fill={color} fillOpacity={0.35} stroke="#fff" strokeWidth={2} />
            <path d={wedgePath(v, c[n - 1], c[1], 26)} fill={WEDGE_COLORS[k % WEDGE_COLORS.length]} stroke="#fff" strokeWidth={1.2} />
          </g>
        ))}
        <path d={gapPath} fill="url(#gap-hatch)" stroke="#ef4444" strokeWidth={2} />
        <text
          x={v[0] + (r + 26) * Math.cos(mid)}
          y={v[1] + (r + 26) * Math.sin(mid)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={700}
          fill="#dc2626"
          stroke="#fff"
          strokeWidth={4}
          paintOrder="stroke"
        >
          hở {fmtDeg(demo.gap)}
        </text>
        <circle cx={v[0]} cy={v[1]} r={2.5} fill="#0f172a" />
      </svg>
      <p className="mt-2 text-center text-sm font-semibold">
        {Array.from({ length: demo.count }, (_, k) => (
          <span key={k}>
            {k > 0 && <span className="text-slate-400"> + </span>}
            <span style={{ color: WEDGE_COLORS[k % WEDGE_COLORS.length] }}>{fmtDeg(demo.angle)}</span>
          </span>
        ))}
        <span className="text-slate-700"> = {fmtDeg(demo.count * demo.angle)}</span>
        <span className="text-red-500"> → còn hở {fmtDeg(demo.gap)}</span>
      </p>
      <p className="mt-1 text-center text-sm leading-relaxed text-slate-600">
        Ghép thêm 1 viên nữa thì thành {fmtDeg((demo.count + 1) * demo.angle)}, nhiều hơn 360°, nên các viên bị chồng lên nhau.
        {isOctagon && ' Chỗ hở 90° vừa khít góc của một hình vuông, vì vậy người ta hay lát gạch bát giác xen kẽ hình vuông nhỏ.'}
      </p>
    </div>
  )
}
