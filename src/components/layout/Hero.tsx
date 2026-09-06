import { Link } from 'react-router-dom'
import { angleOfPoint, arcPath, interiorAngleDeg, polarToCartesian } from '../../utils/angleMath'

const FEATURES = [
  { to: '/hinh-2d', icon: <Icon2D />, gradient: 'from-violet-500 to-purple-600', title: '2D', desc: 'Vẽ và khám phá hình phẳng' },
  { to: '/hinh-3d', icon: <Icon3D />, gradient: 'from-sky-400 to-blue-600', title: '3D', desc: 'Xoay và quan sát khối không gian' },
  { to: '/ghep-hinh-2d', icon: <IconPuzzle />, gradient: 'from-fuchsia-500 to-pink-600', title: 'Ghép hình', desc: 'Tạo và lắp ghép các hình' },
  { to: '/phep-bien-hinh', icon: <IconTransform />, gradient: 'from-cyan-400 to-teal-500', title: 'Phép biến hình', desc: 'Tịnh tiến, đối xứng, quay' },
]

export default function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172B8F] via-[#4338CA] to-[#7C3AED] shadow-xl">
      {/* subtle radial glow, right side (behind the cube) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 700px 480px at 78% 45%, rgba(124,58,237,0.35), transparent 70%)' }}
      />
      {/* faint cartesian grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative grid gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[47%_53%] lg:items-center lg:gap-4 lg:px-10 lg:py-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm sm:text-sm">
            <IconCube className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            NỀN TẢNG HÌNH HỌC TƯƠNG TÁC
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl lg:text-[2.75rem]">
            Khám phá
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">không gian</span>{' '}
            hình học
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Vẽ hình, xoay khối 3D, ghép hình và mô phỏng các phép biến hình trực tiếp trên hệ tọa độ.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/hinh-2d"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#5145E5] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Bắt đầu khám phá <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/45 bg-transparent px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <IconPlay className="h-3 w-3" aria-hidden="true" /> Xem công cụ
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                to={f.to}
                className="group flex items-start gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-[0_0_16px_-4px_rgba(129,140,248,0.65)] transition group-hover:scale-105`}
                >
                  {f.icon}
                </span>
                <span>
                  <div className="text-sm font-bold text-white">{f.title}</div>
                  <div className="text-xs leading-snug text-white/60">{f.desc}</div>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-2 lg:h-full">
          <HeroIllustration />
        </div>
      </div>
    </div>
  )
}

/** Circumcenter + circumradius of a triangle, computed exactly (not eyeballed) so the drawn circle truly passes through A, B, C. */
function circumcircle(a: [number, number], b: [number, number], c: [number, number]) {
  const [ax, ay] = a
  const [bx, by] = b
  const [cx, cy] = c
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
  return { cx: ux, cy: uy, r: Math.hypot(ax - ux, ay - uy) }
}

function HeroIllustration() {
  const O: [number, number] = [60, 300]
  const A: [number, number] = [90, 288]
  const B: [number, number] = [250, 288]
  const C: [number, number] = [150, 100]
  const circ = circumcircle(A, B, C)

  // angle at B, computed exactly from the actual points (same technique as the Triangle-angle-sum tool)
  const angleB = interiorAngleDeg(B, A, C)
  const a1 = angleOfPoint(B[0], B[1], A[0], A[1])
  const a2 = angleOfPoint(B[0], B[1], C[0], C[1])
  const rawSweep = ((a2 - a1) % 360 + 360) % 360
  const matches = Math.abs(rawSweep - angleB) < 1
  const [start, end] = matches ? [a1, a2] : [a2, a1]
  const arcR = 28
  const arcD = arcPath(B[0], B[1], arcR, start, end)
  const [labelX, labelY] = polarToCartesian(B[0], B[1], arcR + 20, start + angleB / 2)

  return (
    <svg viewBox="0 0 640 480" className="w-full max-w-[440px]" style={{ overflow: 'visible' }} aria-hidden="true">
      <style>{`
        @keyframes heroFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes heroFloatSlow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
        @keyframes heroSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes heroPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .hero-anim-cube { animation: heroFloat 6.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .hero-anim-orbit { animation: heroSpin 16s linear infinite; transform-box: fill-box; transform-origin: center; }
        .hero-anim-pyramid { animation: heroFloatSlow 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .hero-anim-sphere { animation: heroFloatSlow 8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; animation-delay: -2s; }
        .hero-anim-spin { animation: heroSpin 7s linear infinite; transform-box: fill-box; transform-origin: center; }
        .hero-anim-pulse { animation: heroPulse 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hero-anim-cube, .hero-anim-orbit, .hero-anim-pyramid, .hero-anim-sphere, .hero-anim-spin, .hero-anim-pulse { animation: none !important; }
        }
      `}</style>
      <defs>
        <linearGradient id="triFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="triEdge" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="cubeFaceA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id="cubeFaceB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.35} />
        </linearGradient>
        <radialGradient id="sphereGrad2" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#86198f" />
        </radialGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fda4af" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#e11d48" stopOpacity={0.65} />
        </linearGradient>
        <filter id="heroGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ---- coordinate plane + triangle (2D) ---- */}
      <g opacity={0.14} stroke="#c7d2fe" strokeWidth={1}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={60 + i * 40} y1={60} x2={60 + i * 40} y2={300} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`h${i}`} x1={60} y1={300 - i * 40} x2={300} y2={300 - i * 40} />
        ))}
      </g>

      <g stroke="#e0e7ff" strokeWidth={2} opacity={0.85}>
        <line x1={O[0]} y1={O[1]} x2={312} y2={O[1]} />
        <line x1={O[0]} y1={O[1]} x2={O[0]} y2={40} />
      </g>
      {/* tick marks */}
      <g stroke="#e0e7ff" strokeWidth={1.2} opacity={0.5}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`tx${i}`} x1={60 + i * 40} y1={296} x2={60 + i * 40} y2={304} />
        ))}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`ty${i}`} x1={56} y1={300 - i * 40} x2={64} y2={300 - i * 40} />
        ))}
      </g>
      <path d="M 304 294 L 316 300 L 304 306 Z" fill="#e0e7ff" opacity={0.85} />
      <path d="M 54 48 L 60 36 L 66 48 Z" fill="#e0e7ff" opacity={0.85} />
      <text x={322} y={306} fontSize={15} fill="#e0e7ff" fontStyle="italic">x</text>
      <text x={48} y={44} fontSize={15} fill="#e0e7ff" fontStyle="italic">y</text>

      <circle cx={circ.cx} cy={circ.cy} r={circ.r} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} strokeDasharray="7 7" />

      <polygon points={`${A.join(',')} ${B.join(',')} ${C.join(',')}`} fill="url(#triFill)" stroke="url(#triEdge)" strokeWidth={2.25} strokeLinejoin="round" />

      <path d={arcD} fill="none" stroke="#fbbf24" strokeWidth={2} />
      <text x={labelX} y={labelY} fontSize={14} fontWeight={700} fill="#fde68a" textAnchor="middle">
        {Math.round(angleB)}°
      </text>

      <circle className="hero-anim-pulse" cx={A[0]} cy={A[1]} r={6} fill="#22d3ee" stroke="white" strokeWidth={1.5} filter="url(#heroGlow)" />
      <circle className="hero-anim-pulse" cx={B[0]} cy={B[1]} r={6} fill="#8b5cf6" stroke="white" strokeWidth={1.5} filter="url(#heroGlow)" />
      <circle className="hero-anim-pulse" cx={C[0]} cy={C[1]} r={6} fill="#a78bfa" stroke="white" strokeWidth={1.5} filter="url(#heroGlow)" />
      <text x={A[0] - 18} y={A[1] + 4} fontSize={14} fontWeight={700} fill="white">A</text>
      <text x={B[0] + 12} y={B[1] + 4} fontSize={14} fontWeight={700} fill="white">B</text>
      <text x={C[0] - 4} y={C[1] - 12} fontSize={14} fontWeight={700} fill="white">C</text>

      {/* ---- 3D cube, orbit ring + rotation (3D) ---- */}
      <g transform="translate(410 60)">
        <g className="hero-anim-cube">
          <polygon points="0,50 90,10 180,50 90,90" fill="url(#cubeFaceA)" stroke="#dbeafe" strokeWidth={1.5} filter="url(#heroGlow)" />
          <polygon points="0,50 90,90 90,180 0,140" fill="url(#cubeFaceB)" stroke="#dbeafe" strokeWidth={1.5} filter="url(#heroGlow)" />
          <polygon points="180,50 90,90 90,180 180,140" fill="url(#cubeFaceA)" stroke="#dbeafe" strokeWidth={1.5} opacity={0.9} filter="url(#heroGlow)" />
          <line x1={0} y1={50} x2={0} y2={140} stroke="#dbeafe" strokeWidth={1.2} opacity={0.7} />
          <line x1={180} y1={50} x2={180} y2={140} stroke="#dbeafe" strokeWidth={1.2} opacity={0.7} />
        </g>
        <g transform="translate(90 100) rotate(-16)">
          <g className="hero-anim-orbit">
            <ellipse cx={0} cy={0} rx={132} ry={40} fill="none" stroke="#67e8f9" strokeWidth={1.5} strokeDasharray="7 6" opacity={0.75} />
            <path d="M 132 0 L 120 -9 L 122 6 Z" fill="#67e8f9" />
          </g>
        </g>
      </g>

      {/* ---- house: cube + square-based pyramid roof (khối lập phương + khối chóp đáy vuông) ---- */}
      <g transform="translate(450 340)">
        <g className="hero-anim-pyramid">
          <polygon points="-8,20 50,48 50,111 -8,84" fill="url(#cubeFaceB)" stroke="#dbeafe" strokeWidth={1.5} />
          <polygon points="50,48 108,20 108,84 50,111" fill="url(#cubeFaceA)" stroke="#dbeafe" strokeWidth={1.5} />
          <polygon points="-8,20 50,-59 50,48" fill="url(#roofGrad)" stroke="#fff1f2" strokeWidth={1.5} strokeLinejoin="round" />
          <polygon points="50,-59 108,20 50,48" fill="url(#roofGrad)" stroke="#fff1f2" strokeWidth={1.5} strokeLinejoin="round" opacity={0.85} />
        </g>
      </g>

      {/* floating accent sphere */}
      <g className="hero-anim-sphere">
        <circle className="hero-anim-spin" cx={604} cy={36} r={30} fill="url(#sphereGrad2)" />
      </g>
    </svg>
  )
}

function IconCube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2 L18 6 L18 14 L10 18 L2 14 L2 6 Z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M2 6 L10 10 L18 6 M10 10 L10 18" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  )
}
function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M5 3.5 L17 10 L5 16.5 Z" />
    </svg>
  )
}
function Icon2D() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x={3} y={3} width={12} height={12} rx={2} stroke="white" strokeWidth={1.6} />
      <circle cx={15.5} cy={15.5} r={6.5} stroke="white" strokeWidth={1.6} />
    </svg>
  )
}
function Icon3D() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" stroke="white" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M4 7.5 L12 12 L20 7.5 M12 12 V21" stroke="white" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}
function IconPuzzle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M9 4h3.2a1.4 1.4 0 0 1 1.4 1.6 1.6 1.6 0 0 0 3.1.5V6.4A2.4 2.4 0 0 1 19.1 4H20v3.9a2.4 2.4 0 0 1-2.4 2.4h-.3a1.6 1.6 0 0 0-.5 3.1 1.4 1.4 0 0 1-1.6 1.4H12V20H9.9a2.4 2.4 0 0 1-2.4-2.4v-.3a1.6 1.6 0 0 0-3.1-.5H4v-3.2a1.4 1.4 0 0 1 1.6-1.4 1.6 1.6 0 0 0 .5-3.1V9A2.4 2.4 0 0 1 8.5 6.6V6.4A2.4 2.4 0 0 1 9 4Z"
        stroke="white"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconTransform() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M17.6 3.5v3.1h-3.1M6.4 20.5v-3.1h3.1" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
