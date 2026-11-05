import type { ReactNode } from 'react'
import type { Shape2DDef } from '../../types'
import { getGeometry2D } from '../../utils/render2d'
import {
  analyzeDiagonals,
  diagonalPairs,
  equalGroups,
  footOnLine,
  HEIGHT_SPEC,
  interiorAngles,
  sideLengths,
  symmetryAxes,
} from '../../utils/shapeProps'
import { formatCm } from './MeasureOverlay'

type Pt = [number, number]

export type PropertyLayer = 'sides' | 'angles' | 'diagonals' | 'height' | 'axes' | 'parts'

export const COLORS = {
  ink: '#0f172a',
  radius: '#dc2626',
  diameter: '#2563eb',
  ring: '#f59e0b',
  diagonal: '#ea580c',
  height: '#2563eb',
  axis: '#7c3aed',
}

const unit = (a: Pt, b: Pt): Pt => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
}

/** Which property buttons make sense for this shape. */
export function availableLayers(def: Shape2DDef, params: Record<string, number>): PropertyLayer[] {
  const geo = getGeometry2D(def, params)
  if (geo.kind === 'circle') return ['parts', 'axes']
  if (geo.kind !== 'polygon') return ['axes']
  const layers: PropertyLayer[] = ['sides', 'angles']
  if (diagonalPairs(geo.points.length).length) layers.push('diagonals')
  if (HEIGHT_SPEC[def.id]) layers.push('height')
  layers.push('axes')
  return layers
}

/** Short, child-friendly sentences explaining what each active layer shows for the current shape. */
export function propertyNotes(def: Shape2DDef, params: Record<string, number>, layers: Set<PropertyLayer>): { color: string; text: string }[] {
  const geo = getGeometry2D(def, params)
  const notes: { color: string; text: string }[] = []
  if (geo.kind === 'circle' && layers.has('parts')) {
    const r = geo.r
    const C = 2 * Math.PI * r
    notes.push(
      { color: COLORS.ink, text: 'Tâm O: điểm chính giữa của hình tròn.' },
      { color: COLORS.radius, text: `Bán kính: đoạn thẳng nối tâm O với một điểm trên đường tròn, r = ${formatCm(r)}.` },
      {
        color: COLORS.diameter,
        text: `Đường kính: đoạn thẳng đi qua tâm O, nối hai điểm trên đường tròn, dài gấp đôi bán kính: d = 2 × r = ${formatCm(2 * r)}.`,
      },
      { color: COLORS.ring, text: `Đường tròn: đường cong bao quanh. Độ dài đường tròn chính là chu vi: C = 2 × π × r ≈ ${formatCm(C)}.` },
      { color: '#94a3b8', text: 'Hình tròn: gồm đường tròn và toàn bộ phần bên trong.' },
    )
  }
  if (geo.kind !== 'polygon') {
    if (layers.has('axes'))
      notes.push({
        color: COLORS.axis,
        text:
          geo.kind === 'circle'
            ? 'Hình tròn có vô số trục đối xứng: mọi đường thẳng đi qua tâm đều là trục (ở đây vẽ 4 trục).'
            : 'Hình elip có 2 trục đối xứng: trục lớn và trục nhỏ.',
      })
    return notes
  }
  const pts = geo.points
  const n = pts.length
  if (layers.has('sides')) {
    const groups = equalGroups(sideLengths(pts))
    notes.push({
      color: COLORS.ink,
      text: groups.every((g) => g === 0)
        ? 'Hình này không có cạnh nào bằng nhau.'
        : groups.every((g) => g === 1)
          ? `Cả ${n} cạnh đều bằng nhau (cùng số vạch).`
          : 'Các cạnh có cùng số vạch thì bằng nhau.',
    })
  }
  if (layers.has('angles')) {
    const angles = interiorAngles(pts)
    const rights = angles.filter((a) => Math.abs(a - 90) < 0.5).length
    const others = angles.filter((a) => Math.abs(a - 90) >= 0.5)
    const parts: string[] = []
    if (rights === n) parts.push(`Cả ${n} góc đều là góc vuông (ô vuông nhỏ).`)
    else if (rights > 0) parts.push(`Ô vuông nhỏ đánh dấu góc vuông.`)
    if (others.length > 1 && equalGroups(others).some((g) => g > 0)) parts.push('Các góc có cùng số cung thì bằng nhau.')
    parts.push(`Tổng các góc: ${angles.map((a) => Math.round(a)).join('° + ')}° = ${(n - 2) * 180}°.`)
    notes.push({ color: COLORS.ink, text: parts.join(' ') })
  }
  if (layers.has('diagonals')) {
    const info = analyzeDiagonals(pts)
    if (info && n === 6) {
      notes.push({ color: COLORS.diagonal, text: '3 đường chéo chính cắt nhau tại tâm, chia lục giác đều thành 6 tam giác đều.' })
    } else if (info) {
      const facts: string[] = []
      if (info.equal) facts.push('bằng nhau')
      if (info.perpendicular) facts.push('vuông góc với nhau')
      if (info.bisect) facts.push('cắt nhau tại trung điểm mỗi đường')
      else if (info.halves) {
        // Kite: only one diagonal is cut in half (the one across the axis of symmetry).
        const scale = Math.max(...info.lengths)
        const halfOf = (a: number, b: number) => Math.abs(a - b) <= 1e-4 * scale
        if (halfOf(info.halves[0], info.halves[1]) !== halfOf(info.halves[2], info.halves[3]))
          facts.push('một đường chéo chia đôi đường chéo kia')
      }
      notes.push({
        color: COLORS.diagonal,
        text: `Hai đường chéo dài ${formatCm(info.lengths[0])} và ${formatCm(info.lengths[1])}${
          facts.length ? `: ${facts.join(', ')}.` : ' (không bằng nhau, không vuông góc).'
        }`,
      })
    }
  }
  if (layers.has('height') && HEIGHT_SPEC[def.id]) {
    notes.push({ color: COLORS.height, text: 'Đường cao h vuông góc với đáy, dùng để tính diện tích.' })
  }
  if (layers.has('axes')) {
    const k = symmetryAxes(pts).length
    notes.push({
      color: COLORS.axis,
      text: k > 0 ? `Có ${k} trục đối xứng: gấp hình theo trục, hai nửa trùng khít lên nhau.` : 'Hình này không có trục đối xứng nào.',
    })
  }
  return notes
}

/**
 * Draws the properties listed for a 2D shape directly on the picture: equal-side tick marks, angle marks with
 * their size, diagonals, the height used in the area formula and the axes of symmetry. Points are rotated here
 * so every mark and number stays upright.
 */
export default function PropertyOverlay({
  def,
  params,
  rotation,
  view,
  layers,
  showLengths,
}: {
  def: Shape2DDef
  params: Record<string, number>
  rotation: number
  view: number
  layers: Set<PropertyLayer>
  /** Also write lengths on the diagonals / height (when "Số đo" is on). */
  showLengths: boolean
}) {
  const geo = getGeometry2D(def, params)
  const rad = (rotation * Math.PI) / 180
  const rot = ([x, y]: Pt): Pt => [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)]
  const sw = view / 220
  const font = view * 0.034
  const out: ReactNode[] = []

  /** A line drawn over a thin white underlay, so it stays visible on any fill colour. */
  const haloLine = (key: string, a: Pt, b: Pt, color: string, dashed = false, width = sw * 1.3) => (
    <g key={key}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fff" strokeWidth={width * 2.6} strokeLinecap="round" opacity={0.85} />
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${width * 4} ${width * 3}` : undefined}
      />
    </g>
  )
  const text = (key: string, [x, y]: Pt, t: string, color: string, size = font) => (
    <text
      key={key}
      x={x}
      y={y}
      fontSize={size}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={size * 0.28}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {t}
    </text>
  )
  /** Small square marking a right angle at v between unit directions u and w. */
  const rightMark = (key: string, v: Pt, u: Pt, w: Pt, color: string) => {
    const s = view * 0.035
    const a: Pt = [v[0] + u[0] * s, v[1] + u[1] * s]
    const c: Pt = [v[0] + w[0] * s, v[1] + w[1] * s]
    const b: Pt = [a[0] + w[0] * s, a[1] + w[1] * s]
    return (
      <path
        key={key}
        d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`}
        fill="none"
        stroke={color}
        strokeWidth={sw * 1.2}
        strokeLinejoin="round"
      />
    )
  }
  /** `count` short tick marks across segment a–b at its midpoint (the "equal length" sign). */
  const ticks = (key: string, a: Pt, b: Pt, count: number, color: string) => {
    const d = unit(a, b)
    const n: Pt = [-d[1], d[0]]
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const len = view * 0.028
    const gap = view * 0.014
    return Array.from({ length: count }, (_, k) => {
      const off = (k - (count - 1) / 2) * gap
      const c: Pt = [m[0] + d[0] * off, m[1] + d[1] * off]
      return (
        <line
          key={`${key}-${k}`}
          x1={c[0] - n[0] * len}
          y1={c[1] - n[1] * len}
          x2={c[0] + n[0] * len}
          y2={c[1] + n[1] * len}
          stroke={color}
          strokeWidth={sw * 1.5}
          strokeLinecap="round"
        />
      )
    })
  }

  // ---- circle: name its parts (centre, radius, diameter, the circle line itself, the disc inside) ----
  if (geo.kind === 'circle' && layers.has('parts')) {
    const r = geo.r
    const gap = view * 0.045
    const d1 = rot([-r, 0])
    const d2 = rot([r, 0])
    const top = rot([0, -r])
    const beside = (t: string) => t.length * font * 0.3 + gap * 0.4
    out.push(
      <circle key="ring" cx={0} cy={0} r={r} fill="none" stroke={COLORS.ring} strokeWidth={sw * 3.2} />,
      haloLine('dia', d1, d2, COLORS.diameter, true),
      haloLine('rad', [0, 0], top, COLORS.radius, false, sw * 1.8),
      <circle key="ctr" cx={0} cy={0} r={sw * 2.6} fill={COLORS.ink} stroke="#fff" strokeWidth={sw} />,
      text('lc', rot([-gap * 1.7, gap * 0.9]), 'tâm O', COLORS.ink),
      text('lr', rot([-beside('bán kính'), -r / 2]), 'bán kính', COLORS.radius),
      text('ld', rot([-r / 2, -gap * 0.9]), 'đường kính', COLORS.diameter),
      text('lt', rot([-(r + gap * 1.2) * Math.SQRT1_2, -(r + gap * 1.2) * Math.SQRT1_2]), 'đường tròn', '#b45309'),
      text('lh', rot([0, r * 0.55]), 'hình tròn', COLORS.ink),
    )
  }

  // ---- circle & ellipse: axes of symmetry ----
  if (geo.kind !== 'polygon') {
    if (layers.has('axes')) {
      const reach = view
      const count = geo.kind === 'circle' ? 4 : 2
      for (let k = 0; k < count; k++) {
        const phi = rad + (k * Math.PI) / count
        const d: Pt = [Math.cos(phi) * reach, Math.sin(phi) * reach]
        out.push(haloLine(`ax${k}`, [-d[0], -d[1]], d, COLORS.axis, true))
      }
    }
    return <g pointerEvents="none">{out}</g>
  }

  const pts = geo.points.map(rot)
  const n = pts.length

  // ---- axes of symmetry (drawn first, underneath everything else) ----
  if (layers.has('axes')) {
    symmetryAxes(pts).forEach((phi, k) => {
      const d: Pt = [Math.cos(phi) * view, Math.sin(phi) * view]
      out.push(haloLine(`ax${k}`, [-d[0], -d[1]], d, COLORS.axis, true))
    })
  }

  // ---- diagonals ----
  if (layers.has('diagonals')) {
    const info = analyzeDiagonals(pts)
    diagonalPairs(n).forEach(([i, j], k) => {
      out.push(haloLine(`dg${k}`, pts[i], pts[j], COLORS.diagonal))
      if (showLengths && info) {
        const a = pts[i]
        const b = pts[j]
        const d = unit(a, b)
        const p: Pt = [a[0] + (b[0] - a[0]) * 0.36 - d[1] * font * 1.1, a[1] + (b[1] - a[1]) * 0.36 + d[0] * font * 1.1]
        out.push(text(`dgl${k}`, p, formatCm(info.lengths[k]), COLORS.diagonal))
      }
    })
    if (info?.cross && info.halves) {
      const [p0, p1, p2, p3] = pts
      const x = info.cross
      const segs: [Pt, Pt][] = [
        [p0, x],
        [x, p2],
        [p1, x],
        [x, p3],
      ]
      equalGroups(info.halves).forEach((g, k) => {
        if (g > 0) out.push(...ticks(`dt${k}`, segs[k][0], segs[k][1], g, COLORS.diagonal))
      })
      if (info.perpendicular) out.push(rightMark('dperp', x, unit(x, p0), unit(x, p1), COLORS.diagonal))
      out.push(<circle key="dx" cx={x[0]} cy={x[1]} r={sw * 2.4} fill={COLORS.diagonal} stroke="#fff" strokeWidth={sw} />)
    }
    if (n === 6) out.push(<circle key="dx" cx={0} cy={0} r={sw * 2.4} fill={COLORS.diagonal} stroke="#fff" strokeWidth={sw} />)
  }

  // ---- height used in the area formula ----
  const spec = HEIGHT_SPEC[def.id]
  if (layers.has('height') && spec) {
    const top = pts[spec.from]
    const a = pts[spec.base[0]]
    const b = pts[spec.base[1]]
    const foot = footOnLine(top, a, b)
    const along = unit(a, b)
    // If the foot lands outside the base side, extend that side with a dashed line (as in the textbook).
    const t = (foot[0] - a[0]) * along[0] + (foot[1] - a[1]) * along[1]
    const baseLen = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (t < 0) out.push(haloLine('hext', a, foot, COLORS.ink, true, sw))
    if (t > baseLen) out.push(haloLine('hext', b, foot, COLORS.ink, true, sw))
    out.push(haloLine('h', top, foot, COLORS.height, true))
    const toTop = unit(foot, top)
    const side: Pt = t > baseLen / 2 ? [-along[0], -along[1]] : along
    out.push(rightMark('hperp', foot, toTop, side, COLORS.height))
    const label = showLengths ? `h = ${formatCm(Math.hypot(top[0] - foot[0], top[1] - foot[1]))}` : 'h'
    const mid: Pt = [(top[0] + foot[0]) / 2, (top[1] + foot[1]) / 2]
    const push = label.length * font * 0.3 + view * 0.02
    out.push(text('hl', [mid[0] + side[0] * push, mid[1] + side[1] * push], label, COLORS.height))
  }

  // ---- angles: right-angle squares, equal-angle arcs, size in degrees ----
  if (layers.has('angles')) {
    const angles = interiorAngles(pts)
    const groups = equalGroups(angles)
    pts.forEach((v, i) => {
      const u = unit(v, pts[(i - 1 + n) % n])
      const w = unit(v, pts[(i + 1) % n])
      const bis = unit([0, 0], [u[0] + w[0], u[1] + w[1]])
      const deg = angles[i]
      if (Math.abs(deg - 90) < 0.5) {
        out.push(rightMark(`ra${i}`, v, u, w, COLORS.ink))
      } else {
        const count = Math.max(1, groups[i])
        const cross = u[0] * w[1] - u[1] * w[0]
        for (let k = 0; k < count; k++) {
          const r = view * 0.05 + k * view * 0.013
          out.push(
            <path
              key={`arc${i}-${k}`}
              d={`M ${v[0] + u[0] * r} ${v[1] + u[1] * r} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${v[0] + w[0] * r} ${v[1] + w[1] * r}`}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={sw * 1.2}
            />,
          )
        }
      }
      const r = view * (deg < 50 ? 0.13 : 0.1)
      out.push(text(`al${i}`, [v[0] + bis[0] * r, v[1] + bis[1] * r], `${Math.round(deg)}°`, COLORS.ink, font * 0.85))
    })
  }

  // ---- equal sides ----
  if (layers.has('sides')) {
    equalGroups(sideLengths(pts)).forEach((g, i) => {
      if (g > 0) out.push(...ticks(`st${i}`, pts[i], pts[(i + 1) % n], g, COLORS.ink))
    })
  }

  return <g pointerEvents="none">{out}</g>
}
