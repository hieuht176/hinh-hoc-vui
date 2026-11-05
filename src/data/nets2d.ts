export type NetPart =
  | { kind: 'polygon'; points: [number, number][]; label?: string; fillOpacity?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; label?: string }

const SQRT3 = Math.sqrt(3)

function rectPoints(x0: number, y0: number, w: number, h: number): [number, number][] {
  return [
    [x0, y0],
    [x0 + w, y0],
    [x0 + w, y0 + h],
    [x0, y0 + h],
  ]
}

function sectorPolygon(radius: number, halfAngleRad: number, segments = 32): [number, number][] {
  const pts: [number, number][] = [[0, 0]]
  for (let k = 0; k <= segments; k++) {
    const a = -halfAngleRad + (k * (2 * halfAngleRad)) / segments
    pts.push([radius * Math.sin(a), radius * Math.cos(a)])
  }
  return pts
}

export function getNet2D(shapeId: string, p: Record<string, number>): NetPart[] {
  switch (shapeId) {
    case 'cube': {
      const a = p.a
      return [
        { kind: 'polygon', points: rectPoints(0, -a, a, a), label: 'Trên' },
        { kind: 'polygon', points: rectPoints(-a, 0, a, a), label: 'Trái' },
        { kind: 'polygon', points: rectPoints(0, 0, a, a), label: 'Trước' },
        { kind: 'polygon', points: rectPoints(a, 0, a, a), label: 'Phải' },
        { kind: 'polygon', points: rectPoints(2 * a, 0, a, a), label: 'Sau' },
        { kind: 'polygon', points: rectPoints(0, a, a, a), label: 'Dưới' },
      ]
    }
    case 'cuboid': {
      const { a, b, c } = p
      return [
        { kind: 'polygon', points: rectPoints(b, -b, a, b), label: 'Trên' },
        { kind: 'polygon', points: rectPoints(0, 0, b, c), label: 'Trái' },
        { kind: 'polygon', points: rectPoints(b, 0, a, c), label: 'Trước' },
        { kind: 'polygon', points: rectPoints(b + a, 0, b, c), label: 'Phải' },
        { kind: 'polygon', points: rectPoints(2 * b + a, 0, a, c), label: 'Sau' },
        { kind: 'polygon', points: rectPoints(b, c, a, b), label: 'Dưới' },
      ]
    }
    case 'square-pyramid': {
      const { a, h } = p
      const l = Math.hypot(h, a / 2)
      const h2 = a / 2
      return [
        { kind: 'polygon', points: rectPoints(-h2, -h2, a, a), label: 'Đáy' },
        { kind: 'polygon', points: [[-h2, -h2], [h2, -h2], [0, -h2 - l]] },
        { kind: 'polygon', points: [[h2, -h2], [h2, h2], [h2 + l, 0]] },
        { kind: 'polygon', points: [[h2, h2], [-h2, h2], [0, h2 + l]] },
        { kind: 'polygon', points: [[-h2, h2], [-h2, -h2], [-h2 - l, 0]] },
      ]
    }
    case 'triangular-prism': {
      const { a, h } = p
      const triH = (SQRT3 / 2) * a
      return [
        { kind: 'polygon', points: rectPoints(0, 0, a, h), label: '1' },
        { kind: 'polygon', points: rectPoints(a, 0, a, h), label: '2' },
        { kind: 'polygon', points: rectPoints(2 * a, 0, a, h), label: '3' },
        { kind: 'polygon', points: [[0, 0], [a, 0], [a / 2, -triH]] },
        { kind: 'polygon', points: [[2 * a, h], [3 * a, h], [2.5 * a, h + triH]] },
      ]
    }
    case 'octahedron': {
      const a = p.a
      const triH = (SQRT3 / 2) * a
      // Valid connected net: a zig-zag strip of 6 triangles (the "belt" around the octahedron),
      // plus the top face hinged on triangle 2's upper edge and the bottom face on triangle 5's lower edge.
      const parts: NetPart[] = []
      for (let k = 0; k < 6; k++) {
        const x0 = (k * a) / 2
        const up = k % 2 === 0
        parts.push({
          kind: 'polygon',
          points: up ? [[x0, triH], [x0 + a, triH], [x0 + a / 2, 0]] : [[x0, 0], [x0 + a, 0], [x0 + a / 2, triH]],
        })
      }
      parts.push({ kind: 'polygon', points: [[a / 2, 0], [(3 * a) / 2, 0], [a, -triH]] })
      parts.push({ kind: 'polygon', points: [[2 * a, triH], [3 * a, triH], [2.5 * a, 2 * triH]] })
      return parts
    }
    case 'cylinder': {
      const { r, h } = p
      const w = 2 * Math.PI * r
      return [
        { kind: 'polygon', points: rectPoints(0, 0, w, h), label: 'Mặt xung quanh' },
        { kind: 'circle', cx: w / 2, cy: -r, r, label: 'Đáy trên' },
        { kind: 'circle', cx: w / 2, cy: h + r, r, label: 'Đáy dưới' },
      ]
    }
    case 'cone': {
      const { r, h } = p
      const l = Math.hypot(r, h)
      const halfAngle = (Math.PI * r) / l
      return [
        { kind: 'polygon', points: sectorPolygon(l, halfAngle), label: 'Mặt xung quanh' },
        { kind: 'circle', cx: 0, cy: l + r, r, label: 'Đáy' },
      ]
    }
    default:
      return []
  }
}

export const NET_SUPPORTED_IDS = ['cube', 'cuboid', 'square-pyramid', 'triangular-prism', 'octahedron', 'cylinder', 'cone']
export const ANIMATED_FOLD_IDS = ['cube', 'cuboid', 'square-pyramid']
