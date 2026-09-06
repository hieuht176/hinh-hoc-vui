import { regularPolygonPoints, starPoints } from '../utils/polygon'

export interface PointShapeDef {
  id: string
  name: string
  kind: 'polygon' | 'circle'
  localPoints?: [number, number][]
  radius?: number
  color: string
  /** Smallest number of equal turns that map the shape onto itself (its rotational-symmetry order); Infinity for a circle. */
  rotationalOrder: number
}

export const POINT_SHAPES: PointShapeDef[] = [
  {
    id: 'triangle',
    name: 'Tam giác',
    kind: 'polygon',
    localPoints: [[-1.6, -1], [1.6, -1], [0, 1.7]],
    color: '#6366f1',
    rotationalOrder: 3,
  },
  {
    id: 'square',
    name: 'Hình vuông',
    kind: 'polygon',
    localPoints: [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ],
    color: '#0ea5e9',
    rotationalOrder: 4,
  },
  {
    id: 'rectangle',
    name: 'Hình chữ nhật',
    kind: 'polygon',
    localPoints: [
      [-1.6, -1],
      [1.6, -1],
      [1.6, 1],
      [-1.6, 1],
    ],
    color: '#f97316',
    rotationalOrder: 2,
  },
  { id: 'pentagon', name: 'Ngũ giác đều', kind: 'polygon', localPoints: regularPolygonPoints(5, 1.4), color: '#e11d48', rotationalOrder: 5 },
  { id: 'hexagon', name: 'Lục giác đều', kind: 'polygon', localPoints: regularPolygonPoints(6, 1.4), color: '#0d9488', rotationalOrder: 6 },
  { id: 'circle', name: 'Hình tròn', kind: 'circle', radius: 1.3, color: '#ef4444', rotationalOrder: Infinity },
  {
    id: 'star',
    name: 'Ngôi sao 5 cánh',
    kind: 'polygon',
    localPoints: starPoints(5, 1.6, 0.62),
    color: '#f59e0b',
    rotationalOrder: 5,
  },
  {
    id: 'heart',
    name: 'Trái tim',
    kind: 'polygon',
    localPoints: [
      [0, 0.5],
      [0.35, 1.1],
      [0.85, 1.35],
      [1.35, 0.95],
      [1.4, 0.35],
      [1.0, -0.35],
      [0.5, -0.95],
      [0, -1.55],
      [-0.5, -0.95],
      [-1.0, -0.35],
      [-1.4, 0.35],
      [-1.35, 0.95],
      [-0.85, 1.35],
      [-0.35, 1.1],
    ],
    color: '#f43f5e',
    // Has a mirror axis (vertical) but no rotational symmetry other than a full turn.
    rotationalOrder: 1,
  },
  {
    id: 'arrow',
    name: 'Mũi tên',
    kind: 'polygon',
    localPoints: [
      [-1.4, 0.35],
      [0.3, 0.35],
      [0.3, 0.9],
      [1.6, 0],
      [0.3, -0.9],
      [0.3, -0.35],
      [-1.4, -0.35],
    ],
    color: '#8b5cf6',
    rotationalOrder: 1,
  },
  {
    id: 'sign',
    name: 'Biển báo',
    kind: 'polygon',
    localPoints: regularPolygonPoints(8, 1.4),
    color: '#dc2626',
    rotationalOrder: 8,
  },
  {
    id: 'patterned-square',
    name: 'Hình vuông họa tiết',
    kind: 'polygon',
    // A square with one small bump on just the top edge — looks like a square (order-4 outline),
    // but the bump only lines up with itself after a full 360° turn.
    localPoints: [
      [-1.3, -1.3],
      [1.3, -1.3],
      [1.3, 1.3],
      [0.3, 1.3],
      [0, 1.75],
      [-0.3, 1.3],
      [-1.3, 1.3],
    ],
    color: '#65a30d',
    rotationalOrder: 1,
  },
]

export const pointShapesMap = Object.fromEntries(POINT_SHAPES.map((s) => [s.id, s]))

export const VERTEX_LABELS = 'ABCDEFGH'
