import { Link, useParams } from 'react-router-dom'
import { shapes2DMap } from '../data/shapes2d'
import Shape2DExplorer from '../components/viewer2d/Shape2DExplorer'

export default function Detail2DPage() {
  const { id } = useParams()
  const def = id ? shapes2DMap[id] : undefined

  if (!def) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-500">Không tìm thấy hình này.</p>
        <Link to="/hinh-2d" className="mt-4 inline-block text-indigo-600 underline">
          Quay lại thư viện hình 2D
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/hinh-2d" className="text-sm text-indigo-500 hover:underline">
        ← Thư viện hình 2D
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-800">{def.name}</h1>
      <div className="mt-6">
        <Shape2DExplorer def={def} />
      </div>
    </div>
  )
}
