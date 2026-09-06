import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createSquarePyramidGeometry, createTriangularPrismGeometry } from '../../utils/geometryFactory'

const FACE_PALETTE = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#34d399', '#38bdf8', '#818cf8', '#e879f9']

export function buildGeometry3D(id: string, p: Record<string, number>): THREE.BufferGeometry {
  switch (id) {
    case 'cube':
      return new THREE.BoxGeometry(p.a, p.a, p.a)
    case 'cuboid':
      return new THREE.BoxGeometry(p.a, p.c, p.b)
    case 'sphere':
      return new THREE.SphereGeometry(p.r, 32, 24)
    case 'cylinder':
      return new THREE.CylinderGeometry(p.r, p.r, p.h, 32)
    case 'cone':
      return new THREE.ConeGeometry(p.r, p.h, 32)
    case 'square-pyramid':
      return createSquarePyramidGeometry(p.a, p.h)
    case 'triangular-prism':
      return createTriangularPrismGeometry(p.a, p.h)
    case 'octahedron': {
      const geo = new THREE.OctahedronGeometry(p.a / Math.SQRT2, 0)
      // Give each of the 8 triangular faces its own group so they can be colored individually.
      geo.clearGroups()
      for (let i = 0; i < 8; i++) geo.addGroup(i * 3, 3, i)
      return geo
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1)
  }
}

export default function ShapeMesh3D({
  id,
  params,
  color,
  transparent = false,
  multiColor = false,
}: {
  id: string
  params: Record<string, number>
  color: string
  /** See-through "study" material that reveals edges/faces normally hidden behind the surface. */
  transparent?: boolean
  /** Give each face its own color (from a fixed palette) instead of one solid color. */
  multiColor?: boolean
}) {
  const geometry = useMemo(() => buildGeometry3D(id, params), [id, JSON.stringify(params)])
  const hasFaceGroups = multiColor && geometry.groups.length > 1

  const faceMaterials = useMemo(() => {
    if (!hasFaceGroups) return null
    const count = geometry.groups.reduce((m, g) => Math.max(m, g.materialIndex ?? 0), 0) + 1
    return Array.from(
      { length: count },
      (_, i) =>
        new THREE.MeshStandardMaterial({
          color: FACE_PALETTE[i % FACE_PALETTE.length],
          roughness: 0.4,
          metalness: 0.1,
          transparent,
          opacity: transparent ? 0.55 : 1,
          side: THREE.DoubleSide,
          depthWrite: !transparent,
        }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, hasFaceGroups, transparent])

  useEffect(() => () => faceMaterials?.forEach((m) => m.dispose()), [faceMaterials])

  return (
    <mesh geometry={geometry} castShadow={!transparent} receiveShadow {...(faceMaterials ? { material: faceMaterials } : {})}>
      {!faceMaterials && (
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          transparent={transparent}
          opacity={transparent ? 0.55 : 1}
          side={THREE.DoubleSide}
          depthWrite={!transparent}
        />
      )}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={transparent ? '#334155' : '#1e293b'} transparent opacity={transparent ? 0.85 : 0.35} depthTest={!transparent} />
      </lineSegments>
    </mesh>
  )
}
