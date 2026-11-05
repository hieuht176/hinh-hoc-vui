import type { ReactNode } from 'react'

/** Class for an interactive SVG that should fill its stage at any screen size. */
export const STAGE_SVG = 'block h-auto w-full max-h-[72vh] touch-none select-none'

/**
 * Shared layout for every learning screen: the picture is big and comes first (≈60% width on a laptop / projector,
 * full width on top on a tablet or phone); the controls and text sit in a slimmer column beside it.
 */
export default function StudyLayout({ visual, side }: { visual: ReactNode; side: ReactNode }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20">{visual}</div>
      <div className="space-y-3">{side}</div>
    </div>
  )
}

/** White card that frames the main picture, with an optional one-line hint underneath. */
export function Stage({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <>
      <div className="w-full rounded-3xl border border-indigo-100 bg-white p-2 shadow-sm sm:p-3">{children}</div>
      {hint && <p className="text-center text-sm text-slate-500">{hint}</p>}
    </>
  )
}

/** Small side-panel card. */
export function Panel({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm ${className}`}>
      {title && <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">{title}</div>}
      {children}
    </div>
  )
}

/** Collapsible section for longer explanations, so the side panel stays short and tidy. */
export function Fold({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-indigo-600 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </details>
  )
}
