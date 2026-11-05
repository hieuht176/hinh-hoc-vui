import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function ShapeCard({ to, name, category, preview }: { to: string; name: string; category: string; preview: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-3xl border border-indigo-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex aspect-square w-full max-w-40 items-center justify-center [&>svg]:h-full [&>svg]:w-full">{preview}</div>
      <div>
        <div className="text-base font-bold text-slate-800 group-hover:text-indigo-600">{name}</div>
        <div className="text-xs text-slate-400">{category}</div>
      </div>
    </Link>
  )
}
