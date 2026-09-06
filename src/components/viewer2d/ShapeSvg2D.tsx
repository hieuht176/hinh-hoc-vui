import { getGeometry2D } from '../../utils/render2d'
import { pointsToPath } from '../../utils/polygon'
import type { Shape2DDef } from '../../types'

/** Renders just the <g> content for a shape, centered at (0,0), in px units. Compose inside your own <svg>. */
export function ShapeGeometryG({
  def,
  params,
  fill,
  strokeWidth = 2,
}: {
  def: Shape2DDef
  params: Record<string, number>
  fill: string
  strokeWidth?: number
}) {
  const geo = getGeometry2D(def, params)
  const stroke = '#1e293b'
  if (geo.kind === 'circle') {
    return <circle cx={0} cy={0} r={geo.r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} fillOpacity={0.85} />
  }
  if (geo.kind === 'ellipse') {
    return <ellipse cx={0} cy={0} rx={geo.rx} ry={geo.ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} fillOpacity={0.85} />
  }
  return <path d={pointsToPath(geo.points)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} fillOpacity={0.85} strokeLinejoin="round" />
}

/** Standalone, self-fitting shape preview inside its own square <svg>. Good for cards & the explorer. */
export default function ShapeSvg2D({
  def,
  params,
  size = 160,
  fill,
}: {
  def: Shape2DDef
  params: Record<string, number>
  size?: number
  fill?: string
}) {
  const geo = getGeometry2D(def, params)
  const bounds =
    geo.kind === 'circle'
      ? { w: geo.r * 2, h: geo.r * 2 }
      : geo.kind === 'ellipse'
        ? { w: geo.rx * 2, h: geo.ry * 2 }
        : (() => {
            const xs = geo.points.map((p) => p[0])
            const ys = geo.points.map((p) => p[1])
            return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
          })()
  const padding = size * 0.16
  const available = size - padding * 2
  const scale = Math.min(available / Math.max(bounds.w, 1), available / Math.max(bounds.h, 1))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2} ${size / 2}) scale(${scale})`}>
        <ShapeGeometryG def={def} params={params} fill={fill ?? def.color} strokeWidth={2 / scale} />
      </g>
    </svg>
  )
}
