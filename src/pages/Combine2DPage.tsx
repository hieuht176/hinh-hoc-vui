import { useRef, useState } from 'react'
import { shapes2D, shapes2DMap } from '../data/shapes2d'
import { ShapeGeometryG } from '../components/viewer2d/ShapeSvg2D'
import type { PlacedShape2D } from '../types'

const CANVAS_W = 900
const CANVAS_H = 540
const PALETTE = ['#6366f1', '#0ea5e9', '#f97316', '#ef4444', '#22c55e', '#d946ef', '#14b8a6', '#f59e0b']

let nextId = 1

export default function Combine2DPage() {
  const [placed, setPlaced] = useState<PlacedShape2D[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const selected = placed.find((p) => p.id === selectedId) ?? null

  const localPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const addShape = (shapeId: string) => {
    const def = shapes2DMap[shapeId]
    const id = `s${nextId++}`
    const item: PlacedShape2D = {
      id,
      shapeId,
      x: CANVAS_W / 2 + (Math.random() * 80 - 40),
      y: CANVAS_H / 2 + (Math.random() * 80 - 40),
      rotation: 0,
      scale: 1,
      color: def.color,
      params: { ...def.defaultParams },
    }
    setPlaced((prev) => [...prev, item])
    setSelectedId(id)
  }

  const patchSelected = (patch: Partial<PlacedShape2D>) => {
    if (!selectedId) return
    setPlaced((prev) => prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)))
  }

  const bringToFront = (id: string) => {
    setPlaced((prev) => {
      const item = prev.find((p) => p.id === id)
      if (!item) return prev
      return [...prev.filter((p) => p.id !== id), item]
    })
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setPlaced((prev) => prev.filter((p) => p.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selected) return
    const id = `s${nextId++}`
    setPlaced((prev) => [...prev, { ...selected, id, x: selected.x + 24, y: selected.y + 24 }])
    setSelectedId(id)
  }

  // drag state
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null)
  const rotateRef = useRef<{ id: string; startAngle: number; startRotation: number } | null>(null)

  const onBodyPointerDown = (e: React.PointerEvent, item: PlacedShape2D) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setSelectedId(item.id)
    bringToFront(item.id)
    const p = localPoint(e.clientX, e.clientY)
    dragRef.current = { id: item.id, offX: p.x - item.x, offY: p.y - item.y }
  }

  const onRotateHandlePointerDown = (e: React.PointerEvent, item: PlacedShape2D) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const p = localPoint(e.clientX, e.clientY)
    const startAngle = (Math.atan2(p.y - item.y, p.x - item.x) * 180) / Math.PI
    rotateRef.current = { id: item.id, startAngle, startRotation: item.rotation }
  }

  const onSvgPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const p = localPoint(e.clientX, e.clientY)
      const { id, offX, offY } = dragRef.current
      setPlaced((prev) => prev.map((it) => (it.id === id ? { ...it, x: p.x - offX, y: p.y - offY } : it)))
    } else if (rotateRef.current) {
      const { id, startAngle, startRotation } = rotateRef.current
      const item = placed.find((it) => it.id === id)
      if (!item) return
      const p = localPoint(e.clientX, e.clientY)
      const angle = (Math.atan2(p.y - item.y, p.x - item.x) * 180) / Math.PI
      setPlaced((prev) => prev.map((it) => (it.id === id ? { ...it, rotation: startRotation + (angle - startAngle) } : it)))
    }
  }

  const onSvgPointerUp = () => {
    dragRef.current = null
    rotateRef.current = null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Ghép hình 2D</h1>
      <p className="mt-2 text-slate-500">
        Nhấn vào một hình bên dưới để thêm vào bàn ghép. Kéo để di chuyển, kéo chấm tròn phía trên để xoay, dùng bảng bên phải để đổi màu / kích
        thước.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {shapes2D.map((s) => (
          <button
            key={s.id}
            onClick={() => addShape(s.id)}
            className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600"
          >
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="overflow-auto rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
          <svg
            ref={svgRef}
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="touch-none rounded-xl bg-[radial-gradient(circle,_#eef2ff_1px,_transparent_1px)] [background-size:20px_20px]"
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerDown={() => setSelectedId(null)}
          >
            {placed.map((item) => {
              const def = shapes2DMap[item.shapeId]
              const isSelected = item.id === selectedId
              return (
                <g key={item.id}>
                  <g
                    transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
                    onPointerDown={(e) => onBodyPointerDown(e, item)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <ShapeGeometryG def={def} params={item.params} fill={item.color} strokeWidth={2} />
                  </g>
                  {isSelected && (
                    <g pointerEvents="none">
                      <circle cx={item.x} cy={item.y} r={4} fill="none" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3" />
                    </g>
                  )}
                  {isSelected && (
                    <line
                      x1={item.x}
                      y1={item.y}
                      x2={item.x}
                      y2={item.y - 60}
                      stroke="#6366f1"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      pointerEvents="none"
                    />
                  )}
                  {isSelected && (
                    <circle
                      cx={item.x}
                      cy={item.y - 60}
                      r={8}
                      fill="#6366f1"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => onRotateHandlePointerDown(e, item)}
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-700">{shapes2DMap[selected.shapeId].name}</div>
              <label className="block text-sm">
                <div className="mb-1 flex justify-between text-slate-500">
                  <span>Kích thước</span>
                  <span>{selected.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.5}
                  step={0.05}
                  value={selected.scale}
                  onChange={(e) => patchSelected({ scale: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </label>
              <label className="block text-sm">
                <div className="mb-1 flex justify-between text-slate-500">
                  <span>Góc xoay</span>
                  <span>{Math.round(selected.rotation % 360)}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={((selected.rotation % 360) + 360) % 360}
                  onChange={(e) => patchSelected({ rotation: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </label>
              <div>
                <div className="mb-1 text-sm text-slate-500">Màu sắc</div>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => patchSelected({ color: c })}
                      className={`h-7 w-7 rounded-full border-2 ${selected.color === c ? 'border-slate-700' : 'border-white'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={duplicateSelected} className="flex-1 rounded-lg bg-indigo-50 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
                  Nhân đôi
                </button>
                <button onClick={deleteSelected} className="flex-1 rounded-lg bg-red-50 py-1.5 text-sm font-medium text-red-500 hover:bg-red-100">
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-4 text-sm text-slate-400">
              Chọn một hình trên bàn ghép để chỉnh sửa, hoặc bấm hình ở trên để thêm mới.
            </div>
          )}
          {placed.length > 0 && (
            <button
              onClick={() => {
                setPlaced([])
                setSelectedId(null)
              }}
              className="w-full rounded-lg border border-slate-200 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              Xóa toàn bộ bàn ghép
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
