import type { Shape2DDef } from '../types'

export const PX_PER_CM = 18

export type Geometry2D =
  | { kind: 'polygon'; points: [number, number][] }
  | { kind: 'circle'; r: number }
  | { kind: 'ellipse'; rx: number; ry: number }

/** Shape geometry scaled to pixels (PX_PER_CM), centered at origin. */
export function getGeometry2D(def: Shape2DDef, params: Record<string, number>): Geometry2D {
  if (def.kind === 'circle') {
    return { kind: 'circle', r: params.r * PX_PER_CM }
  }
  if (def.kind === 'ellipse') {
    return { kind: 'ellipse', rx: params.a * PX_PER_CM, ry: params.b * PX_PER_CM }
  }
  const rawPoints = def.points(params) ?? []
  const cx = rawPoints.reduce((s, p) => s + p[0], 0) / rawPoints.length
  const cy = rawPoints.reduce((s, p) => s + p[1], 0) / rawPoints.length
  return {
    kind: 'polygon',
    points: rawPoints.map(([x, y]) => [(x - cx) * PX_PER_CM, (y - cy) * PX_PER_CM]),
  }
}

export function geometryBounds(geo: Geometry2D): { w: number; h: number } {
  if (geo.kind === 'circle') return { w: geo.r * 2, h: geo.r * 2 }
  if (geo.kind === 'ellipse') return { w: geo.rx * 2, h: geo.ry * 2 }
  const xs = geo.points.map((p) => p[0])
  const ys = geo.points.map((p) => p[1])
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}
