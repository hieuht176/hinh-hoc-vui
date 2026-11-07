/**
 * Mirror axes through the centre of the picture, and everything needed to turn "these axes are switched on"
 * into the full set of copies (the symmetry group they generate), plus checks on square grid patterns.
 */

export type AxisId = 'h' | 'v' | 'd1' | 'd2'

export interface AxisDef {
  id: AxisId
  label: string
  icon: string
  /** Angle of the line with the x-axis (world coordinates, y up). */
  angleDeg: number
  color: string
}

export const AXES: AxisDef[] = [
  { id: 'h', label: 'Trục ngang', icon: '↔️', angleDeg: 0, color: '#dc2626' },
  { id: 'v', label: 'Trục dọc', icon: '↕️', angleDeg: 90, color: '#2563eb' },
  { id: 'd1', label: 'Chéo /', icon: '↗️', angleDeg: 45, color: '#16a34a' },
  { id: 'd2', label: 'Chéo \\', icon: '↘️', angleDeg: 135, color: '#d97706' },
]
export const axisById = Object.fromEntries(AXES.map((a) => [a.id, a])) as Record<AxisId, AxisDef>

/** 2×2 matrix [a, b, c, d]: x' = a·x + b·y, y' = c·x + d·y. */
export type Mat = [number, number, number, number]

const IDENTITY: Mat = [1, 0, 0, 1]

export function reflectionMat(angleDeg: number): Mat {
  const phi = (angleDeg * Math.PI) / 180
  const c2 = Math.round(Math.cos(2 * phi) * 1e9) / 1e9
  const s2 = Math.round(Math.sin(2 * phi) * 1e9) / 1e9
  return [c2, s2, s2, -c2]
}

function mul(m: Mat, n: Mat): Mat {
  return [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3]]
}

const key = (m: Mat) => m.map((v) => Math.round(v * 1e6)).join(',')

/**
 * Every transformation you get by reflecting again and again in the switched-on axes, until nothing new
 * appears ("lấy đối xứng cho đến khi đủ"). Identity first. 1 axis → 2 copies, 2 perpendicular axes → 4,
 * horizontal + a diagonal (or all 4 axes) → 8.
 */
export function groupFromAxes(axes: AxisId[]): Mat[] {
  const gens = axes.map((a) => reflectionMat(axisById[a].angleDeg))
  const out: Mat[] = [IDENTITY]
  const seen = new Set([key(IDENTITY)])
  for (let i = 0; i < out.length; i++) {
    for (const g of gens) {
      const m = mul(g, out[i])
      const k = key(m)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(m)
      }
    }
  }
  return out
}

/** The axes that are mirror lines of the group (it can contain axes nobody switched on). */
export function axesInGroup(group: Mat[]): AxisId[] {
  const keys = new Set(group.map(key))
  return AXES.filter((a) => keys.has(key(reflectionMat(a.angleDeg)))).map((a) => a.id)
}

export function applyMat(m: Mat, [x, y]: [number, number]): [number, number] {
  return [m[0] * x + m[1] * y, m[2] * x + m[3] * y]
}

/* ------------------------------------------------------------------ square grid patterns */

/** Colour of every cell, row by row from the top-left; null = blank. */
export type Cells = (string | null)[]

/** Where cell `i` of an n×n grid goes under m (reflections about the grid centre keep cells on cells). */
export function mapCell(m: Mat, i: number, n: number): number {
  const h = (n - 1) / 2
  const r = Math.floor(i / n)
  const c = i % n
  const [x, y] = applyMat(m, [c - h, h - r])
  return Math.round(h - y) * n + Math.round(x + h)
}

/** The axes this pattern is symmetric about. */
export function symmetricAxes(cells: Cells, n: number): AxisId[] {
  return AXES.filter((a) => {
    const m = reflectionMat(a.angleDeg)
    return cells.every((col, i) => cells[mapCell(m, i, n)] === col)
  }).map((a) => a.id)
}

/** All cells that cell i lands on, under every transformation of the group (including i). */
export function orbit(group: Mat[], i: number, n: number): number[] {
  return [...new Set(group.map((m) => mapCell(m, i, n)))]
}

/**
 * The fewest cells to colour so that the pattern becomes symmetric about `axes` (and everything they force):
 * every coloured cell's images get its colour. null when two different colours would have to share a cell.
 */
export function cellsToComplete(cells: Cells, n: number, axes: AxisId[]): { index: number; color: string }[] | null {
  const group = groupFromAxes(axes)
  const done = new Set<number>()
  const out: { index: number; color: string }[] = []
  for (let i = 0; i < cells.length; i++) {
    if (done.has(i)) continue
    const o = orbit(group, i, n)
    o.forEach((j) => done.add(j))
    const colours = new Set(o.map((j) => cells[j]).filter((c): c is string => c !== null))
    if (colours.size > 1) return null
    if (colours.size === 1) {
      const [colour] = colours
      o.forEach((j) => cells[j] === null && out.push({ index: j, color: colour }))
    }
  }
  return out
}

/** Fill in `cellsToComplete`, skipping cells where colours would clash (first colour found wins). */
export function completePattern(cells: Cells, n: number, axes: AxisId[]): Cells {
  const group = groupFromAxes(axes)
  const out = [...cells]
  cells.forEach((col, i) => {
    if (col === null) return
    for (const j of orbit(group, i, n)) if (out[j] === null) out[j] = col
  })
  return out
}

/** Axis sets that are "closed" (switching them on doesn't force any other axis), grouped by size. */
const CLOSED_SETS: Record<number, AxisId[][]> = {
  1: [['h'], ['v'], ['d1'], ['d2']],
  2: [['h', 'v'], ['d1', 'd2']],
  4: [['h', 'v', 'd1', 'd2']],
}

export interface SymmetryHint {
  axes: AxisId[]
  fill: { index: number; color: string }[]
}

/**
 * Fewest extra cells to colour so the pattern has EXACTLY `count` axes of symmetry (1, 2 or 4).
 * Only adds colour, never removes. null if no way was found.
 */
export function hintForAxisCount(cells: Cells, n: number, count: number): SymmetryHint | null {
  let best: SymmetryHint | null = null
  for (const axes of CLOSED_SETS[count] ?? []) {
    const fill = cellsToComplete(cells, n, axes)
    if (!fill) continue
    const next = [...cells]
    fill.forEach((f) => (next[f.index] = f.color))
    if (symmetricAxes(next, n).length !== count) continue
    if (!best || fill.length < best.fill.length) best = { axes, fill }
  }
  return best
}
