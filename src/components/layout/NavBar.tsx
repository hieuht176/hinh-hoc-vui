import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/hinh-2d', label: 'Hình 2D' },
  { to: '/hinh-3d', label: 'Hình 3D' },
  { to: '/ghep-hinh-2d', label: 'Ghép hình 2D' },
  { to: '/ghep-hinh-3d', label: 'Ghép hình 3D' },
  { to: '/phep-bien-hinh', label: 'Phép biến hình' },
]

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/70 bg-white/75 shadow-[0_1px_0_0_rgba(99,102,241,0.06)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <span className="mr-2 flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-base text-white shadow-sm">
            📐
          </span>
          <span className="hidden sm:inline">
            Hình Học <span className="text-indigo-600">Vui</span>
          </span>
        </span>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
