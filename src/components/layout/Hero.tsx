import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-500 px-6 py-16 text-center shadow-lg sm:px-10">
      {/* graph-paper grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* floating decorative shapes */}
      <svg className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 opacity-20 sm:h-36 sm:w-36" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" />
      </svg>
      <svg className="pointer-events-none absolute -right-4 top-8 h-20 w-20 rotate-12 opacity-20 sm:h-28 sm:w-28" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="none" stroke="white" strokeWidth="6" rx="12" />
      </svg>
      <svg className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 opacity-15 sm:h-32 sm:w-32" viewBox="0 0 100 100">
        <polygon points="50,8 92,88 8,88" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" />
      </svg>
      <svg className="pointer-events-none absolute -bottom-8 right-10 h-24 w-24 opacity-15 sm:h-32 sm:w-32" viewBox="0 0 100 100">
        <polygon points="50,4 95,27 95,73 50,96 5,73 5,27" fill="none" stroke="white" strokeWidth="5" strokeLinejoin="round" />
      </svg>

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
          Toán hình học · 2D & 3D
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Học hình học <span className="text-white/80">trực quan</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-indigo-50/90 sm:text-lg">
          Xoay hình 360°, trải phẳng khối 3D, ghép hình tự do và thực hành phép biến hình ngay trên hệ tọa độ — tất cả trong một nơi.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/hinh-2d" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            Khám phá Hình 2D
          </Link>
          <Link
            to="/hinh-3d"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Khám phá Hình 3D
          </Link>
        </div>
      </div>
    </div>
  )
}
