import type { NetPart } from '../../data/nets2d'
import { pointsToPath } from '../../utils/polygon'

function boundsOf(parts: NetPart[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (const part of parts) {
    if (part.kind === 'circle') {
      minX = Math.min(minX, part.cx - part.r)
      maxX = Math.max(maxX, part.cx + part.r)
      minY = Math.min(minY, part.cy - part.r)
      maxY = Math.max(maxY, part.cy + part.r)
    } else {
      for (const [x, y] of part.points) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  return { minX, maxX, minY, maxY }
}

export default function Net2DDiagram({ parts, color, size = 320 }: { parts: NetPart[]; color: string; size?: number }) {
  if (parts.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Không có sơ đồ khai triển</div>
  }
  const { minX, maxX, minY, maxY } = boundsOf(parts)
  const w = Math.max(maxX - minX, 1)
  const h = Math.max(maxY - minY, 1)
  const padding = size * 0.08
  const available = size - padding * 2
  const scale = Math.min(available / w, available / h)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2} ${size / 2}) scale(${scale}) translate(${-cx} ${-cy})`}>
        {parts.map((part, i) =>
          part.kind === 'circle' ? (
            <circle
              key={i}
              cx={part.cx}
              cy={part.cy}
              r={part.r}
              fill={color}
              fillOpacity={0.55}
              stroke="#1e293b"
              strokeWidth={1.5 / scale}
            />
          ) : (
            <path
              key={i}
              d={pointsToPath(part.points)}
              fill={color}
              fillOpacity={part.fillOpacity ?? 0.75}
              stroke="#1e293b"
              strokeWidth={1.5 / scale}
              strokeLinejoin="round"
            />
          ),
        )}
      </g>
    </svg>
  )
}
