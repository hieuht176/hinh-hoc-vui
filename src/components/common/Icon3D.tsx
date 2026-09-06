/** Lightweight flat "isometric-ish" line-art icons for the 3D gallery cards (avoids spinning up many WebGL canvases at once). */
export default function Icon3D({ id, color, size = 96 }: { id: string; color: string; size?: number }) {
  const stroke = '#1e293b'
  const common = { fill: color, fillOpacity: 0.85, stroke, strokeWidth: 2, strokeLinejoin: 'round' as const }

  const shape = (() => {
    switch (id) {
      case 'cube':
        return (
          <g {...common}>
            <polygon points="48,10 82,26 82,64 48,80 14,64 14,26" />
            <polygon points="48,10 82,26 48,42 14,26" fillOpacity={0.5} />
            <polygon points="48,42 82,26 82,64 48,80" fillOpacity={0.7} />
          </g>
        )
      case 'cuboid':
        return (
          <g {...common}>
            <polygon points="20,26 66,14 86,30 40,44" fillOpacity={0.5} />
            <polygon points="20,26 40,44 40,78 20,60" fillOpacity={0.9} />
            <polygon points="40,44 86,30 86,64 40,78" fillOpacity={0.7} />
          </g>
        )
      case 'sphere':
        return (
          <g>
            <circle cx="48" cy="48" r="34" {...common} />
            <ellipse cx="48" cy="48" rx="34" ry="12" fill="none" stroke={stroke} strokeWidth={1.5} opacity={0.5} />
          </g>
        )
      case 'cylinder':
        return (
          <g {...common}>
            <path d="M16,30 v36 a32,10 0 0 0 64,0 v-36" />
            <ellipse cx="48" cy="30" rx="32" ry="10" />
          </g>
        )
      case 'cone':
        return (
          <g {...common}>
            <path d="M48,10 L78,66 a32,10 0 0 1 -60,0 Z" />
            <ellipse cx="48" cy="66" rx="30" ry="10" fillOpacity={0.6} />
          </g>
        )
      case 'square-pyramid':
        return (
          <g {...common}>
            <polygon points="48,10 84,64 48,80 12,64" />
            <polygon points="48,10 84,64 48,50" fillOpacity={0.6} />
            <polygon points="48,10 12,64 48,50" fillOpacity={0.8} />
          </g>
        )
      case 'triangular-prism':
        return (
          <g {...common}>
            <polygon points="30,20 60,14 78,30 48,36" fillOpacity={0.5} />
            <polygon points="30,20 48,36 48,72 30,58" fillOpacity={0.9} />
            <polygon points="48,36 78,30 78,66 48,72" fillOpacity={0.7} />
          </g>
        )
      case 'octahedron':
        return (
          <g {...common}>
            <polygon points="48,8 78,40 48,52 18,40" fillOpacity={0.7} />
            <polygon points="48,52 78,40 48,88" fillOpacity={0.5} />
            <polygon points="48,52 18,40 48,88" fillOpacity={0.9} />
          </g>
        )
      default:
        return <circle cx="48" cy="48" r="30" {...common} />
    }
  })()

  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      {shape}
    </svg>
  )
}
