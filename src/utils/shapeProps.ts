/**
 * Geometry facts read straight off a polygon's vertices, so the "properties" overlay always matches the
 * shape as it is currently drawn (e.g. a rectangle dragged to a = b really does get 4 equal-side marks).
 */

type Pt = [number, number]

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])

/**
 * Give each value a group number (1, 2, 3…) when at least one other value is equal to it, else 0.
 * Groups are numbered in order of first appearance; only the first 3 groups get a number (tick marks / arcs).
 */
export function equalGroups(values: number[], relTol = 1e-4): number[] {
  const scale = Math.max(...values.map(Math.abs), 1e-9)
  const groupOf = new Array<number>(values.length).fill(0)
  let next = 1
  for (let i = 0; i < values.length; i++) {
    if (groupOf[i] !== 0) continue
    const members = values.map((v, j) => (Math.abs(v - values[i]) <= relTol * scale ? j : -1)).filter((j) => j >= 0)
    if (members.length < 2) continue
    if (next > 3) break
    for (const j of members) groupOf[j] = next
    next++
  }
  return groupOf
}

export function sideLengths(pts: Pt[]): number[] {
  return pts.map((p, i) => dist(p, pts[(i + 1) % pts.length]))
}

/** Interior angle (degrees) at every vertex of a convex polygon. */
export function interiorAngles(pts: Pt[]): number[] {
  const n = pts.length
  return pts.map((v, i) => {
    const a = pts[(i - 1 + n) % n]
    const b = pts[(i + 1) % n]
    const ux = a[0] - v[0]
    const uy = a[1] - v[1]
    const wx = b[0] - v[0]
    const wy = b[1] - v[1]
    const cos = (ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) || 1)
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
  })
}

/** Which vertex pairs to draw as diagonals: both for a quadrilateral, the 3 long ones through the centre for a hexagon. */
export function diagonalPairs(n: number): [number, number][] {
  if (n === 4) return [
    [0, 2],
    [1, 3],
  ]
  if (n === 6) return [
    [0, 3],
    [1, 4],
    [2, 5],
  ]
  return []
}

export interface DiagonalInfo {
  lengths: number[]
  /** Crossing point of the two diagonals of a quadrilateral. */
  cross?: Pt
  /** The 4 half-diagonal lengths: [P0→X, X→P2, P1→X, X→P3]. */
  halves?: number[]
  equal: boolean
  perpendicular: boolean
  bisect: boolean
}

export function analyzeDiagonals(pts: Pt[]): DiagonalInfo | null {
  const pairs = diagonalPairs(pts.length)
  if (pairs.length === 0) return null
  const lengths = pairs.map(([i, j]) => dist(pts[i], pts[j]))
  const scale = Math.max(...lengths)
  const equal = lengths.every((l) => Math.abs(l - lengths[0]) <= 1e-4 * scale)
  if (pts.length !== 4) return { lengths, equal, perpendicular: false, bisect: true }

  const [p0, p1, p2, p3] = pts
  const d1: Pt = [p2[0] - p0[0], p2[1] - p0[1]]
  const d2: Pt = [p3[0] - p1[0], p3[1] - p1[1]]
  const denom = d1[0] * d2[1] - d1[1] * d2[0]
  const t = ((p1[0] - p0[0]) * d2[1] - (p1[1] - p0[1]) * d2[0]) / (denom || 1e-9)
  const cross: Pt = [p0[0] + t * d1[0], p0[1] + t * d1[1]]
  const halves = [dist(p0, cross), dist(cross, p2), dist(p1, cross), dist(cross, p3)]
  const tol = 1e-4 * scale
  const bisect = Math.abs(halves[0] - halves[1]) <= tol && Math.abs(halves[2] - halves[3]) <= tol
  const perpendicular = Math.abs(d1[0] * d2[0] + d1[1] * d2[1]) <= 1e-4 * Math.hypot(...d1) * Math.hypot(...d2)
  return { lengths, cross, halves, equal, perpendicular, bisect }
}

/**
 * Mirror lines of the polygon, as angles (radians) of lines through its vertex-average centre.
 * Every axis of a polygon passes through a vertex or the midpoint of a side, so only those directions are tested.
 */
export function symmetryAxes(pts: Pt[]): number[] {
  const n = pts.length
  const cx = pts.reduce((s, p) => s + p[0], 0) / n
  const cy = pts.reduce((s, p) => s + p[1], 0) / n
  const tol = 1e-3 * Math.max(...pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)))
  const candidates: number[] = []
  for (let i = 0; i < n; i++) {
    const q = pts[(i + 1) % n]
    candidates.push(Math.atan2(pts[i][1] - cy, pts[i][0] - cx))
    candidates.push(Math.atan2((pts[i][1] + q[1]) / 2 - cy, (pts[i][0] + q[0]) / 2 - cx))
  }
  const axes: number[] = []
  for (const phi of candidates) {
    const norm = ((phi % Math.PI) + Math.PI) % Math.PI
    if (axes.some((a) => Math.abs(a - norm) < 1e-3 || Math.abs(Math.abs(a - norm) - Math.PI) < 1e-3)) continue
    const c2 = Math.cos(2 * norm)
    const s2 = Math.sin(2 * norm)
    const isAxis = pts.every(([x, y]) => {
      const dx = x - cx
      const dy = y - cy
      const rx = cx + dx * c2 + dy * s2
      const ry = cy + dx * s2 - dy * c2
      return pts.some((p) => Math.hypot(p[0] - rx, p[1] - ry) <= tol)
    })
    if (isAxis) axes.push(norm)
  }
  return axes
}

/** Foot of the perpendicular from p onto the (infinite) line through a and b. */
export function footOnLine(p: Pt, a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)
  return [a[0] + t * dx, a[1] + t * dy]
}

/** Shapes whose formula uses a height h: draw it from vertex `from` down onto the side `base`. */
export const HEIGHT_SPEC: Record<string, { from: number; base: [number, number] }> = {
  'triangle-equilateral': { from: 0, base: [1, 2] },
  parallelogram: { from: 3, base: [0, 1] },
  trapezoid: { from: 3, base: [0, 1] },
  'trapezoid-general': { from: 3, base: [0, 1] },
  'triangle-isosceles': { from: 0, base: [1, 2] },
  'triangle-scalene': { from: 0, base: [1, 2] },
}
