import { Link } from 'react-router-dom'
import Hero from '../components/layout/Hero'

const cards = [
  {
    to: '/hinh-2d',
    title: 'Hình học 2D',
    desc: '12 hình phẳng: vuông, tròn, tam giác, đa giác đều... xoay, thay đổi kích thước, xem công thức diện tích & chu vi.',
    emoji: '🔷',
  },
  {
    to: '/hinh-3d',
    title: 'Hình học 3D',
    desc: '8 khối không gian: lập phương, cầu, trụ, nón, chóp... xoay 360° bằng chuột, xem thể tích & diện tích bề mặt, trải phẳng thành hình khai triển.',
    emoji: '🧊',
  },
  {
    to: '/ghep-hinh-2d',
    title: 'Ghép hình 2D',
    desc: 'Kéo - thả, xoay, phóng to các hình phẳng để tự tạo hình ghép của riêng bạn (nhà, hoa văn, ...).',
    emoji: '🧩',
  },
  {
    to: '/ghep-hinh-3d',
    title: 'Ghép hình 3D',
    desc: 'Xếp chồng, di chuyển các khối 3D trong không gian để tạo mô hình phức hợp, xoay góc nhìn tự do.',
    emoji: '🏗️',
  },
  {
    to: '/phep-bien-hinh',
    title: 'Phép biến hình',
    desc: 'Tịnh tiến, quay, đối xứng tâm, đối xứng trục, đối xứng quay — thực hành trực tiếp trên hệ tọa độ Oxy với công thức đi kèm.',
    emoji: '📐',
  },
  {
    to: '/goc-va-compa',
    title: 'Góc & Compa',
    desc: 'Các loại góc, tập vẽ góc bằng thước đo độ, vẽ hình tròn bằng compa, và khám phá vì sao tổng ba góc trong tam giác luôn bằng 180°.',
    emoji: '🧭',
  },
  {
    to: '/tam-giac-va-hcn',
    title: 'Tam giác & Hình chữ nhật',
    desc: 'Tách đôi hình chữ nhật theo đường chéo và kéo trượt đỉnh tam giác để hiểu vì sao diện tích tam giác luôn bằng nửa đáy × chiều cao.',
    emoji: '✂️',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Hero />

      <div id="features" className="mt-12 grid scroll-mt-24 gap-5 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex items-start gap-4 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-4xl">{c.emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">{c.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
