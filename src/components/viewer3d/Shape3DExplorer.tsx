import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import type { Shape3DDef } from '../../types'
import ShapeMesh3D from './ShapeMesh3D'
import VertexNames3D from './VertexNames3D'
import ParamSlider from '../common/ParamSlider'
import StatBadge from '../common/StatBadge'
import InfoCard from '../common/InfoCard'
import StudyLayout, { Panel } from '../common/StudyLayout'

export default function Shape3DExplorer({ def }: { def: Shape3DDef }) {
  const [params, setParams] = useState({ ...def.defaultParams })
  const [autoRotate, setAutoRotate] = useState(true)
  const [showNames, setShowNames] = useState(false)

  const volume = def.volume(params)
  const surface = def.surfaceArea(params)

  return (
    <StudyLayout
      visual={
        <>
          <div className="h-[380px] w-full overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-[#0b1324] to-[#16223d] shadow-sm sm:h-[460px] lg:h-[min(72vh,560px)]">
            <Canvas shadows camera={{ position: [5, 4, 6], fov: 40 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <ShapeMesh3D id={def.id} params={params} color={def.color} transparent multiColor />
              {showNames && <VertexNames3D id={def.id} params={params} />}
              <ContactShadows position={[0, -2.2, 0]} opacity={0.5} scale={10} blur={2} far={4} color="#000814" />
              <Environment preset="city" />
              <OrbitControls autoRotate={autoRotate} autoRotateSpeed={2.5} enablePan={false} minDistance={3} maxDistance={14} />
            </Canvas>
          </div>
          <p className="text-center text-sm text-slate-500">
            Kéo để xoay khối, lăn chuột để phóng to ·{' '}
            <button onClick={() => setAutoRotate((a) => !a)} className="font-medium text-indigo-600 underline-offset-2 hover:underline">
              {autoRotate ? 'Dừng tự xoay' : 'Tự động xoay'}
            </button>
          </p>
          <button
            onClick={() => setShowNames((v) => !v)}
            aria-pressed={showNames}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:scale-105 active:scale-95 ${
              showNames ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50'
            }`}
          >
            🔤 {showNames ? 'Ẩn tên đỉnh' : 'Hiện tên đỉnh'}
          </button>
        </>
      }
      side={
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatBadge label="Thể tích" value={volume} unit="cm³" />
            <StatBadge label="Diện tích bề mặt" value={surface} unit="cm²" />
          </div>
          <Panel title="Thay đổi kích thước">
            <div className="space-y-3">
              {def.params.map((pd) => (
                <ParamSlider key={pd.key} def={pd} value={params[pd.key]} onChange={(v) => setParams((prev) => ({ ...prev, [pd.key]: v }))} />
              ))}
            </div>
          </Panel>
          <InfoCard description={def.description} properties={def.properties} formulas={def.formulas} />
        </>
      }
    />
  )
}
