/**
 * Patterned shapes for "Phép đối xứng quay" (rotational symmetry), drawn from simple geometry in the spirit of
 * the textbook exercises: coloured 3×3 grids, a triangle made of 9 small triangles, decorative tiles, road signs
 * and flowers (one with a ladybug that breaks the symmetry). Each one has a known rotational-symmetry order.
 *
 * All coordinates are in grid squares, centred on (0, 0) = the centre the shape turns about, y pointing up.
 */
import type { PatternPart, PointShapeDef } from './pointShapes'

type Pt = [number, number]

const rotate = ([x, y]: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
}
const rotateAll = (pts: Pt[], deg: number) => pts.map((p) => rotate(p, deg))
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]
const square = (half: number): Pt[] => rect(-half, -half, half, half)
/** Regular polygon with a vertex pointing straight up. */
const regular = (n: number, r: number, startDeg = 90): Pt[] =>
  Array.from({ length: n }, (_, k) => {
    const a = ((startDeg + (k * 360) / n) * Math.PI) / 180
    return [r * Math.cos(a), r * Math.sin(a)] as Pt
  })
/** Oval petal pointing at `deg`, its centre `dist` from the middle. */
const petal = (deg: number, dist: number, len: number, wid: number, pointy = false): Pt[] => {
  const pts: Pt[] = []
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * 2 * Math.PI
    const w = pointy ? wid * Math.sin(t) * (1 - 0.55 * Math.cos(t)) : wid * Math.sin(t)
    pts.push(rotate([dist + len * Math.cos(t), w], deg))
  }
  return pts
}
const poly = (points: Pt[], fill: string, stroke = '#1e293b'): PatternPart => ({ kind: 'polygon', points, fill, stroke })
const disc = (cx: number, cy: number, r: number, fill: string, stroke = '#1e293b'): PatternPart => ({ kind: 'circle', c: [cx, cy], r, fill, stroke })

/** 3×3 grid: `colored[row][col]` (row 0 at the top) says which cells are filled. */
function grid(colored: number[][], color: string): PatternPart[] {
  const parts: PatternPart[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const x0 = -1.5 + c
      const y1 = 1.5 - r
      parts.push(poly(rect(x0, y1 - 1, x0 + 1, y1), colored[r][c] ? color : '#ffffff'))
    }
  return parts
}

/** Big equilateral triangle cut into 9 small ones: the 6 pointing up coloured, the 3 pointing down white. */
function triangleOfNine(): { outline: Pt[]; parts: PatternPart[] } {
  const side = 3.3
  const R = side / Math.sqrt(3)
  const [A, B, C] = [rotate([0, R], 0), rotate([0, R], 120), rotate([0, R], 240)]
  const P = (i: number, j: number): Pt => [
    B[0] + (i * (C[0] - B[0]) + j * (A[0] - B[0])) / 3,
    B[1] + (i * (C[1] - B[1]) + j * (A[1] - B[1])) / 3,
  ]
  const parts: PatternPart[] = []
  for (let i = 0; i < 3; i++)
    for (let j = 0; i + j < 3; j++) {
      parts.push(poly([P(i, j), P(i + 1, j), P(i, j + 1)], '#5cb85c'))
      if (i + j < 2) parts.push(poly([P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], '#ffffff'))
    }
  return { outline: [A, B, C], parts }
}

/** Arrow shape (shaft + head) pointing up, centred on the origin. */
const upArrow = (len: number, w: number): Pt[] => [
  [-w / 2, -len / 2],
  [w / 2, -len / 2],
  [w / 2, len * 0.1],
  [w * 1.3, len * 0.1],
  [0, len / 2],
  [-w * 1.3, len * 0.1],
  [-w / 2, len * 0.1],
]

const tri9 = triangleOfNine()

function flower(petals: number, color: string, pointy: boolean): PatternPart[] {
  return [
    ...Array.from({ length: petals }, (_, k) => poly(petal(90 + (k * 360) / petals, 0.95, 0.75, pointy ? 0.32 : 0.48, pointy), color)),
    disc(0, 0, 0.45, '#fcd34d'),
  ]
}

function ladybug(cx: number, cy: number): PatternPart[] {
  return [
    disc(cx, cy, 0.26, '#dc2626', '#111827'),
    disc(cx, cy + 0.27, 0.11, '#111827', '#111827'),
    poly([[cx - 0.015, cy - 0.25], [cx + 0.015, cy - 0.25], [cx + 0.015, cy + 0.2], [cx - 0.015, cy + 0.2]], '#111827', '#111827'),
    disc(cx - 0.12, cy + 0.05, 0.05, '#111827', '#111827'),
    disc(cx + 0.12, cy - 0.08, 0.05, '#111827', '#111827'),
  ]
}

export const PATTERN_SHAPES: PointShapeDef[] = [
  {
    id: 'grid-order2',
    name: 'Lưới ô vuông (A)',
    kind: 'polygon',
    group: 'pattern',
    localPoints: square(1.5),
    parts: grid(
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      '#ec4899',
    ),
    color: '#ffffff',
    rotationalOrder: 2,
  },
  {
    id: 'grid-order4',
    name: 'Lưới ô vuông (B)',
    kind: 'polygon',
    group: 'pattern',
    localPoints: square(1.5),
    parts: grid(
      [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ],
      '#4f6bd8',
    ),
    color: '#ffffff',
    rotationalOrder: 4,
  },
  {
    id: 'triangle-nine',
    name: 'Tam giác ghép',
    kind: 'polygon',
    group: 'pattern',
    localPoints: tri9.outline,
    parts: tri9.parts,
    color: '#ffffff',
    rotationalOrder: 3,
  },
  {
    id: 'tile-flower4',
    name: 'Gạch hoa 4 cánh',
    kind: 'polygon',
    group: 'pattern',
    localPoints: square(1.6),
    parts: [
      poly(square(1.6), '#b5523b'),
      ...[0, 90, 180, 270].map((d) => poly(rotateAll([[1.6, 1.6], [0.8, 1.6], [1.6, 0.8]], d), '#a5dcf0')),
      ...[45, 135, 225, 315].map((d) => poly(petal(d, 0.62, 0.55, 0.3, true), '#a5dcf0')),
      ...[0, 90, 180, 270].map((d) => poly(petal(d, 0.55, 0.38, 0.16, true), '#f8fafc')),
      disc(0, 0, 0.3, '#f8fafc'),
    ],
    color: '#b5523b',
    rotationalOrder: 4,
  },
  {
    id: 'tile-hexstar',
    name: 'Gạch lục giác',
    kind: 'polygon',
    group: 'pattern',
    localPoints: regular(6, 1.75, 0),
    parts: [
      poly(regular(6, 1.75, 0), '#bae6fd'),
      ...Array.from({ length: 6 }, (_, k) => {
        const th = 90 + k * 60
        const s = 0.85
        const u = rotate([s, 0], th - 30)
        const w = rotate([s, 0], th + 30)
        return poly(
          [
            [0, 0],
            u,
            [u[0] + w[0], u[1] + w[1]],
            w,
          ],
          k % 2 === 0 ? '#1e3a8a' : '#ffffff',
        )
      }),
    ],
    color: '#bae6fd',
    rotationalOrder: 3,
  },
  {
    id: 'tile-border',
    name: 'Gạch viền',
    kind: 'polygon',
    group: 'pattern',
    localPoints: rect(-1.8, -0.9, 1.8, 0.9),
    parts: [
      poly(rect(-1.8, -0.9, 1.8, 0.9), '#e8dcc0'),
      ...[0, 180].flatMap((d) => [
        poly(rotateAll([[-1.55, -0.65], [-0.35, -0.65], [-1.55, 0.45]], d), '#2a9d8f'),
        poly(rotateAll(petal(30, 0.0, 0.32, 0.16, true).map(([x, y]) => [x - 0.6, y + 0.35] as Pt), d), '#e76f51'),
      ]),
      disc(0, 0, 0.18, '#2a9d8f'),
    ],
    color: '#e8dcc0',
    rotationalOrder: 2,
  },
  {
    id: 'sign-roundabout',
    name: 'Biển vòng xuyến',
    kind: 'polygon',
    group: 'pattern',
    localPoints: regular(3, 1.8),
    parts: [
      poly(regular(3, 1.8), '#dc2626'),
      poly(regular(3, 1.25), '#ffffff', '#ffffff'),
      ...[0, 120, 240].map((d) =>
        poly(
          rotateAll(
            [
              [-0.22, 0.42],
              [0.12, 0.42],
              [0.12, 0.55],
              [0.34, 0.36],
              [0.12, 0.17],
              [0.12, 0.3],
              [-0.22, 0.3],
            ],
            d,
          ),
          '#111827',
          '#111827',
        ),
      ),
    ],
    color: '#dc2626',
    rotationalOrder: 3,
  },
  {
    id: 'sign-no-entry',
    name: 'Biển cấm đi ngược chiều',
    kind: 'circle',
    group: 'pattern',
    radius: 1.5,
    parts: [disc(0, 0, 1.5, '#dc2626'), poly(rect(-1.05, -0.24, 1.05, 0.24), '#ffffff', '#ffffff')],
    color: '#dc2626',
    rotationalOrder: 2,
  },
  {
    id: 'sign-ahead',
    name: 'Biển đi thẳng',
    kind: 'circle',
    group: 'pattern',
    radius: 1.5,
    parts: [disc(0, 0, 1.5, '#1d4ed8'), poly(upArrow(1.9, 0.42), '#ffffff', '#ffffff')],
    color: '#1d4ed8',
    rotationalOrder: 1,
  },
  {
    id: 'sign-no-stopping',
    name: 'Biển cấm dừng đỗ',
    kind: 'circle',
    group: 'pattern',
    radius: 1.5,
    parts: [
      disc(0, 0, 1.5, '#dc2626'),
      disc(0, 0, 1.18, '#38bdf8', '#38bdf8'),
      ...[45, 135].map((d) => poly(rotateAll(rect(-1.18, -0.15, 1.18, 0.15), d), '#dc2626', '#dc2626')),
    ],
    color: '#dc2626',
    rotationalOrder: 4,
  },
  {
    id: 'flower5',
    name: 'Hoa 5 cánh',
    kind: 'polygon',
    group: 'pattern',
    hideOutline: true,
    localPoints: regular(5, 1.7),
    parts: flower(5, '#f9a8d4', false),
    color: '#f9a8d4',
    rotationalOrder: 5,
  },
  {
    id: 'flower8',
    name: 'Hoa 8 cánh',
    kind: 'polygon',
    group: 'pattern',
    hideOutline: true,
    localPoints: regular(8, 1.7),
    parts: flower(8, '#a78bfa', true),
    color: '#a78bfa',
    rotationalOrder: 8,
  },
  {
    id: 'flower5-ladybug',
    name: 'Hoa có bọ rùa',
    kind: 'polygon',
    group: 'pattern',
    hideOutline: true,
    localPoints: regular(5, 1.7),
    // The ladybug sits on one petal, so only a full turn brings the picture back exactly: order 1.
    parts: [...flower(5, '#f9a8d4', false), ...ladybug(...rotate([1.05, 0], 90 + 72 * 3))],
    color: '#f9a8d4',
    rotationalOrder: 1,
  },
]
