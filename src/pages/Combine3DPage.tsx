import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { shapes3D, shapes3DMap } from '../data/shapes3d'
import ShapeMesh3D from '../components/viewer3d/ShapeMesh3D'
import Icon3D from '../components/common/Icon3D'
import { getHalfExtents, findFreeSpot, restingBottomY, type Footprint } from '../utils/placement3d'
import type { PlacedShape3D } from '../types'

const PALETTE = ['#6366f1', '#0ea5e9', '#f97316', '#ef4444', '#22c55e', '#d946ef', '#14b8a6', '#f59e0b']
const DROP_HEIGHT = 3

let nextId = 1

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export default function Combine3DPage() {
  const [placed, setPlaced] = useState<PlacedShape3D[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const groupsRef = useRef<Map<string, THREE.Group>>(new Map())
  const animRafs = useRef<Map<string, number>>(new Map())

  const selected = placed.find((p) => p.id === selectedId) ?? null

  const worldFootprints = (excludeId?: string): Footprint[] => {
    const list: Footprint[] = []
    groupsRef.current.forEach((g, id) => {
      if (id === excludeId) return
      g.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(g)
      list.push({
        x: (box.min.x + box.max.x) / 2,
        z: (box.min.z + box.max.z) / 2,
        hx: (box.max.x - box.min.x) / 2,
        hz: (box.max.z - box.min.z) / 2,
        maxY: box.max.y,
      })
    })
    return list
  }

  const animateDrop = (id: string, from: number, to: number) => {
    const prevRaf = animRafs.current.get(id)
    if (prevRaf) cancelAnimationFrame(prevRaf)
    const duration = 420
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const y = from + (to - from) * easeOutCubic(t)
      setPlaced((prev) => prev.map((p) => (p.id === id ? { ...p, y } : p)))
      if (t < 1) {
        animRafs.current.set(id, requestAnimationFrame(step))
      } else {
        animRafs.current.delete(id)
      }
    }
    animRafs.current.set(id, requestAnimationFrame(step))
  }

  const addShape = (shapeId: string) => {
    const def = shapes3DMap[shapeId]
    const id = `b${nextId++}`
    const { hx, hy, hz } = getHalfExtents(shapeId, def.defaultParams)
    const [x, z] = findFreeSpot(hx, hz, worldFootprints())
    const item: PlacedShape3D = {
      id,
      shapeId,
      x,
      y: hy + DROP_HEIGHT,
      z,
      rx: 0,
      ry: 0,
      rz: 0,
      scale: [1, 1, 1],
      color: def.color,
      params: { ...def.defaultParams },
    }
    setPlaced((prev) => [...prev, item])
    setSelectedId(id)
    animateDrop(id, hy + DROP_HEIGHT, hy)
  }

  const patchSelected = (patch: Partial<PlacedShape3D>) => {
    if (!selectedId) return
    setPlaced((prev) => prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    groupsRef.current.delete(selectedId)
    setPlaced((prev) => prev.filter((p) => p.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selected) return
    const id = `b${nextId++}`
    const { hx, hy, hz } = getHalfExtents(selected.shapeId, selected.params)
    const [sx, sy, sz] = selected.scale
    const [x, z] = findFreeSpot(hx * sx, hz * sz, worldFootprints())
    const targetY = hy * sy
    setPlaced((prev) => [...prev, { ...selected, id, x, z, y: targetY + DROP_HEIGHT }])
    setSelectedId(id)
    animateDrop(id, targetY + DROP_HEIGHT, targetY)
  }

  const resolveAfterTransform = (id: string) => {
    const g = groupsRef.current.get(id)
    if (!g) return
    g.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(g)
    const cx = (box.min.x + box.max.x) / 2
    const cz = (box.min.z + box.max.z) / 2
    const hx = (box.max.x - box.min.x) / 2
    const hz = (box.max.z - box.min.z) / 2
    const restBottom = restingBottomY(cx, cz, hx, hz, worldFootprints(id))
    const dy = restBottom - box.min.y
    const finalY = g.position.y + dy

    setPlaced((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              x: g.position.x,
              z: g.position.z,
              rx: g.rotation.x,
              ry: g.rotation.y,
              rz: g.rotation.z,
              scale: [g.scale.x, g.scale.y, g.scale.z],
            }
          : p,
      ),
    )
    if (Math.abs(dy) > 0.01) {
      animateDrop(id, g.position.y, finalY)
    } else {
      setPlaced((prev) => prev.map((p) => (p.id === id ? { ...p, y: finalY } : p)))
    }
  }

  const selectedGroup = selectedId ? groupsRef.current.get(selectedId) : undefined

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Ghép hình 3D</h1>
      <p className="mt-2 text-slate-500">
        Bấm một khối để thêm vào không gian — khối mới sẽ tự rơi xuống và xếp gọn bên cạnh các khối khác. Kéo một khối chồng lên khối
        khác để xếp chồng, không lo bị xuyên qua nhau. Kéo chuột nền để xoay góc nhìn 360°.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {shapes3D.map((s) => (
          <button
            key={s.id}
            onClick={() => addShape(s.id)}
            className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:translate-y-0"
          >
            <span className="h-4 w-4">
              <Icon3D id={s.id} color={s.color} size={16} />
            </span>
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="h-[560px] overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-slate-50 to-indigo-50 shadow-sm">
          <Canvas shadows camera={{ position: [7, 6, 9], fov: 40 }} onPointerMissed={() => setSelectedId(null)}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
            <Grid args={[30, 30]} sectionColor="#c7d2fe" cellColor="#e0e7ff" fadeDistance={20} position={[0, 0, 0]} />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2.2} far={10} />
            <Environment preset="city" />

            {placed.map((item) => (
              <group
                key={item.id}
                ref={(g) => {
                  if (g) groupsRef.current.set(item.id, g)
                }}
                position={[item.x, item.y, item.z]}
                rotation={[item.rx, item.ry, item.rz]}
                scale={item.scale}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId(item.id)
                }}
              >
                <ShapeMesh3D id={item.shapeId} params={item.params} color={item.color} />
              </group>
            ))}

            {selectedGroup && (
              <TransformControls
                object={selectedGroup}
                mode={mode}
                onMouseDown={() => setOrbitEnabled(false)}
                onMouseUp={() => {
                  setOrbitEnabled(true)
                  if (selectedId) resolveAfterTransform(selectedId)
                }}
              />
            )}

            <OrbitControls makeDefault enabled={orbitEnabled} enablePan minDistance={3} maxDistance={26} />
          </Canvas>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Công cụ</div>
            <div className="flex gap-2">
              {(
                [
                  ['translate', 'Di chuyển'],
                  ['rotate', 'Xoay'],
                  ['scale', 'Phóng to'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                    mode === m ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-700">{shapes3DMap[selected.shapeId].name}</div>
              <div>
                <div className="mb-1 text-sm text-slate-500">Màu sắc</div>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => patchSelected({ color: c })}
                      className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                        selected.color === c ? 'border-slate-700' : 'border-white'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={duplicateSelected}
                  className="flex-1 rounded-lg bg-indigo-50 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
                >
                  Nhân đôi
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex-1 rounded-lg bg-red-50 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-4 text-sm text-slate-400">
              Bấm chọn một khối trong không gian để chỉnh sửa, hoặc bấm khối ở trên để thêm mới.
            </div>
          )}
          {placed.length > 0 && (
            <button
              onClick={() => {
                setPlaced([])
                setSelectedId(null)
              }}
              className="w-full rounded-lg border border-slate-200 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              Xóa toàn bộ không gian
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
