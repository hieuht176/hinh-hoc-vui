import type { ReactNode } from 'react'

export const PLANE_RANGE = 8
export const PLANE_SIZE = 480
export const PLANE_SCALE = PLANE_SIZE / (PLANE_RANGE * 2)

export function worldToPx([x, y]: [number, number]): [number, number] {
  return [PLANE_SIZE / 2 + x * PLANE_SCALE, PLANE_SIZE / 2 - y * PLANE_SCALE]
}

export function pxToWorld(px: number, py: number): [number, number] {
  return [(px - PLANE_SIZE / 2) / PLANE_SCALE, (PLANE_SIZE / 2 - py) / PLANE_SCALE]
}

export default function CoordinatePlane({
  svgRef,
  onPointerMove,
  onPointerUp,
  onPointerDown,
  showNumbers = true,
  everyNumber = false,
  showAxes = true,
  children,
}: {
  svgRef?: React.Ref<SVGSVGElement>
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void
  /** Hide the numeric axis labels (incl. negative numbers) for a simpler "graph paper" look. */
  showNumbers?: boolean
  /** Label every grid line instead of every second one (used when reading point coordinates). */
  everyNumber?: boolean
  /** false = plain grid paper: no Ox / Oy axes, no O, no numbers. */
  showAxes?: boolean
  children?: ReactNode
}) {
  const lines = []
  for (let i = -PLANE_RANGE; i <= PLANE_RANGE; i++) {
    // With the axes shown, the lines through 0 are drawn as the axes instead.
    if (i === 0 && showAxes) continue
    const [px] = worldToPx([i, 0])
    const [, py] = worldToPx([0, i])
    lines.push(
      <line key={`v${i}`} x1={px} y1={0} x2={px} y2={PLANE_SIZE} stroke="#e2e8f0" strokeWidth={1} />,
      <line key={`h${i}`} x1={0} y1={py} x2={PLANE_SIZE} y2={py} stroke="#e2e8f0" strokeWidth={1} />,
    )
    if (showAxes && i !== 0 && showNumbers && (everyNumber || i % 2 === 0)) {
      lines.push(
        <text key={`vl${i}`} x={px} y={PLANE_SIZE / 2 + 14} fontSize={10} textAnchor="middle" fill="#94a3b8">
          {i}
        </text>,
        <text key={`hl${i}`} x={PLANE_SIZE / 2 - 8} y={py + 3} fontSize={10} textAnchor="end" fill="#94a3b8">
          {i}
        </text>,
      )
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PLANE_SIZE} ${PLANE_SIZE}`}
      className="block h-auto w-full max-h-[72vh] touch-none select-none rounded-xl bg-white"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerDown={onPointerDown}
    >
      {lines}
      {showAxes && (
        <>
          {/* axes */}
          <line x1={0} y1={PLANE_SIZE / 2} x2={PLANE_SIZE} y2={PLANE_SIZE / 2} stroke="#475569" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1={PLANE_SIZE / 2} y1={PLANE_SIZE} x2={PLANE_SIZE / 2} y2={0} stroke="#475569" strokeWidth={1.5} markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#475569" />
            </marker>
          </defs>
          <text x={PLANE_SIZE / 2 + 6} y={14} fontSize={12} fill="#475569">
            y
          </text>
          <text x={PLANE_SIZE - 12} y={PLANE_SIZE / 2 - 8} fontSize={12} fill="#475569">
            x
          </text>
          <text x={PLANE_SIZE / 2 + 6} y={PLANE_SIZE / 2 + 14} fontSize={11} fill="#94a3b8">
            O
          </text>
        </>
      )}
      {children}
    </svg>
  )
}
