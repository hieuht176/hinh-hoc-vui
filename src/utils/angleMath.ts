export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Point at `deg` degrees (measured counter-clockwise from the +x axis, screen-up convention) and radius `r` from (cx, cy). */
export function polarToCartesian(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
}

/** Degrees (0-360, counter-clockwise from +x axis, screen-up convention) of the vector from (cx,cy) to (px,py). */
export function angleOfPoint(cx: number, cy: number, px: number, py: number): number {
  const deg = (Math.atan2(-(py - cy), px - cx) * 180) / Math.PI
  return (deg + 360) % 360
}

/** Interior angle (0-180°) at vertex `v`, between rays v->a and v->b. */
export function interiorAngleDeg(v: [number, number], a: [number, number], b: [number, number]): number {
  const ux = a[0] - v[0]
  const uy = a[1] - v[1]
  const wx = b[0] - v[0]
  const wy = b[1] - v[1]
  const lu = Math.hypot(ux, uy) || 1e-6
  const lw = Math.hypot(wx, wy) || 1e-6
  const cos = clamp((ux * wx + uy * wy) / (lu * lw), -1, 1)
  return (Math.acos(cos) * 180) / Math.PI
}

/** SVG arc path between two angles (deg, screen-up convention) at radius r around (cx, cy). */
export function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [x1, y1] = polarToCartesian(cx, cy, r, startDeg)
  const [x2, y2] = polarToCartesian(cx, cy, r, endDeg)
  let sweep = endDeg - startDeg
  sweep = ((sweep % 360) + 360) % 360
  const largeArc = sweep > 180 ? 1 : 0
  // screen-up convention (y flipped) reverses the sweep-flag sense for a CCW arc
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`
}
