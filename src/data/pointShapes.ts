import { regularPolygonPoints } from '../utils/polygon'

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
]

export const pointShapesMap = Object.fromEntries(POINT_SHAPES.map((s) => [s.id, s]))

export const VERTEX_LABELS = 'ABCDEFGH'
