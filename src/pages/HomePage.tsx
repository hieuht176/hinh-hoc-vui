import { Link } from 'react-router-dom'
import Hero from '../components/layout/Hero'

const cards = [
  { to: '/hinh-2d', title: 'Hình học 2D', desc: '17 hình phẳng: xoay, đổi kích thước, xem công thức.', emoji: '🔷', tint: 'from-violet-50' },
  { to: '/hinh-3d', title: 'Hình học 3D', desc: '8 khối: xoay 360°, trải phẳng thành hình khai triển.', emoji: '🧊', tint: 'from-sky-50' },
  { to: '/ghep-hinh-2d', title: 'Ghép hình 2D', desc: 'Kéo thả hình phẳng để ghép thành ngôi nhà, bông hoa…', emoji: '🧩', tint: 'from-fuchsia-50' },
  { to: '/ghep-hinh-3d', title: 'Ghép hình 3D', desc: 'Xếp chồng các khối thành mô hình của em.', emoji: '🏗️', tint: 'from-amber-50' },
  { to: '/phep-bien-hinh', title: 'Phép biến hình', desc: 'Trượt, quay, lật hình và soi gương trên lưới ô vuông.', emoji: '📐', tint: 'from-teal-50' },
  { to: '/hoa-tiet-doi-xung', title: 'Hoạ tiết đối xứng', desc: 'Bật nhiều trục gương cùng lúc, đặt nhiều hình, tô ô tạo hoạ tiết.', emoji: '🪞', tint: 'from-emerald-50' },
  { to: '/goc-va-compa', title: 'Góc & Compa', desc: 'Các loại góc, góc trên mặt đồng hồ, thước đo độ, compa.', emoji: '🧭', tint: 'from-indigo-50' },
  { to: '/tam-giac-va-hcn', title: 'Tam giác & Hình chữ nhật', desc: 'Vì sao diện tích tam giác bằng một nửa hình chữ nhật?', emoji: '✂️', tint: 'from-rose-50' },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Hero />

      <div id="features" className="mt-12 grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`group flex flex-col items-center gap-2 rounded-3xl border border-indigo-100 bg-gradient-to-b ${c.tint} to-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
          >
            <span className="text-6xl transition group-hover:scale-110">{c.emoji}</span>
            <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600">{c.title}</h2>
            <p className="text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
