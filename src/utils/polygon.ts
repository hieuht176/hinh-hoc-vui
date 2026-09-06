export function regularPolygonPoints(sides: number, radius: number, rotationDeg = -90): [number, number][] {
  const pts: [number, number][] = []
  const start = (rotationDeg * Math.PI) / 180
  for (let i = 0; i < sides; i++) {
    const a = start + (i * 2 * Math.PI) / sides
    pts.push([radius * Math.cos(a), radius * Math.sin(a)])
  }
  return pts
}

/** Alternating outer/inner radius star outline (e.g. a 5-pointed star = spikes=5). */
export function starPoints(spikes: number, outerRadius: number, innerRadius: number, rotationDeg = 90): [number, number][] {
  const pts: [number, number][] = []
  const start = (rotationDeg * Math.PI) / 180
  const step = Math.PI / spikes
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const a = start + i * step
    pts.push([r * Math.cos(a), r * Math.sin(a)])
  }
  return pts
}

/** side length -> circumradius for a regular polygon */
export function sideToCircumradius(sides: number, side: number): number {
  return side / (2 * Math.sin(Math.PI / sides))
}

export function polygonPerimeterFromPoints(points: [number, number][]): number {
  let per = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    per += Math.hypot(x2 - x1, y2 - y1)
  }
  return per
}

/** Fit an arbitrary set of points (or a bounding box) into a square viewBox, returns transform + scale */
export function fitToViewBox(
  points: [number, number][],
  viewBoxSize: number,
  padding = 20,
): { scale: number; offsetX: number; offsetY: number } {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = Math.max(maxX - minX, 0.001)
  const h = Math.max(maxY - minY, 0.001)
  const available = viewBoxSize - padding * 2
  const scale = Math.min(available / w, available / h)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const offsetX = viewBoxSize / 2 - cx * scale
  const offsetY = viewBoxSize / 2 - cy * scale
  return { scale, offsetX, offsetY }
}

export function pointsToPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z'
}
