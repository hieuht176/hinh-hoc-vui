import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { buildGeometry3D } from './ShapeMesh3D'

type V3 = [number, number, number]

/**
 * Textbook-style vertex names for a 3D solid, e.g. ABCD.A'B'C'D' for a cube, S.ABCD for a pyramid.
 * Polyhedron corners are read from the very geometry that is drawn, grouped by height (bottom → top) and named
 * anticlockwise when seen from above, so A' always sits straight above A.
 */
export function vertexNames3D(id: string, p: Record<string, number>): { name: string; pos: V3 }[] {
  if (id === 'sphere') return [{ name: 'O', pos: [0, 0, 0] }]
  if (id === 'cylinder')
    return [
      { name: 'O', pos: [0, -p.h / 2, 0] },
      { name: "O'", pos: [0, p.h / 2, 0] },
    ]
  if (id === 'cone')
    return [
      { name: 'S', pos: [0, p.h / 2, 0] },
      { name: 'O', pos: [0, -p.h / 2, 0] },
    ]

  const geo = buildGeometry3D(id, p)
  const attr = geo.getAttribute('position')
  const unique: V3[] = []
  for (let i = 0; i < attr.count; i++) {
    const v: V3 = [attr.getX(i), attr.getY(i), attr.getZ(i)]
    if (!unique.some((u) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) < 1e-4)) unique.push(v)
  }
  geo.dispose()

  // Group corners into horizontal levels.
  const levels: V3[][] = []
  for (const v of [...unique].sort((a, b) => a[1] - b[1])) {
    const level = levels.find((l) => Math.abs(l[0][1] - v[1]) < 1e-4)
    if (level) level.push(v)
    else levels.push([v])
  }
  // Seen from above (looking down −y) anticlockwise means decreasing atan2(z, x) in three.js coordinates.
  const ring = (l: V3[]) => [...l].sort((a, b) => Math.atan2(b[2], b[0]) - Math.atan2(a[2], a[0]))
  const letters = 'ABCDEFGH'
  const named: { name: string; pos: V3 }[] = []
  const bigLevels = levels.filter((l) => l.length > 1)
  const singles = levels.filter((l) => l.length === 1)

  if (bigLevels.length === 2) {
    // Prism / cube / cuboid: bottom ABCD…, top A'B'C'D'… (matched by direction so A' is above A).
    const bottom = ring(bigLevels[0])
    bottom.forEach((v, i) => named.push({ name: letters[i], pos: v }))
    for (const v of bigLevels[1]) {
      const i = bottom.findIndex((b) => Math.abs(Math.atan2(b[2], b[0]) - Math.atan2(v[2], v[0])) < 1e-3)
      named.push({ name: `${letters[i >= 0 ? i : 0]}'`, pos: v })
    }
  } else if (bigLevels.length === 1) {
    const base = ring(bigLevels[0])
    base.forEach((v, i) => named.push({ name: letters[i], pos: v }))
    if (singles.length === 1) named.push({ name: 'S', pos: singles[0][0] }) // pyramid apex
    if (singles.length === 2) {
      // octahedron: E on top, F at the bottom
      const [low, high] = singles[0][0][1] < singles[1][0][1] ? [singles[0][0], singles[1][0]] : [singles[1][0], singles[0][0]]
      named.push({ name: letters[base.length], pos: high }, { name: letters[base.length + 1], pos: low })
    }
  }
  return named
}

/** The names, drawn as small labels that follow the solid while it turns. */
export default function VertexNames3D({ id, params }: { id: string; params: Record<string, number> }) {
  const names = useMemo(() => vertexNames3D(id, params), [id, JSON.stringify(params)])
  return (
    <group>
      {names.map(({ name, pos }) => {
        const len = Math.hypot(...pos) || 1
        // Nudge the label a little outwards from the centre so it does not sit on the edge lines.
        const out: V3 = pos.map((c) => c + (c / len) * 0.35) as V3
        return (
          <group key={name}>
            <mesh position={pos}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <Html position={out} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-sm font-bold text-slate-900 shadow">{name}</span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
