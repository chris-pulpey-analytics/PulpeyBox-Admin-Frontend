/**
 * Generic Loader components for consistent UX across the app.
 *
 * Usage:
 *   <FullPageLoader message="Generando reporte..." submessage="Esto puede tardar unos segundos" />
 *   <SectionLoader message="Cargando usuarios..." />
 *   <InlineLoader />  — inside buttons or small spaces
 */

/**
 * Full-page overlay loader — use for long operations:
 * report generation, bulk exports, heavy mutations.
 */
export function FullPageLoader({ message = 'Procesando...', submessage }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full mx-4">
        {/* Double ring spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin" />
          <div
            className="absolute inset-[5px] rounded-full border-4 border-t-violet-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-violet-600 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-slate-700 font-semibold text-sm">{message}</p>
          {submessage && (
            <p className="text-slate-400 text-xs leading-relaxed">{submessage}</p>
          )}
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-violet-300 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}

/**
 * Section loader — for page sections, card bodies, table placeholders.
 */
export function SectionLoader({ message, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-violet-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-t-violet-600 animate-spin" />
      </div>
      {message && <p className="text-slate-400 text-sm">{message}</p>}
    </div>
  )
}

/**
 * Inline loader — tiny spinner for buttons or small inline spaces.
 * size: 'sm' | 'md' | 'lg'
 */
export function InlineLoader({ size = 'md' }) {
  const cls =
    size === 'sm'
      ? 'w-3.5 h-3.5 border-[1.5px]'
      : size === 'lg'
      ? 'w-5 h-5 border-2'
      : 'w-4 h-4 border-2'
  return (
    <div
      className={`${cls} border-violet-200 border-t-violet-600 rounded-full animate-spin shrink-0`}
    />
  )
}
