import { useMemo } from 'react'
import * as THREE from 'three'
import { createSquarePyramidGeometry, createTriangularPrismGeometry } from '../../utils/geometryFactory'

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
    case 'octahedron':
      return new THREE.OctahedronGeometry(p.a / Math.SQRT2, 0)
    default:
      return new THREE.BoxGeometry(1, 1, 1)
  }
}

export default function ShapeMesh3D({
  id,
  params,
  color,
}: {
  id: string
  params: Record<string, number>
  color: string
}) {
  const geometry = useMemo(() => buildGeometry3D(id, params), [id, JSON.stringify(params)])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#1e293b" transparent opacity={0.35} />
      </lineSegments>
    </mesh>
  )
}
