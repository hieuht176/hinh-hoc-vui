import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function ShapeCard({ to, name, category, preview }: { to: string; name: string; category: string; preview: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-24 w-24 items-center justify-center">{preview}</div>
      <div>
        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">{name}</div>
        <div className="text-xs text-slate-400">{category}</div>
      </div>
    </Link>
  )
}
