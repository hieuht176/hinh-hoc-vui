/**
 * "Lát nền" (tiling) helpers: grow a floor out of copies of one 2D shape and measure how much of it is covered.
 *
 * Copies are made by a half-turn about the midpoint of a free edge, which puts an identical tile edge-to-edge
 * on the other side. That rule tiles the plane for every triangle and every convex quadrilateral, and for the
 * regular hexagon; for shapes that cannot tile (regular pentagon, octagon…) the copies that would overlap are
 * skipped, so the gaps show up exactly where the angles around a vertex do not add up to 360°.
 */
import { interiorAngles } from './shapeProps'

export type Pt = [number, number]
export type Poly = Pt[]

export const FRAME_W = 520
export const FRAME_H = 340

const centroid = (p: Poly): Pt => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]

/** Do two convex polygons overlap by more than a hair (separating-axis test)? Touching edges do not count. */
function overlaps(a: Poly, b: Poly, eps = 0.6): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]
      const q = poly[(i + 1) % poly.length]
      const nx = -(q[1] - p[1])
      const ny = q[0] - p[0]
      const len = Math.hypot(nx, ny) || 1
      let minA = Infinity,
        maxA = -Infinity,
        minB = Infinity,
        maxB = -Infinity
      for (const v of a) {
        const d = (v[0] * nx + v[1] * ny) / len
        minA = Math.min(minA, d)
        maxA = Math.max(maxA, d)
      }
      for (const v of b) {
        const d = (v[0] * nx + v[1] * ny) / len
        minB = Math.min(minB, d)
        maxB = Math.max(maxB, d)
      }
      if (maxA <= minB + eps || maxB <= minA + eps) return false
    }
  }
  return true
}

export interface Tile {
  points: Poly
  /** 0 or 1: which way round the tile is (used for the two-tone colouring). */
  flip: number
}

/** Grow a tiling from one tile placed at the frame centre (breadth-first, so it can be animated tile by tile). */
/**
 * `edgeStep` = 2 only grows across every other side (used for the regular octagon, so the copies line up in the
 * neat octagon-and-square-hole pattern instead of drifting out of line).
 */
export function growTiling(base: Poly, maxTiles = 260, edgeStep = 1): Tile[] {
  const cx = FRAME_W / 2
  const cy = FRAME_H / 2
  const start: Tile = { points: base.map(([x, y]) => [x + cx, y + cy]), flip: 0 }
  const radius = Math.max(...base.map(([x, y]) => Math.hypot(x, y)))
  const tiles: Tile[] = [start]
  const centres: Pt[] = [centroid(start.points)]
  const queue: Tile[] = [start]
  while (queue.length && tiles.length < maxTiles) {
    const t = queue.shift()!
    const n = t.points.length
    for (let i = 0; i < n; i += edgeStep) {
      const p = t.points[i]
      const q = t.points[(i + 1) % n]
      const mx = (p[0] + q[0]) / 2
      const my = (p[1] + q[1]) / 2
      const cand: Poly = t.points.map(([x, y]) => [2 * mx - x, 2 * my - y])
      const c = centroid(cand)
      if (c[0] < -radius || c[0] > FRAME_W + radius || c[1] < -radius || c[1] > FRAME_H + radius) continue
      if (centres.some((d) => Math.hypot(d[0] - c[0], d[1] - c[1]) < 0.5)) continue
      if (tiles.some((o) => overlaps(o.points, cand))) continue
      const tile = { points: cand, flip: 1 - t.flip }
      tiles.push(tile)
      centres.push(c)
      queue.push(tile)
    }
  }
  return tiles
}

/** Circles / ellipses can only be laid side by side in rows (they touch at single points). */
export function gridOfRound(rx: number, ry: number, segments = 40): Tile[] {
  const tiles: Tile[] = []
  const shape: Poly = Array.from({ length: segments }, (_, k) => {
    const a = (k / segments) * 2 * Math.PI
    return [rx * Math.cos(a), ry * Math.sin(a)]
  })
  const cols = Math.ceil(FRAME_W / (2 * rx)) + 1
  const rows = Math.ceil(FRAME_H / (2 * ry)) + 1
  const x0 = FRAME_W / 2 - Math.floor(cols / 2) * 2 * rx
  const y0 = FRAME_H / 2 - Math.floor(rows / 2) * 2 * ry
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * 2 * rx
      const cy = y0 + r * 2 * ry
      tiles.push({ points: shape.map(([x, y]) => [x + cx, y + cy]), flip: (r + c) % 2 })
    }
  return tiles
}

/**
 * Fill the square holes left by a regular-octagon tiling: on every side of an octagon that touches no other
 * octagon, build a square outwards and keep it if it fits the hole (no overlap) and touches at least 2 octagons,
 * which rules out squares sticking out at the edge of the floor where an octagon is simply missing.
 */
export function fillGapsWithSquares(tiles: Tile[]): Tile[] {
  const key = (p: Pt) => `${Math.round(p[0] * 2)}:${Math.round(p[1] * 2)}`
  const edgeKey = (p: Pt, q: Pt) => [key(p), key(q)].sort().join('|')
  const edgeCount = new Map<string, number>()
  for (const t of tiles)
    t.points.forEach((p, j) => {
      const e = edgeKey(p, t.points[(j + 1) % t.points.length])
      edgeCount.set(e, (edgeCount.get(e) ?? 0) + 1)
    })
  const squares: Tile[] = []
  const centres: Pt[] = []
  for (const t of tiles) {
    const c = centroid(t.points)
    t.points.forEach((p, j) => {
      const q = t.points[(j + 1) % t.points.length]
      if ((edgeCount.get(edgeKey(p, q)) ?? 0) > 1) return
      let nx = -(q[1] - p[1])
      let ny = q[0] - p[0]
      // Point the square away from the octagon it is built on.
      if (nx * ((p[0] + q[0]) / 2 - c[0]) + ny * ((p[1] + q[1]) / 2 - c[1]) < 0) {
        nx = -nx
        ny = -ny
      }
      const sq: Poly = [p, q, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]]
      const sc = centroid(sq)
      if (centres.some((d) => Math.hypot(d[0] - sc[0], d[1] - sc[1]) < 0.5)) return
      if (tiles.some((o) => overlaps(o.points, sq))) return
      const touching = sq.filter((a, i) => edgeCount.has(edgeKey(a, sq[(i + 1) % 4]))).length
      if (touching < 2) return
      squares.push({ points: sq, flip: 0 })
      centres.push(sc)
    })
  }
  return squares
}

/** Give each tile one of 3 tones so that tiles sharing a side never get the same tone (greedy colouring). */
export function toneTiles(tiles: Tile[]): number[] {
  const key = (p: Pt) => `${Math.round(p[0] * 2)}:${Math.round(p[1] * 2)}`
  const edgeOwners = new Map<string, number[]>()
  tiles.forEach((t, i) => {
    t.points.forEach((p, j) => {
      const q = t.points[(j + 1) % t.points.length]
      const e = [key(p), key(q)].sort().join('|')
      edgeOwners.set(e, [...(edgeOwners.get(e) ?? []), i])
    })
  })
  const neighbours = tiles.map(() => new Set<number>())
  for (const owners of edgeOwners.values())
    for (const a of owners) for (const b of owners) if (a !== b) neighbours[a].add(b)
  const tone: number[] = []
  tiles.forEach((_, i) => {
    const used = new Set([...neighbours[i]].filter((j) => j < i).map((j) => tone[j]))
    tone[i] = [0, 1, 2].find((c) => !used.has(c)) ?? 0
  })
  return tone
}

function inside(p: Pt, poly: Poly): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Share of the frame covered by tiles (0–1), estimated on a fine grid of sample points. */
export function coverage(tiles: Tile[], step = 4): number {
  let total = 0
  let covered = 0
  for (let y = step / 2; y < FRAME_H; y += step)
    for (let x = step / 2; x < FRAME_W; x += step) {
      total++
      if (tiles.some((t) => inside([x, y], t.points))) covered++
    }
  return covered / total
}

export interface VertexStar {
  vertex: Pt
  /** One entry per tile meeting at the vertex: that tile and its angle there. */
  corners: { tile: Poly; angle: number; from: Pt; to: Pt }[]
  sum: number
}

/** The fully-surrounded vertex nearest the frame centre, with the angle each tile brings to it. */
export function centralVertex(tiles: Tile[]): VertexStar | null {
  const groups = new Map<string, VertexStar>()
  for (const t of tiles) {
    const angles = interiorAngles(t.points)
    const n = t.points.length
    t.points.forEach((v, i) => {
      const key = `${Math.round(v[0] * 2)}:${Math.round(v[1] * 2)}`
      const g = groups.get(key) ?? { vertex: v, corners: [], sum: 0 }
      g.corners.push({ tile: t.points, angle: angles[i], from: t.points[(i - 1 + n) % n], to: t.points[(i + 1) % n] })
      g.sum += angles[i]
      groups.set(key, g)
    })
  }
  let best: VertexStar | null = null
  let bestD = Infinity
  for (const g of groups.values()) {
    if (Math.abs(g.sum - 360) > 0.5) continue
    const d = Math.hypot(g.vertex[0] - FRAME_W / 2, g.vertex[1] - FRAME_H / 2)
    if (d < bestD) {
      bestD = d
      best = g
    }
  }
  return best
}

/**
 * For a regular polygon that cannot tile: put as many copies as fit around one vertex by turning the tile about
 * that vertex, and report the angle that is left over (the gap).
 */
export function aroundVertexDemo(base: Poly): { copies: Poly[]; angle: number; count: number; gap: number; start: number; dir: number } {
  const v = base[0]
  const angle = interiorAngles(base)[0]
  const count = Math.floor(360 / angle + 1e-9)
  const rotate = (poly: Poly, deg: number): Poly => {
    const r = (deg * Math.PI) / 180
    return poly.map(([x, y]) => {
      const dx = x - v[0]
      const dy = y - v[1]
      return [v[0] + dx * Math.cos(r) - dy * Math.sin(r), v[1] + dx * Math.sin(r) + dy * Math.cos(r)]
    })
  }
  // Turn the way that puts the copy beside the original, not on top of it.
  const dir = overlaps(base, rotate(base, angle)) ? -1 : 1
  const copies = Array.from({ length: count }, (_, k) => rotate(base, dir * k * angle))
  // The original covers the wedge between its two edges at v; copies extend it in direction `dir`.
  const n = base.length
  const a1 = (Math.atan2(base[1][1] - v[1], base[1][0] - v[0]) * 180) / Math.PI
  const a2 = (Math.atan2(base[n - 1][1] - v[1], base[n - 1][0] - v[0]) * 180) / Math.PI
  const norm = (d: number) => ((d % 360) + 360) % 360
  const start = norm(a2 + dir * angle - a1) < 0.5 || norm(a2 + dir * angle - a1) > 359.5 ? a2 : a1
  return { copies, angle, count, gap: 360 - count * angle, start, dir }
}
