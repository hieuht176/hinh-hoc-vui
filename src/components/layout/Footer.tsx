export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-indigo-100/70 bg-white/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <p className="text-sm text-slate-500">
          © {year} <span className="font-semibold text-indigo-600">Hình Học Vui</span> · Được phát triển bởi{' '}
          <span className="font-semibold text-slate-700">Cô Đào Ngọc Mai</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Nền tảng học hình học trực quan dành cho học sinh</p>
      </div>
    </footer>
  )
}
