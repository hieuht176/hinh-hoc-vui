import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { shapes3DMap } from '../data/shapes3d'
import Shape3DExplorer from '../components/viewer3d/Shape3DExplorer'
import NetSection from '../components/viewer3d/NetSection'

export default function Detail3DPage() {
  const { id } = useParams()
  const def = id ? shapes3DMap[id] : undefined
  const [tab, setTab] = useState<'solid' | 'net'>('solid')

  if (!def) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-500">Không tìm thấy khối hình này.</p>
        <Link to="/hinh-3d" className="mt-4 inline-block text-indigo-600 underline">
          Quay lại thư viện hình 3D
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/hinh-3d" className="text-sm text-indigo-500 hover:underline">
        ← Thư viện hình 3D
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-800">{def.name}</h1>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab('solid')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === 'solid' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          Khối 3D
        </button>
        <button
          onClick={() => setTab('net')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === 'net' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          Trải phẳng
        </button>
      </div>

      <div className="mt-6">
        {tab === 'solid' ? <Shape3DExplorer def={def} /> : <NetSection def={def} />}
      </div>
    </div>
  )
}
