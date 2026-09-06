import type { Shape3DDef } from '../types'

const SQRT3 = Math.sqrt(3)
const SQRT2 = Math.sqrt(2)

export const shapes3D: Shape3DDef[] = [
  {
    id: 'cube',
    name: 'Hình lập phương',
    category: 'Khối đa diện',
    description: 'Khối đa diện có 6 mặt đều là hình vuông bằng nhau, 12 cạnh bằng nhau và 8 đỉnh.',
    properties: ['6 mặt là hình vuông bằng nhau', '12 cạnh bằng nhau', '8 đỉnh, mỗi đỉnh có 3 cạnh gặp nhau', '4 đường chéo chính bằng nhau'],
    formulas: [
      { label: 'Thể tích', formula: 'V = a³' },
      { label: 'Diện tích toàn phần', formula: 'S = 6a²' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 6, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 3 },
    volume: (p) => p.a ** 3,
    surfaceArea: (p) => 6 * p.a * p.a,
    color: '#6366f1',
  },
  {
    id: 'cuboid',
    name: 'Hình hộp chữ nhật',
    category: 'Khối đa diện',
    description: 'Khối đa diện có 6 mặt đều là hình chữ nhật.',
    properties: ['6 mặt là hình chữ nhật', '12 cạnh, các cạnh song song bằng nhau', '8 đỉnh'],
    formulas: [
      { label: 'Thể tích', formula: 'V = a × b × c' },
      { label: 'Diện tích toàn phần', formula: 'S = 2(ab + bc + ca)' },
    ],
    params: [
      { key: 'a', label: 'Chiều dài a', min: 1, max: 8, step: 0.5, unit: 'cm' },
      { key: 'b', label: 'Chiều rộng b', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 'c', label: 'Chiều cao c', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 5, b: 3, c: 2.5 },
    volume: (p) => p.a * p.b * p.c,
    surfaceArea: (p) => 2 * (p.a * p.b + p.b * p.c + p.c * p.a),
    color: '#0ea5e9',
  },
  {
    id: 'sphere',
    name: 'Hình cầu',
    category: 'Khối tròn xoay',
    description: 'Tập hợp các điểm trong không gian cách đều một điểm cố định (tâm) một khoảng bằng bán kính r.',
    properties: ['Mọi điểm trên mặt cầu cách đều tâm', 'Có vô số mặt phẳng đối xứng đi qua tâm', 'Mặt cắt qua tâm luôn là hình tròn lớn nhất'],
    formulas: [
      { label: 'Thể tích', formula: 'V = (4/3)πr³' },
      { label: 'Diện tích mặt cầu', formula: 'S = 4πr²' },
    ],
    params: [{ key: 'r', label: 'Bán kính r', min: 1, max: 5, step: 0.25, unit: 'cm' }],
    defaultParams: { r: 2.5 },
    volume: (p) => (4 / 3) * Math.PI * p.r ** 3,
    surfaceArea: (p) => 4 * Math.PI * p.r * p.r,
    color: '#ef4444',
  },
  {
    id: 'cylinder',
    name: 'Hình trụ',
    category: 'Khối tròn xoay',
    description: 'Khối tròn xoay được tạo thành khi quay một hình chữ nhật quanh một cạnh của nó.',
    properties: ['2 đáy là 2 hình tròn bằng nhau, song song', 'Mặt xung quanh khi trải phẳng là hình chữ nhật', 'Trục nối tâm 2 đáy vuông góc với đáy'],
    formulas: [
      { label: 'Thể tích', formula: 'V = πr²h' },
      { label: 'Diện tích xung quanh', formula: 'Sxq = 2πrh' },
      { label: 'Diện tích toàn phần', formula: 'S = 2πr(r + h)' },
    ],
    params: [
      { key: 'r', label: 'Bán kính đáy r', min: 1, max: 4, step: 0.25, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { r: 2, h: 4 },
    volume: (p) => Math.PI * p.r * p.r * p.h,
    surfaceArea: (p) => 2 * Math.PI * p.r * (p.r + p.h),
    color: '#f59e0b',
  },
  {
    id: 'cone',
    name: 'Hình nón',
    category: 'Khối tròn xoay',
    description: 'Khối tròn xoay được tạo thành khi quay một tam giác vuông quanh một cạnh góc vuông của nó.',
    properties: ['Đáy là hình tròn', 'Có 1 đỉnh duy nhất', 'Đường sinh l = √(r² + h²)'],
    formulas: [
      { label: 'Thể tích', formula: 'V = (1/3)πr²h' },
      { label: 'Đường sinh', formula: 'l = √(r² + h²)' },
      { label: 'Diện tích toàn phần', formula: 'S = πr(r + l)' },
    ],
    params: [
      { key: 'r', label: 'Bán kính đáy r', min: 1, max: 4, step: 0.25, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { r: 2, h: 4 },
    volume: (p) => (1 / 3) * Math.PI * p.r * p.r * p.h,
    surfaceArea: (p) => {
      const l = Math.hypot(p.r, p.h)
      return Math.PI * p.r * (p.r + l)
    },
    color: '#fb923c',
  },
  {
    id: 'square-pyramid',
    name: 'Hình chóp tứ giác đều',
    category: 'Khối đa diện',
    description: 'Khối đa diện có đáy là hình vuông và 4 mặt bên là các tam giác cân bằng nhau chụm tại một đỉnh.',
    properties: ['Đáy là hình vuông', '4 mặt bên là tam giác cân bằng nhau', 'Chân đường cao trùng tâm đáy'],
    formulas: [
      { label: 'Thể tích', formula: 'V = (1/3) a²h' },
      { label: 'Trung đoạn (chiều cao mặt bên)', formula: 'l = √(h² + (a/2)²)' },
      { label: 'Diện tích toàn phần', formula: 'S = a² + 2al' },
    ],
    params: [
      { key: 'a', label: 'Cạnh đáy a', min: 1, max: 6, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều cao h', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 4, h: 4 },
    volume: (p) => (1 / 3) * p.a * p.a * p.h,
    surfaceArea: (p) => {
      const l = Math.hypot(p.h, p.a / 2)
      return p.a * p.a + 2 * p.a * l
    },
    color: '#22c55e',
  },
  {
    id: 'triangular-prism',
    name: 'Lăng trụ tam giác đều',
    category: 'Khối đa diện',
    description: 'Khối đa diện có 2 đáy là tam giác đều bằng nhau, song song, và các mặt bên là hình chữ nhật.',
    properties: ['2 đáy là tam giác đều bằng nhau và song song', '3 mặt bên là hình chữ nhật', 'Các cạnh bên song song và bằng nhau'],
    formulas: [
      { label: 'Diện tích đáy', formula: 'Sđáy = (√3/4)a²' },
      { label: 'Thể tích', formula: 'V = Sđáy × h' },
      { label: 'Diện tích toàn phần', formula: 'S = 2Sđáy + 3ah' },
    ],
    params: [
      { key: 'a', label: 'Cạnh đáy a', min: 1, max: 5, step: 0.5, unit: 'cm' },
      { key: 'h', label: 'Chiều dài lăng trụ h', min: 1, max: 6, step: 0.5, unit: 'cm' },
    ],
    defaultParams: { a: 3, h: 4 },
    volume: (p) => (SQRT3 / 4) * p.a * p.a * p.h,
    surfaceArea: (p) => 2 * (SQRT3 / 4) * p.a * p.a + 3 * p.a * p.h,
    color: '#14b8a6',
  },
  {
    id: 'octahedron',
    name: 'Bát diện đều',
    category: 'Khối đa diện',
    description: 'Khối đa diện đều gồm 8 mặt là tam giác đều bằng nhau, giống như 2 hình chóp tứ giác đều ghép đáy vào nhau.',
    properties: ['8 mặt tam giác đều bằng nhau', '12 cạnh bằng nhau', '6 đỉnh, mỗi đỉnh có 4 cạnh gặp nhau'],
    formulas: [
      { label: 'Thể tích', formula: 'V = (√2/3) a³' },
      { label: 'Diện tích toàn phần', formula: 'S = 2√3 a²' },
    ],
    params: [{ key: 'a', label: 'Cạnh a', min: 1, max: 5, step: 0.5, unit: 'cm' }],
    defaultParams: { a: 3 },
    volume: (p) => (SQRT2 / 3) * p.a ** 3,
    surfaceArea: (p) => 2 * SQRT3 * p.a * p.a,
    color: '#e11d48',
  },
]

export const shapes3DMap = Object.fromEntries(shapes3D.map((s) => [s.id, s]))
