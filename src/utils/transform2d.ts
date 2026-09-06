export type TransformType = 'translate' | 'rotate' | 'point-symmetry' | 'axis-symmetry' | 'rotational-symmetry'

export interface TranslateParams {
  dx: number
  dy: number
}
export interface RotateParams {
  cx: number
  cy: number
  angleDeg: number
}
export interface PointSymParams {
  cx: number
  cy: number
}
export interface AxisSymParams {
  axisAngleDeg: number
}

export interface TransformParams {
  translate: TranslateParams
  rotate: RotateParams
  'point-symmetry': PointSymParams
  'axis-symmetry': AxisSymParams
}

export function applyTransform(type: TransformType, [x, y]: [number, number], params: TransformParams): [number, number] {
  switch (type) {
    case 'translate': {
      const { dx, dy } = params.translate
      return [x + dx, y + dy]
    }
    case 'rotate': {
      const { cx, cy, angleDeg } = params.rotate
      const rad = (angleDeg * Math.PI) / 180
      const dx = x - cx
      const dy = y - cy
      return [cx + dx * Math.cos(rad) - dy * Math.sin(rad), cy + dx * Math.sin(rad) + dy * Math.cos(rad)]
    }
    case 'point-symmetry': {
      const { cx, cy } = params['point-symmetry']
      return [2 * cx - x, 2 * cy - y]
    }
    case 'axis-symmetry': {
      const { axisAngleDeg } = params['axis-symmetry']
      const phi = (axisAngleDeg * Math.PI) / 180
      const c2 = Math.cos(2 * phi)
      const s2 = Math.sin(2 * phi)
      return [x * c2 + y * s2, x * s2 - y * c2]
    }
    case 'rotational-symmetry':
      // Same math as a rotation — it's used to check whether the shape maps onto itself
      // when turned about its own centre, rather than to place a copy somewhere else.
      return applyTransform('rotate', [x, y], params)
  }
}

/**
 * Same transforms as applyTransform, but eased by t (0 = original point, 1 = fully transformed) so the
 * shape can be animated sliding/turning/flipping into place instead of just popping to the final result.
 */
export function applyTransformEased(type: TransformType, [x, y]: [number, number], params: TransformParams, t: number): [number, number] {
  switch (type) {
    case 'translate': {
      const { dx, dy } = params.translate
      return [x + dx * t, y + dy * t]
    }
    case 'rotate': {
      const { cx, cy, angleDeg } = params.rotate
      return applyTransform('rotate', [x, y], { ...params, rotate: { cx, cy, angleDeg: angleDeg * t } })
    }
    case 'point-symmetry': {
      const { cx, cy } = params['point-symmetry']
      return applyTransform('rotate', [x, y], { ...params, rotate: { cx, cy, angleDeg: 180 * t } })
    }
    case 'axis-symmetry': {
      // Flip the point's distance from the mirror line from +d to -d — it looks like the
      // shape folding flat onto the mirror line, then unfolding mirrored on the other side.
      const { axisAngleDeg } = params['axis-symmetry']
      const phi = (axisAngleDeg * Math.PI) / 180
      const c = Math.cos(phi)
      const s = Math.sin(phi)
      const along = x * c + y * s
      const perp = (-x * s + y * c) * (1 - 2 * t)
      return [along * c - perp * s, along * s + perp * c]
    }
    case 'rotational-symmetry': {
      const { cx, cy, angleDeg } = params.rotate
      return applyTransform('rotate', [x, y], { ...params, rotate: { cx, cy, angleDeg: angleDeg * t } })
    }
  }
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const defaultTransformParams: TransformParams = {
  translate: { dx: 3, dy: 2 },
  rotate: { cx: 0, cy: 0, angleDeg: 90 },
  'point-symmetry': { cx: 0, cy: 0 },
  'axis-symmetry': { axisAngleDeg: 0 },
}
