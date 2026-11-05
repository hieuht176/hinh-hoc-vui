import { shapes2D } from '../data/shapes2d'
import ShapeCard from '../components/common/ShapeCard'
import ShapeSvg2D from '../components/viewer2d/ShapeSvg2D'

export default function Gallery2DPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Thư viện hình 2D</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Chọn một hình để xoay, phóng to thu nhỏ và xem công thức.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shapes2D.map((s) => (
          <ShapeCard
            key={s.id}
            to={`/hinh-2d/${s.id}`}
            name={s.name}
            category={s.category}
            preview={<ShapeSvg2D def={s} params={s.defaultParams} size={160} />}
          />
        ))}
      </div>
    </div>
  )
}
