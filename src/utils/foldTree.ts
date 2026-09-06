export interface FoldFace {
  id: string
  /** local vertices (x,y,z), y=0 for all — the face's flat shape before its own hinge rotation is applied */
  vertices: [number, number, number][]
  color: string
  /** where this face's hinge sits within the PARENT's local frame (undefined only for the root) */
  pivot?: [number, number, number]
  /** hinge rotation axis (undefined for the root, which never animates) */
  axis?: 'x' | 'z'
  /** target rotation (radians) applied about `axis` at t=1; the face lies flat (part of the net) at t=0 */
  foldAngle?: number
  children?: FoldFace[]
}

const HALF = Math.PI / 2

/** A box (cuboid) net: bottom is the root, front/back/left/right hinge off its 4 edges, top hinges off the back face. */
export function buildBoxFoldTree(width: number, height: number, depth: number, color: string): FoldFace {
  return {
    id: 'bottom',
    color,
    vertices: [
      [0, 0, 0],
      [width, 0, 0],
      [width, 0, depth],
      [0, 0, depth],
    ],
    children: [
      {
        id: 'front',
        color,
        axis: 'x',
        pivot: [0, 0, 0],
        foldAngle: HALF,
        vertices: [
          [0, 0, 0],
          [width, 0, 0],
          [width, 0, -height],
          [0, 0, -height],
        ],
      },
      {
        id: 'back',
        color,
        axis: 'x',
        pivot: [0, 0, depth],
        foldAngle: -HALF,
        vertices: [
          [0, 0, 0],
          [width, 0, 0],
          [width, 0, height],
          [0, 0, height],
        ],
        children: [
          {
            id: 'top',
            color,
            axis: 'x',
            pivot: [0, 0, height],
            foldAngle: -HALF,
            vertices: [
              [0, 0, 0],
              [width, 0, 0],
              [width, 0, depth],
              [0, 0, depth],
            ],
          },
        ],
      },
      {
        id: 'left',
        color,
        axis: 'z',
        pivot: [0, 0, 0],
        foldAngle: -HALF,
        vertices: [
          [0, 0, 0],
          [0, 0, depth],
          [-height, 0, depth],
          [-height, 0, 0],
        ],
      },
      {
        id: 'right',
        color,
        axis: 'z',
        pivot: [width, 0, 0],
        foldAngle: HALF,
        vertices: [
          [0, 0, 0],
          [0, 0, depth],
          [height, 0, depth],
          [height, 0, 0],
        ],
      },
    ],
  }
}

/** A square-pyramid net: base square is the root, 4 triangular lateral faces hinge directly off its 4 edges. */
export function buildPyramidFoldTree(a: number, h: number, color: string): FoldFace {
  const l = Math.hypot(h, a / 2)
  const alpha = Math.atan2(h, a / 2)
  const pos = Math.PI - alpha
  const neg = alpha - Math.PI
  return {
    id: 'base',
    color,
    vertices: [
      [0, 0, 0],
      [a, 0, 0],
      [a, 0, a],
      [0, 0, a],
    ],
    children: [
      { id: 'south', color, axis: 'x', pivot: [0, 0, 0], foldAngle: pos, vertices: [[0, 0, 0], [a, 0, 0], [a / 2, 0, -l]] },
      { id: 'north', color, axis: 'x', pivot: [0, 0, a], foldAngle: neg, vertices: [[0, 0, 0], [a, 0, 0], [a / 2, 0, l]] },
      { id: 'east', color, axis: 'z', pivot: [a, 0, 0], foldAngle: pos, vertices: [[0, 0, 0], [0, 0, a], [l, 0, a / 2]] },
      { id: 'west', color, axis: 'z', pivot: [0, 0, 0], foldAngle: neg, vertices: [[0, 0, 0], [0, 0, a], [-l, 0, a / 2]] },
    ],
  }
}

export function foldTreeFootprint(shapeId: string, p: Record<string, number>): { w: number; d: number } {
  if (shapeId === 'cube') return { w: p.a, d: p.a }
  if (shapeId === 'cuboid') return { w: p.a, d: p.b }
  if (shapeId === 'square-pyramid') return { w: p.a, d: p.a }
  return { w: 1, d: 1 }
}
