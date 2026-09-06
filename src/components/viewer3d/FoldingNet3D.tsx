import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import type { FoldFace } from '../../utils/foldTree'
import { buildBoxFoldTree, buildPyramidFoldTree, foldTreeFootprint } from '../../utils/foldTree'

function facePlaneGeometry(vertices: [number, number, number][]): THREE.BufferGeometry {
  const positions: number[] = []
  for (let i = 1; i < vertices.length - 1; i++) {
    positions.push(...vertices[0], ...vertices[i], ...vertices[i + 1])
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

function FoldFaceNode({ face, t }: { face: FoldFace; t: number }) {
  const geometry = useMemo(() => facePlaneGeometry(face.vertices), [face])
  const angle = (face.foldAngle ?? 0) * t
  const rotation: [number, number, number] = face.axis === 'x' ? [angle, 0, 0] : face.axis === 'z' ? [0, 0, angle] : [0, 0, 0]

  return (
    <group position={face.pivot ?? [0, 0, 0]} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={face.color} side={THREE.DoubleSide} roughness={0.5} metalness={0.05} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#1e293b" />
      </lineSegments>
      {(face.children ?? []).map((c) => (
        <FoldFaceNode key={c.id} face={c} t={t} />
      ))}
    </group>
  )
}

function buildTree(shapeId: string, p: Record<string, number>, color: string): FoldFace | null {
  if (shapeId === 'cube') return buildBoxFoldTree(p.a, p.a, p.a, color)
  if (shapeId === 'cuboid') return buildBoxFoldTree(p.a, p.c, p.b, color)
  if (shapeId === 'square-pyramid') return buildPyramidFoldTree(p.a, p.h, color)
  return null
}

export default function FoldingNet3D({ shapeId, params, color }: { shapeId: string; params: Record<string, number>; color: string }) {
  const [t, setT] = useState(0)
  const tree = useMemo(() => buildTree(shapeId, params, color), [shapeId, JSON.stringify(params), color])
  const { w, d } = foldTreeFootprint(shapeId, params)

  if (!tree) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-[#0b1324] to-[#16223d] shadow-sm">
        <Canvas shadows camera={{ position: [6, 6, 7], fov: 40 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 9, 5]} intensity={1.2} castShadow />
          <group position={[-w / 2, 0, -d / 2]}>
            <FoldFaceNode face={tree} t={t} />
          </group>
          <ContactShadows position={[0, -0.02, 0]} opacity={0.5} scale={12} blur={2} far={4} color="#000814" />
          <Environment preset="city" />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={16} />
        </Canvas>
      </div>
      <label className="block w-full max-w-sm text-sm">
        <div className="mb-1 flex justify-between text-slate-500">
          <span>Trải phẳng ⟷ Gấp lại</span>
          <span className="font-mono font-semibold text-indigo-600">{Math.round(t * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full accent-indigo-600" />
      </label>
      <p className="text-xs text-slate-400">Kéo thanh trượt để mở bung hoặc gấp lại các mặt — kéo chuột trên canvas để xoay góc nhìn</p>
    </div>
  )
}
