import type { Shape2DDef } from '../types'
import { regularPolygonPoints, sideToCircumradius } from '../utils/polygon'

const SQRT3 = Math.sqrt(3)

/** "Tứ giác thường": vertices on two diagonals that cross at 70° (left, top, right, bottom). */
function quadPoints(p: Record<string, number>): [number, number][] {
  const a = (70 * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  return [
    [-p.l, 0],
    [-p.u * ux, -p.u * uy],
    [p.r, 0],
    [p.d * ux, p.d * uy],
  ]
}

export const shapes2D: Shape2DDef[] = [
  {
    id: 'square',
    name: 'Hình vuông',
    category: 'Tứ giác',
    description: 'Tứ giác đều có 4 cạnh bằng nhau và 4 góc vuông. Là trường hợp đặc biệt của hình chữ nhật và hình thoi.',
    properties: [
      '4 cạnh bằng nhau',
      '4 góc vuông (90°)',
      '2 đường chéo bằng nhau, vuông góc và cắt nhau tại trung điểm mỗi đường',
      'Có 4 trục đối xứng',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = 4a' },
      { label: 'Diện tích', formula: 'S = a²' },
      { label: 'Đường chéo', formula: 'd = a√2' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 10, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 4 },
    area: (p) => p.a * p.a,
    perimeter: (p) => 4 * p.a,
    kind: 'polygon',
    points: (p) => {
      const r = p.a / 2
      return [
        [-r, -r],
        [r, -r],
        [r, r],
        [-r, r],
      ]
    },
    color: '#6366f1',
  },
  {
    id: 'rectangle',
    name: 'Hình chữ nhật',
    category: 'Tứ giác',
    description: 'Tứ giác có 4 góc vuông, các cạnh đối song song và bằng nhau.',
    properties: [
      'Các cạnh đối song song và bằng nhau',
      '4 góc vuông',
      '2 đường chéo bằng nhau và cắt nhau tại trung điểm',
      'Có 2 trục đối xứng',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = 2(a + b)' },
      { label: 'Diện tích', formula: 'S = a × b' },
    ],
    params: [
      { key: 'a', label: 'Chiều dài a', min: 1, max: 12, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Chiều rộng b', min: 1, max: 10, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 6, b: 3.5 },
    area: (p) => p.a * p.b,
    perimeter: (p) => 2 * (p.a + p.b),
    kind: 'polygon',
    points: (p) => {
      const hx = p.a / 2
      const hy = p.b / 2
      return [
        [-hx, -hy],
        [hx, -hy],
        [hx, hy],
        [-hx, hy],
      ]
    },
    color: '#0ea5e9',
  },
  {
    id: 'triangle-equilateral',
    name: 'Tam giác đều',
    category: 'Đa giác',
    description: 'Tam giác có 3 cạnh bằng nhau và 3 góc bằng nhau, mỗi góc bằng 60°.',
    properties: ['3 cạnh bằng nhau', '3 góc bằng nhau (60°)', 'Có 3 trục đối xứng', 'Trọng tâm trùng tâm đường tròn ngoại tiếp'],
    formulas: [
      { label: 'Chu vi', formula: 'P = 3a' },
      { label: 'Diện tích', formula: 'S = (√3 / 4) × a²' },
      { label: 'Chiều cao', formula: 'h = (√3 / 2) × a' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 10, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 5 },
    area: (p) => (SQRT3 / 4) * p.a * p.a,
    perimeter: (p) => 3 * p.a,
    kind: 'polygon',
    points: (p) => regularPolygonPoints(3, sideToCircumradius(3, p.a)),
    color: '#f97316',
  },
  {
    id: 'triangle-right',
    name: 'Tam giác vuông',
    category: 'Đa giác',
    description: 'Tam giác có một góc bằng 90°. Cạnh đối diện góc vuông gọi là cạnh huyền.',
    properties: [
      'Một góc bằng 90°',
      'Cạnh huyền là cạnh dài nhất, đối diện góc vuông',
      'Áp dụng định lý Pythagore: c² = a² + b²',
      'Không có trục đối xứng (trừ khi là tam giác vuông cân, tức a = b)',
    ],
    formulas: [
      { label: 'Cạnh huyền', formula: 'c = √(a² + b²)' },
      { label: 'Chu vi', formula: 'P = a + b + c' },
      { label: 'Diện tích', formula: 'S = (1/2) × a × b' },
    ],
    params: [
      { key: 'a', label: 'Cạnh góc vuông a', min: 1, max: 10, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Cạnh góc vuông b', min: 1, max: 10, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 4, b: 3 },
    area: (p) => 0.5 * p.a * p.b,
    perimeter: (p) => p.a + p.b + Math.hypot(p.a, p.b),
    kind: 'polygon',
    points: (p) => [
      [0, 0],
      [p.a, 0],
      [0, p.b],
    ],
    color: '#f59e0b',
  },
  {
    id: 'triangle-isosceles',
    name: 'Tam giác cân',
    category: 'Đa giác',
    description: 'Tam giác có hai cạnh bằng nhau, gọi là hai cạnh bên. Cạnh còn lại gọi là cạnh đáy.',
    properties: [
      '2 cạnh bên bằng nhau',
      '2 góc ở đáy bằng nhau',
      'Có 1 trục đối xứng: đường cao kẻ từ đỉnh xuống đáy',
      'Đường cao kẻ từ đỉnh chia đáy thành 2 phần bằng nhau',
    ],
    formulas: [
      { label: 'Cạnh bên', formula: 'b = √(h² + (a/2)²)' },
      { label: 'Chu vi', formula: 'P = a + 2 × b' },
      { label: 'Diện tích', formula: 'S = (a × h) / 2' },
    ],
    params: [
      { key: 'a', label: 'Cạnh đáy a', min: 1, max: 10, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 9, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 6, h: 5 },
    area: (p) => (p.a * p.h) / 2,
    perimeter: (p) => p.a + 2 * Math.hypot(p.a / 2, p.h),
    kind: 'polygon',
    points: (p) => [
      [0, -p.h / 2],
      [p.a / 2, p.h / 2],
      [-p.a / 2, p.h / 2],
    ],
    color: '#a855f7',
  },
  {
    id: 'triangle-scalene',
    name: 'Tam giác thường',
    category: 'Đa giác',
    description: 'Tam giác có ba cạnh dài khác nhau và ba góc khác nhau.',
    properties: [
      '3 cạnh khác nhau, 3 góc khác nhau',
      'Tổng ba góc luôn bằng 180°',
      'Không có trục đối xứng',
      'Kéo thanh "Vị trí đỉnh" để thấy tam giác nhọn, tam giác vuông hay tam giác tù',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = a + b + c' },
      { label: 'Diện tích', formula: 'S = (a × h) / 2' },
    ],
    params: [
      { key: 'a', label: 'Cạnh đáy a', min: 2, max: 10, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 8, step: 0.5, unit: 'cm' },
      { key: 'x', label: 'Vị trí đỉnh (tính từ đầu trái của đáy)', min: -2, max: 12, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 7, h: 4.5, x: 2 },
    area: (p) => (p.a * p.h) / 2,
    perimeter: (p) => p.a + Math.hypot(p.x, p.h) + Math.hypot(p.a - p.x, p.h),
    kind: 'polygon',
    points: (p) => [
      [p.x - p.a / 2, -p.h / 2],
      [p.a / 2, p.h / 2],
      [-p.a / 2, p.h / 2],
    ],
    color: '#84cc16',
  },
  {
    id: 'circle',
    name: 'Hình tròn',
    category: 'Hình tròn / Elip',
    description:
      'Đường tròn tâm O bán kính r là tập hợp các điểm cách O một khoảng bằng r. Hình tròn gồm đường tròn đó và tất cả các điểm nằm bên trong nó.',
    properties: [
      'Mọi điểm trên đường tròn cách đều tâm',
      'Có vô số trục đối xứng đi qua tâm',
      'Đường kính d = 2r',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'C = 2πr' },
      { label: 'Diện tích', formula: 'S = πr²' },
    ],
    params: [{ key: 'r', label: 'Bán kính r', min: 1, max: 8, step: 0.5, unit: 'cm' }],
    defaultParams: { r: 4 },
    area: (p) => Math.PI * p.r * p.r,
    perimeter: (p) => 2 * Math.PI * p.r,
    kind: 'circle',
    points: () => null,
    color: '#ef4444',
  },
  {
    id: 'ellipse',
    name: 'Hình elip',
    category: 'Hình tròn / Elip',
    description:
      'Đường cong khép kín với hai bán trục a (nằm ngang) và b (thẳng đứng); bán trục dài hơn gọi là bán trục lớn, bán trục ngắn hơn gọi là bán trục nhỏ. Hình tròn là elip đặc biệt khi a = b.',
    properties: [
      'Có 2 trục đối xứng (trục lớn và trục nhỏ)',
      'Tổng khoảng cách từ một điểm bất kỳ trên elip đến 2 tiêu điểm là không đổi',
    ],
    formulas: [
      { label: 'Diện tích', formula: 'S = π × a × b' },
      { label: 'Chu vi (gần đúng)', formula: 'C ≈ π[3(a+b) − √((3a+b)(a+3b))]' },
    ],
    params: [
      { key: 'a', label: 'Bán trục ngang a', min: 1, max: 8, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Bán trục dọc b', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 5, b: 3 },
    area: (p) => Math.PI * p.a * p.b,
    perimeter: (p) => {
      const { a, b } = p
      return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
    },
    kind: 'ellipse',
    points: () => null,
    color: '#d946ef',
  },
  {
    id: 'parallelogram',
    name: 'Hình bình hành',
    category: 'Tứ giác',
    description: 'Tứ giác có các cặp cạnh đối song song.',
    properties: [
      'Các cạnh đối song song và bằng nhau',
      'Các góc đối bằng nhau',
      '2 đường chéo cắt nhau tại trung điểm mỗi đường',
      'Không có trục đối xứng (trừ khi là hình chữ nhật hoặc hình thoi)',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = 2(a + b)' },
      { label: 'Chiều cao', formula: 'h = a × sin α' },
      { label: 'Diện tích', formula: 'S = b × h' },
    ],
    params: [
      { key: 'b', label: 'Cạnh đáy b', min: 2, max: 10, step: 0.5, unit: 'cm' },
      { key: 'a', label: 'Cạnh bên a', min: 1, max: 8, step: 0.5, unit: 'cm' },
      { key: 'alpha', label: 'Góc nhọn α (giữa đáy và cạnh bên)', min: 30, max: 90, step: 5, unit: '°' },
    ],
    defaultParams: { b: 6, a: 4, alpha: 60 },
    // h is derived from a and α, so it can never exceed the side a and the drawing always matches the numbers.
    area: (p) => p.b * p.a * Math.sin((p.alpha * Math.PI) / 180),
    perimeter: (p) => 2 * (p.a + p.b),
    kind: 'polygon',
    points: (p) => {
      const rad = (p.alpha * Math.PI) / 180
      const h = p.a * Math.sin(rad)
      const shift = p.a * Math.cos(rad)
      const hb = p.b / 2
      return [
        [-hb - shift / 2, -h / 2],
        [hb - shift / 2, -h / 2],
        [hb + shift / 2, h / 2],
        [-hb + shift / 2, h / 2],
      ]
    },
    color: '#14b8a6',
  },
  {
    id: 'rhombus',
    name: 'Hình thoi',
    category: 'Tứ giác',
    description: 'Tứ giác có 4 cạnh bằng nhau. Hai đường chéo vuông góc với nhau.',
    properties: [
      '4 cạnh bằng nhau',
      '2 đường chéo vuông góc và cắt nhau tại trung điểm',
      'Các góc đối bằng nhau',
      'Có 2 trục đối xứng (chính là 2 đường chéo)',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = 4a' },
      { label: 'Diện tích', formula: 'S = (d₁ × d₂) / 2' },
    ],
    params: [
      { key: 'd1', label: 'Đường chéo d₁', min: 2, max: 12, step: 0.5, unit: 'cm' },
      { key: 'd2', label: 'Đường chéo d₂', min: 2, max: 10, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { d1: 8, d2: 5 },
    area: (p) => (p.d1 * p.d2) / 2,
    perimeter: (p) => 4 * Math.hypot(p.d1 / 2, p.d2 / 2),
    kind: 'polygon',
    points: (p) => [
      [0, -p.d2 / 2],
      [p.d1 / 2, 0],
      [0, p.d2 / 2],
      [-p.d1 / 2, 0],
    ],
    color: '#8b5cf6',
  },
  {
    id: 'kite',
    name: 'Hình cánh diều',
    category: 'Tứ giác',
    description:
      'Tứ giác có hai cặp cạnh kề bằng nhau (hai cạnh trên bằng nhau, hai cạnh dưới bằng nhau), trông giống chiếc diều. Hình thoi là hình cánh diều đặc biệt có cả 4 cạnh bằng nhau.',
    properties: [
      'Có 2 cặp cạnh kề bằng nhau',
      'Hai đường chéo vuông góc với nhau',
      'Đường chéo nối hai đỉnh chung của các cặp cạnh bằng nhau chia đôi đường chéo còn lại',
      'Có 1 trục đối xứng: chính là đường chéo đó',
      'Có một cặp góc đối bằng nhau (hai góc ở hai bên trục đối xứng)',
    ],
    formulas: [
      { label: 'Diện tích', formula: 'S = (d₁ × d₂) / 2' },
      { label: 'Chu vi', formula: 'P = 2 × (a + b)' },
    ],
    params: [
      { key: 'd1', label: 'Đường chéo ngang d₁', min: 2, max: 10, step: 0.5, unit: 'cm' },
      { key: 'd2', label: 'Đường chéo dọc d₂', min: 6, max: 12, step: 0.5, unit: 'cm' },
      { key: 't', label: 'Từ đỉnh trên đến giao điểm hai đường chéo', min: 1, max: 5, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { d1: 6, d2: 8, t: 2.5 },
    area: (p) => (p.d1 * p.d2) / 2,
    // a = the two short top sides, b = the two long bottom sides (d₂ ≥ 6 and t ≤ 5 keep the shape a proper kite).
    perimeter: (p) => 2 * (Math.hypot(p.d1 / 2, p.t) + Math.hypot(p.d1 / 2, p.d2 - p.t)),
    kind: 'polygon',
    points: (p) => [
      [0, -p.t],
      [p.d1 / 2, 0],
      [0, p.d2 - p.t],
      [-p.d1 / 2, 0],
    ],
    color: '#ec4899',
  },
  {
    id: 'trapezoid',
    name: 'Hình thang cân',
    category: 'Tứ giác',
    description: 'Hình thang có hai cạnh bên bằng nhau. Hai góc kề một đáy bằng nhau.',
    properties: [
      'Có hai cạnh đối song song (2 đáy); hai cạnh còn lại gọi là cạnh bên',
      'Hình bình hành, hình chữ nhật là những trường hợp đặc biệt của hình thang',
      'Hình thang cân có 2 cạnh bên bằng nhau và 2 góc kề một đáy bằng nhau',
      'Hình thang cân có 1 trục đối xứng đi qua trung điểm hai đáy; hình thang thường thì không có trục đối xứng',
    ],
    formulas: [
      { label: 'Diện tích', formula: 'S = (a + b) / 2 × h' },
      { label: 'Cạnh bên (hình thang cân)', formula: 'c = √(((a − b) / 2)² + h²)' },
      { label: 'Chu vi (hình thang cân)', formula: 'P = a + b + 2c' },
    ],
    params: [
      { key: 'a', label: 'Đáy a', min: 1, max: 12, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Đáy b', min: 1, max: 12, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 8, b: 4, h: 3.5 },
    area: (p) => ((p.a + p.b) / 2) * p.h,
    perimeter: (p) => {
      const legLen = Math.hypot(Math.abs(p.a - p.b) / 2, p.h)
      return p.a + p.b + 2 * legLen
    },
    kind: 'polygon',
    points: (p) => [
      [-p.a / 2, p.h / 2],
      [p.a / 2, p.h / 2],
      [p.b / 2, -p.h / 2],
      [-p.b / 2, -p.h / 2],
    ],
    color: '#22c55e',
  },
  {
    id: 'trapezoid-general',
    name: 'Hình thang',
    category: 'Tứ giác',
    description: 'Tứ giác có hai cạnh đối song song, gọi là hai đáy. Hai cạnh còn lại gọi là cạnh bên.',
    properties: [
      'Có hai cạnh đối song song (2 đáy)',
      'Hai cạnh bên có thể dài khác nhau',
      'Kéo "Vị trí đáy nhỏ" về 0 sẽ được hình thang vuông (một cạnh bên vuông góc với hai đáy)',
      'Hình thang thường không có trục đối xứng',
    ],
    formulas: [
      { label: 'Diện tích', formula: 'S = (a + b) / 2 × h' },
      { label: 'Chu vi', formula: 'P = a + b + c + d' },
    ],
    params: [
      { key: 'a', label: 'Đáy a', min: 2, max: 12, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Đáy b', min: 1, max: 10, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 's', label: 'Vị trí đáy b (tính từ đầu trái của đáy a)', min: 0, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 8, b: 4, h: 3.5, s: 1 },
    area: (p) => ((p.a + p.b) / 2) * p.h,
    perimeter: (p) => p.a + p.b + Math.hypot(p.s, p.h) + Math.hypot(p.a - p.s - p.b, p.h),
    kind: 'polygon',
    points: (p) => [
      [-p.a / 2, p.h / 2],
      [p.a / 2, p.h / 2],
      [-p.a / 2 + p.s + p.b, -p.h / 2],
      [-p.a / 2 + p.s, -p.h / 2],
    ],
    color: '#10b981',
  },
  {
    id: 'quadrilateral',
    name: 'Tứ giác',
    category: 'Tứ giác',
    description: 'Hình có 4 cạnh và 4 đỉnh, không có cặp cạnh nào song song hay bằng nhau (tứ giác thường).',
    properties: [
      '4 cạnh, 4 đỉnh, 4 góc',
      'Tổng bốn góc luôn bằng 360°',
      'Có 2 đường chéo; mỗi đường chéo chia tứ giác thành 2 tam giác',
      'Hình vuông, hình chữ nhật, hình thoi, hình bình hành, hình thang… đều là những tứ giác đặc biệt',
    ],
    formulas: [
      { label: 'Chu vi', formula: 'P = a + b + c + d' },
      { label: 'Diện tích', formula: 'Chia thành 2 tam giác: S = S₁ + S₂' },
    ],
    params: [
      { key: 'l', label: 'Giao điểm → đỉnh trái', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 'r', label: 'Giao điểm → đỉnh phải', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 'u', label: 'Giao điểm → đỉnh trên', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 'd', label: 'Giao điểm → đỉnh dưới', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { l: 3, r: 4.5, u: 2.5, d: 3.5 },
    // The two diagonals cross at 70°: one runs left–right, the other leans, so the quadrilateral is always convex.
    area: (p) => ((p.l + p.r) * (p.u + p.d) * Math.sin((70 * Math.PI) / 180)) / 2,
    perimeter: (p) => {
      const pts = quadPoints(p)
      return pts.reduce((sum, a, i) => {
        const b = pts[(i + 1) % 4]
        return sum + Math.hypot(b[0] - a[0], b[1] - a[1])
      }, 0)
    },
    kind: 'polygon',
    points: (p) => quadPoints(p),
    color: '#f97316',
  },
  {
    id: 'pentagon',
    name: 'Ngũ giác đều',
    category: 'Đa giác',
    description: 'Đa giác đều có 5 cạnh bằng nhau và 5 góc bằng nhau.',
    properties: ['5 cạnh và 5 góc bằng nhau', 'Mỗi góc trong bằng 108°', 'Có 5 trục đối xứng'],
    formulas: [
      { label: 'Chu vi', formula: 'P = 5a' },
      { label: 'Diện tích', formula: 'S = (1/4)√(5(5+2√5)) × a²' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 8, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 4 },
    area: (p) => 0.25 * Math.sqrt(5 * (5 + 2 * Math.sqrt(5))) * p.a * p.a,
    perimeter: (p) => 5 * p.a,
    kind: 'polygon',
    points: (p) => regularPolygonPoints(5, sideToCircumradius(5, p.a)),
    color: '#e11d48',
  },
  {
    id: 'hexagon',
    name: 'Lục giác đều',
    category: 'Đa giác',
    description: 'Đa giác đều có 6 cạnh bằng nhau và 6 góc bằng nhau. Xuất hiện tự nhiên trong tổ ong.',
    properties: ['6 cạnh và 6 góc bằng nhau', 'Mỗi góc trong bằng 120°', 'Có 6 trục đối xứng', 'Có thể chia thành 6 tam giác đều'],
    formulas: [
      { label: 'Chu vi', formula: 'P = 6a' },
      { label: 'Diện tích', formula: 'S = (3√3 / 2) × a²' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 8, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 4 },
    area: (p) => ((3 * SQRT3) / 2) * p.a * p.a,
    perimeter: (p) => 6 * p.a,
    kind: 'polygon',
    points: (p) => regularPolygonPoints(6, sideToCircumradius(6, p.a)),
    color: '#0d9488',
  },
  {
    id: 'octagon',
    name: 'Bát giác đều',
    category: 'Đa giác',
    description: 'Đa giác đều có 8 cạnh bằng nhau và 8 góc bằng nhau, thường thấy ở biển báo dừng (STOP).',
    properties: ['8 cạnh và 8 góc bằng nhau', 'Mỗi góc trong bằng 135°', 'Có 8 trục đối xứng'],
    formulas: [
      { label: 'Chu vi', formula: 'P = 8a' },
      { label: 'Diện tích', formula: 'S = 2(1+√2) × a²' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 6, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 3 },
    area: (p) => 2 * (1 + Math.sqrt(2)) * p.a * p.a,
    perimeter: (p) => 8 * p.a,
    kind: 'polygon',
    points: (p) => regularPolygonPoints(8, sideToCircumradius(8, p.a)),
    color: '#7c3aed',
  },
]

export const shapes2DMap = Object.fromEntries(shapes2D.map((s) => [s.id, s]))
