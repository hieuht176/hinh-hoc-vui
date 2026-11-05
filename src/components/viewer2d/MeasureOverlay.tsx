import type { Shape2DDef } from '../../types'
import { getGeometry2D, PX_PER_CM } from '../../utils/render2d'

/** "4" → "4 cm", 4.2426 → "4,2 cm" (Vietnamese decimal comma). */
export function formatCm(px: number): string {
  const cm = Math.round((px / PX_PER_CM) * 10) / 10
  return `${Number.isInteger(cm) ? cm : cm.toFixed(1).replace('.', ',')} cm`
}

const LINE = '#0f172a'

/**
 * Length labels drawn on top of a 2D shape: every side of a polygon, the diameter and radius of a circle,
 * the two semi-axes of an ellipse. Coordinates are rotated here (not with an SVG transform) so the numbers
 * always stay upright and readable however the shape is turned.
 */
export default function MeasureOverlay({
  def,
  params,
  rotation,
  view,
  scale = 1,
  hideCenterLabel = false,
}: {
  def: Shape2DDef
  params: Record<string, number>
  rotation: number
  /** Width of the visible viewBox, used to size the text and gaps. */
  view: number
  /** Extra zoom applied to the shape (e.g. a piece enlarged on the "Ghép hình" board); lengths grow with it. */
  scale?: number
  /** Skip the "O" next to the centre (the "Các thành phần" layer already writes "tâm O"). */
  hideCenterLabel?: boolean
}) {
  const raw = getGeometry2D(def, params)
  const geo =
    raw.kind === 'polygon'
      ? { ...raw, points: raw.points.map(([x, y]) => [x * scale, y * scale] as [number, number]) }
      : raw.kind === 'circle'
        ? { ...raw, r: raw.r * scale }
        : { ...raw, rx: raw.rx * scale, ry: raw.ry * scale }
  const rad = (rotation * Math.PI) / 180
  const rot = ([x, y]: [number, number]): [number, number] => [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)]
  const font = view * 0.042
  const gap = view * 0.045
  const stroke = view / 220
  /** Horizontal distance that puts a centred label fully clear of an upright line. */
  const besideLine = (text: string) => text.length * font * 0.3 + gap * 0.4

  const label = (key: string, [x, y]: [number, number], text: string, color = LINE) => (
    <text
      key={key}
      x={x}
      y={y}
      fontSize={font}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={font * 0.28}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {text}
    </text>
  )

  if (geo.kind === 'polygon') {
    const pts = geo.points.map(rot)
    return (
      <g pointerEvents="none">
        {pts.map((p, i) => {
          const q = pts[(i + 1) % pts.length]
          const mx = (p[0] + q[0]) / 2
          const my = (p[1] + q[1]) / 2
          const len = Math.hypot(q[0] - p[0], q[1] - p[1])
          // Unit normal to the side, flipped so it points away from the shape's centre.
          let nx = -(q[1] - p[1]) / (len || 1)
          let ny = (q[0] - p[0]) / (len || 1)
          if (nx * mx + ny * my < 0) {
            nx = -nx
            ny = -ny
          }
          // Text is wider than it is tall, so push it further out beside upright sides.
          const text = formatCm(len)
          const off = gap * 0.75 + Math.abs(nx) * text.length * font * 0.3
          return label(`s${i}`, [mx + nx * off, my + ny * off], text)
        })}
      </g>
    )
  }

  if (geo.kind === 'circle') {
    const r = geo.r
    const d1 = rot([-r, 0])
    const d2 = rot([r, 0])
    const rEnd = rot([0, -r])
    return (
      <g pointerEvents="none">
        <line x1={d1[0]} y1={d1[1]} x2={d2[0]} y2={d2[1]} stroke="#2563eb" strokeWidth={stroke} strokeDasharray={`${stroke * 4} ${stroke * 3}`} />
        <line x1={0} y1={0} x2={rEnd[0]} y2={rEnd[1]} stroke="#dc2626" strokeWidth={stroke * 1.4} />
        <circle cx={0} cy={0} r={stroke * 2.2} fill={LINE} />
        {!hideCenterLabel && label('O', rot([-gap * 0.7, gap * 0.7]), 'O')}
        {label('d', rot([r / 2, gap]), `d = ${formatCm(2 * r)}`, '#2563eb')}
        {label('r', rot([besideLine(`r = ${formatCm(r)}`), -r / 2]), `r = ${formatCm(r)}`, '#dc2626')}
      </g>
    )
  }

  const { rx, ry } = geo
  const aEnd = rot([rx, 0])
  const bEnd = rot([0, -ry])
  return (
    <g pointerEvents="none">
      <line x1={0} y1={0} x2={aEnd[0]} y2={aEnd[1]} stroke="#2563eb" strokeWidth={stroke * 1.4} />
      <line x1={0} y1={0} x2={bEnd[0]} y2={bEnd[1]} stroke="#dc2626" strokeWidth={stroke * 1.4} />
      <circle cx={0} cy={0} r={stroke * 2.2} fill={LINE} />
      {label('a', rot([rx / 2, gap]), `a = ${formatCm(rx)}`, '#2563eb')}
      {label('b', rot([-besideLine(`b = ${formatCm(ry)}`), -ry / 2]), `b = ${formatCm(ry)}`, '#dc2626')}
    </g>
  )
}
