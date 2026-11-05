import type { Shape2DDef } from '../../types'
import { getGeometry2D } from '../../utils/render2d'

const LETTERS = 'ABCDEFGH'

/**
 * Vertex names A, B, C… written just outside each corner of a 2D shape (the centre O for a circle / ellipse).
 * Points are rotated here rather than with an SVG transform so the letters stay upright.
 */
export default function VertexNames2D({
  def,
  params,
  rotation,
  view,
  showCentre = true,
}: {
  def: Shape2DDef
  params: Record<string, number>
  rotation: number
  view: number
  /** Circle / ellipse: write "O" at the centre (off when another layer already names it). */
  showCentre?: boolean
}) {
  const geo = getGeometry2D(def, params)
  const font = view * 0.045
  const label = (key: string, x: number, y: number, t: string) => (
    <text
      key={key}
      x={x}
      y={y}
      fontSize={font}
      fontWeight={800}
      fill="#0f172a"
      textAnchor="middle"
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={font * 0.3}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {t}
    </text>
  )
  if (geo.kind !== 'polygon') {
    if (!showCentre) return null
    return (
      <g pointerEvents="none">
        <circle cx={0} cy={0} r={view / 110} fill="#0f172a" />
        {label('O', -font * 0.8, font * 0.8, 'O')}
      </g>
    )
  }
  const rad = (rotation * Math.PI) / 180
  const pts = geo.points.map(([x, y]) => [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)])
  return (
    <g pointerEvents="none">
      {pts.map(([x, y], i) => {
        // Push each letter outwards along the line from the centre through the corner.
        const len = Math.hypot(x, y) || 1
        const gap = font * 0.95
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={view / 130} fill="#0f172a" />
            {label(`v${i}`, x + (x / len) * gap, y + (y / len) * gap, LETTERS[i] ?? `P${i + 1}`)}
          </g>
        )
      })}
    </g>
  )
}
