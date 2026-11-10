import { useId } from 'react'
import compaUrl from '../../assets/compa.png'

type P = [number, number]

/*
 * compa.png is a photo of a CLOSED compass. It is cut into three pieces (head, needle leg, pencil leg) with
 * clip paths, and each leg is turned about the hinge so the needle tip sits on the centre and the pencil tip
 * on the drawing point — the compass really opens. All the numbers below are pixel positions in the photo.
 */
const IMG_W = 433
const IMG_H = 624
const HINGE: P = [223, 125]
const NEEDLE: P = [231, 601]
const PENCIL: P = [224.5, 594]
/** Line between the pencil leg (left in the photo) and the needle leg (right), from below the head to the bottom. */
const SPLIT: P[] = [
  [215, 186],
  [215, 480],
  [218, 500],
  [218, 560],
  [225, 566],
  [226.5, 585],
  [226.5, IMG_H],
]
const HEAD_BOTTOM = 192

const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1])

/** On-screen length of the needle leg (hinge → needle tip), in SVG units. */
export const COMPASS_LEG = 112
const SCALE = COMPASS_LEG / dist(HINGE, NEEDLE)
const LEG_N = dist(HINGE, NEEDLE) * SCALE
const LEG_P = dist(HINGE, PENCIL) * SCALE

type Affine = [number, number, number, number, number, number]

/** Turn + scale (+ optional left–right flip) taking photo point a → screen A and photo point b → screen B. */
function similarity(a: P, b: P, A: P, B: P, mirror: boolean): Affine {
  const m = mirror ? -1 : 1
  const wb: P = [m * (b[0] - a[0]), b[1] - a[1]]
  const D: P = [B[0] - A[0], B[1] - A[1]]
  const den = wb[0] * wb[0] + wb[1] * wb[1]
  const kr = (D[0] * wb[0] + D[1] * wb[1]) / den
  const ki = (D[1] * wb[0] - D[0] * wb[1]) / den
  const la = kr * m
  const lb = ki * m
  const lc = -ki
  const ld = kr
  return [la, lb, lc, ld, A[0] - (la * a[0] + lc * a[1]), A[1] - (lb * a[0] + ld * a[1])]
}

/**
 * Where the hinge must be so the needle leg reaches `center` and the pencil leg reaches `pen`.
 * Two answers (either side of the line); `side` picks one. With side = 0 the higher one on screen is chosen.
 */
export function compassHinge(center: P, pen: P, side: 1 | -1 | 0 = 0): { hinge: P; side: 1 | -1 } {
  const d = Math.max(dist(center, pen), 1e-6)
  const u: P = [(pen[0] - center[0]) / d, (pen[1] - center[1]) / d]
  const along = (LEG_N * LEG_N - LEG_P * LEG_P + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, LEG_N * LEG_N - along * along))
  const perp: P = [-u[1], u[0]]
  const s: 1 | -1 = side !== 0 ? side : perp[1] <= 0 ? 1 : -1
  return { hinge: [center[0] + u[0] * along + s * h * perp[0], center[1] + u[1] * along + s * h * perp[1]], side: s }
}

/** Widest opening the legs allow (tips' distance when the compass is opened flat). */
export const COMPASS_MAX_REACH = LEG_N + LEG_P

export default function RealCompass({ center, pen, side }: { center: P; pen: P; side: 1 | -1 }) {
  const id = useId().replace(/:/g, '')
  const { hinge } = compassHinge(center, pen, side)
  // The photo has the pencil on the left of the needle; flip the picture when on screen it must be on the right.
  const crossPhoto = (NEEDLE[0] - HINGE[0]) * (PENCIL[1] - HINGE[1]) - (NEEDLE[1] - HINGE[1]) * (PENCIL[0] - HINGE[0])
  const crossScreen = (center[0] - hinge[0]) * (pen[1] - hinge[1]) - (center[1] - hinge[1]) * (pen[0] - hinge[0])
  const mirror = Math.sign(crossPhoto) !== Math.sign(crossScreen)

  const needleT = similarity(HINGE, NEEDLE, hinge, center, mirror)
  const pencilT = similarity(HINGE, PENCIL, hinge, pen, mirror)
  // Head follows the middle direction between the two legs.
  const photoMid: P = [(NEEDLE[0] + PENCIL[0]) / 2, (NEEDLE[1] + PENCIL[1]) / 2]
  const screenMid: P = [(center[0] + pen[0]) / 2, (center[1] + pen[1]) / 2]
  const dm = Math.max(dist(hinge, screenMid), 1e-6)
  const headLen = dist(HINGE, photoMid) * SCALE
  const headTarget: P = [hinge[0] + ((screenMid[0] - hinge[0]) / dm) * headLen, hinge[1] + ((screenMid[1] - hinge[1]) / dm) * headLen]
  const headT = similarity(HINGE, photoMid, hinge, headTarget, mirror)

  const poly = (pts: P[]) => pts.map((p) => p.join(',')).join(' ')
  const pencilClip = poly([[0, HEAD_BOTTOM - 8], ...SPLIT, [0, IMG_H]])
  const needleClip = poly([[IMG_W, HEAD_BOTTOM - 8], ...SPLIT, [IMG_W, IMG_H]])
  const headClip = poly([
    [0, 0],
    [IMG_W, 0],
    [IMG_W, HEAD_BOTTOM],
    [0, HEAD_BOTTOM],
  ])
  const piece = (t: Affine, clip: string) => (
    <g transform={`matrix(${t.join(' ')})`}>
      <image href={compaUrl} width={IMG_W} height={IMG_H} clipPath={`url(#${id}-${clip})`} preserveAspectRatio="none" />
    </g>
  )

  return (
    <g pointerEvents="none" style={{ filter: 'drop-shadow(2px 3px 2px rgba(15,23,42,0.25))' }}>
      <defs>
        <clipPath id={`${id}-pencil`}>
          <polygon points={pencilClip} />
        </clipPath>
        <clipPath id={`${id}-needle`}>
          <polygon points={needleClip} />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <polygon points={headClip} />
        </clipPath>
      </defs>
      {piece(needleT, 'needle')}
      {piece(pencilT, 'pencil')}
      {piece(headT, 'head')}
    </g>
  )
}

/**
 * A school ruler laid along the compass opening: 0 at the needle (centre), mm and cm marks, the measured part
 * from 0 to the pencil highlighted, and the reading at the pencil mark. `side` = which side of the line the
 * ruler's body lies on (the side away from the compass).
 */
export function MeasureRuler({
  center,
  angleDeg,
  lengthPx,
  pxPerCm,
  maxCm,
  side,
  label,
}: {
  center: P
  /** Direction from the centre to the pencil, degrees anticlockwise from →. */
  angleDeg: number
  lengthPx: number
  pxPerCm: number
  maxCm: number
  /** +1 / −1: body below / above the measuring edge, in the ruler's own frame. */
  side: 1 | -1
  label: string
}) {
  const H = 34
  const pad = 9
  const L = maxCm * pxPerCm
  const a = ((angleDeg % 360) + 360) % 360
  // Text would read upside down when the ruler points left; turn each label half a turn so it stays upright.
  const flipText = a > 90 && a < 270
  const ticks = []
  for (let i = 0; i <= maxCm * 10; i++) {
    const x = (i * pxPerCm) / 10
    const len = i % 10 === 0 ? 12 : i % 5 === 0 ? 8.5 : 5
    ticks.push(<line key={i} x1={x} y1={0} x2={x} y2={side * len} stroke="#78350f" strokeWidth={i % 10 === 0 ? 1.3 : 0.7} />)
  }
  const txt = (key: string, x: number, y: number, s: string, props: React.SVGProps<SVGTextElement>) => (
    <text
      key={key}
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      transform={flipText ? `rotate(180 ${x} ${y})` : undefined}
      {...props}
    >
      {s}
    </text>
  )
  return (
    <g transform={`translate(${center[0]} ${center[1]}) rotate(${-angleDeg})`} pointerEvents="none">
      <rect
        x={-pad}
        y={side > 0 ? 0 : -H}
        width={L + pad * 2}
        height={H}
        rx={3}
        fill="#fef3c7"
        fillOpacity={0.93}
        stroke="#d97706"
        strokeWidth={1.2}
      />
      {/* measured part: from 0 (needle) to the pencil */}
      <rect x={0} y={side > 0 ? 0 : -4} width={lengthPx} height={4} fill="#dc2626" fillOpacity={0.75} />
      {ticks}
      {Array.from({ length: maxCm + 1 }, (_, k) =>
        txt(`n${k}`, k * pxPerCm, side * 21, String(k), { fontSize: 9.5, fontWeight: 700, fill: '#78350f' }),
      )}
      {txt('cm', L + pad - 6, side * 28, 'cm', { fontSize: 7, fill: '#92400e' })}
      {/* pencil mark across the ruler + reading */}
      <line x1={lengthPx} y1={-side * 6} x2={lengthPx} y2={side * (H + 4)} stroke="#dc2626" strokeWidth={1.8} />
      <circle cx={0} cy={0} r={2.6} fill="#dc2626" />
      {txt('r', lengthPx, side * (H + 13), label, {
        fontSize: 12,
        fontWeight: 800,
        fill: '#dc2626',
        stroke: '#fff',
        strokeWidth: 4,
        paintOrder: 'stroke',
      })}
    </g>
  )
}
