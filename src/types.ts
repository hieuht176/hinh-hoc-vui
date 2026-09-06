export type ParamKey = string

export interface ParamDef {
  key: ParamKey
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

export interface Formula {
  label: string
  formula: string
}

export interface Shape2DDef {
  id: string
  name: string
  category: 'Đa giác' | 'Hình tròn / Elip' | 'Tứ giác'
  description: string
  properties: string[]
  formulas: Formula[]
  params: ParamDef[]
  defaultParams: Record<string, number>
  area: (p: Record<string, number>) => number
  perimeter: (p: Record<string, number>) => number
  /** returns polygon-ish points in local unit space (before fitting to viewBox), or null if drawn specially (circle/ellipse) */
  points: (p: Record<string, number>) => [number, number][] | null
  kind: 'polygon' | 'circle' | 'ellipse'
  color: string
}

export interface Shape3DDef {
  id: string
  name: string
  category: 'Khối đa diện' | 'Khối tròn xoay'
  description: string
  properties: string[]
  formulas: Formula[]
  params: ParamDef[]
  defaultParams: Record<string, number>
  volume: (p: Record<string, number>) => number
  surfaceArea: (p: Record<string, number>) => number
  color: string
}

export interface PlacedShape2D {
  id: string
  shapeId: string
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  params: Record<string, number>
}

export interface PlacedShape3D {
  id: string
  shapeId: string
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  scale: [number, number, number]
  color: string
  params: Record<string, number>
}
