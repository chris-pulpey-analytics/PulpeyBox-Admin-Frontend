export default function StatCard({ title, value, sub, icon: Icon, color = 'violet', trend }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value?.toLocaleString() ?? '-'}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}% vs mes anterior
          </p>
        )}
      </div>
    </div>
  )
}
