import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import type { Shape3DDef } from '../../types'
import ShapeMesh3D from './ShapeMesh3D'
import ParamSlider from '../common/ParamSlider'
import StatBadge from '../common/StatBadge'
import InfoCard from '../common/InfoCard'

export default function Shape3DExplorer({ def }: { def: Shape3DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })
  const [autoRotate, setAutoRotate] = useState(true)

  const volume = def.volume(params)
  const surface = def.surfaceArea(params)

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col items-center gap-4">
        <div className="h-[340px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-[#0b1324] to-[#16223d] shadow-sm">
          <Canvas shadows camera={{ position: [5, 4, 6], fov: 40 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
            <ShapeMesh3D id={def.id} params={params} color={def.color} transparent multiColor />
            <ContactShadows position={[0, -2.2, 0]} opacity={0.5} scale={10} blur={2} far={4} color="#000814" />
            <Environment preset="city" />
            <OrbitControls autoRotate={autoRotate} autoRotateSpeed={2.5} enablePan={false} minDistance={3} maxDistance={14} />
          </Canvas>
        </div>
        <p className="text-xs text-slate-400">Kéo chuột / chạm để xoay 360° quanh khối hình, lăn chuột để zoom</p>
        <button
          onClick={() => setAutoRotate((a) => !a)}
          className="rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
        >
          {autoRotate ? 'Dừng tự xoay' : 'Tự động xoay'}
        </button>
        <div className="grid w-full grid-cols-2 gap-3">
          <StatBadge label="Thể tích" value={volume} unit="cm³" />
          <StatBadge label="Diện tích bề mặt" value={surface} unit="cm²" />
        </div>
        <div className="w-full space-y-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          {def.params.map((pd) => (
            <ParamSlider key={pd.key} def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
          ))}
        </div>
      </div>
      <InfoCard description={def.description} properties={def.properties} formulas={def.formulas} />
    </div>
  )
}
