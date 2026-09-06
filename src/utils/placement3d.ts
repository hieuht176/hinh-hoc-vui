import { buildGeometry3D } from '../components/viewer3d/ShapeMesh3D'

export interface HalfExtents {
  hx: number
  hy: number
  hz: number
}

/** Half-extents of a shape's own (unrotated, unscaled) geometry, from its bounding box. */
export function getHalfExtents(shapeId: string, params: Record<string, number>): HalfExtents {
  const geo = buildGeometry3D(shapeId, params)
  geo.computeBoundingBox()
  const b = geo.boundingBox!
  return {
    hx: (b.max.x - b.min.x) / 2,
    hy: (b.max.y - b.min.y) / 2,
    hz: (b.max.z - b.min.z) / 2,
  }
}

/** Axis-aligned footprint of an already-placed shape, in world space. */
export interface Footprint {
  x: number
  z: number
  hx: number
  hz: number
  maxY: number
}

const MARGIN = 0.02

function overlapsXZ(a: { x: number; hx: number; z: number; hz: number }, b: { x: number; hx: number; z: number; hz: number }) {
  return (
    a.x - a.hx < b.x + b.hx - MARGIN &&
    a.x + a.hx > b.x - b.hx + MARGIN &&
    a.z - a.hz < b.z + b.hz - MARGIN &&
    a.z + a.hz > b.z - b.hz + MARGIN
  )
}

/**
 * The height a shape's bottom face should rest at, given its footprint and everything
 * already placed: the ground (0) unless it overlaps another shape's footprint, in which
 * case it rests on top of the tallest one it overlaps — so shapes stack instead of clipping
 * through each other.
 */
export function restingBottomY(x: number, z: number, hx: number, hz: number, others: Footprint[]): number {
  let top = 0
  for (const o of others) {
    if (overlapsXZ({ x, hx, z, hz }, o)) top = Math.max(top, o.maxY)
  }
  return top
}

/**
 * Finds the closest-to-origin free (x, z) where a shape of half-extents hx/hz sits snugly
 * beside everything else — scans outward in a fine polar grid so it hugs the nearest free
 * edge instead of jumping to the next coarse grid cell.
 */
export function findFreeSpot(hx: number, hz: number, others: Footprint[]): [number, number] {
  if (others.length === 0) return [0, 0]
  if (others.every((o) => !overlapsXZ({ x: 0, hx, z: 0, hz }, o))) return [0, 0]

  const maxHalf = others.reduce((m, o) => Math.max(m, o.hx, o.hz), Math.max(hx, hz))
  const maxRadius = (others.length + 1) * (maxHalf * 2 + 1)
  const radiusStep = 0.2
  const angleSteps = 16

  for (let r = radiusStep; r <= maxRadius; r += radiusStep) {
    for (let a = 0; a < angleSteps; a++) {
      const theta = (a / angleSteps) * Math.PI * 2
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      if (others.every((o) => !overlapsXZ({ x, hx, z, hz }, o))) return [round2(x), round2(z)]
    }
  }
  return [others.length * (maxHalf * 2 + 1), 0]
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
