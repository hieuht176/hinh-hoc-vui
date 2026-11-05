import { shapes3D } from '../data/shapes3d'
import ShapeCard from '../components/common/ShapeCard'
import Icon3D from '../components/common/Icon3D'

export default function Gallery3DPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Thư viện hình 3D</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Chọn một khối để xoay 360°, trải phẳng và xem công thức.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shapes3D.map((s) => (
          <ShapeCard key={s.id} to={`/hinh-3d/${s.id}`} name={s.name} category={s.category} preview={<Icon3D id={s.id} color={s.color} size={160} />} />
        ))}
      </div>
    </div>
  )
}
