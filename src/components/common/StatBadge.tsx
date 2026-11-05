export default function StatBadge({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 text-center shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-indigo-600">
        {Number.isFinite(value) ? value.toFixed(2) : '—'}
        <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
      </div>
    </div>
  )
}
