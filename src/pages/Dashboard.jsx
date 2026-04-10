import { useState } from 'react'
import { useGetMetricsQuery } from '../store/api/metricsApi'
import StatCard from '../components/ui/StatCard'
import { Users, UserCheck, Activity, AlertCircle, TrendingUp, MapPin, GitMerge, UserX, CalendarDays, X } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

const PRESETS = [
  { label: 'Último mes', days: 30 },
  { label: '3 meses', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '1 año', days: 365 },
]

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo

  const { data, isLoading, isFetching } = useGetMetricsQuery(params)

  const applyPreset = (days) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateFrom(toISO(from))
    setDateTo(toISO(to))
  }

  const clearDates = () => {
    setDateFrom('')
    setDateTo('')
  }

  const loading = isLoading || isFetching
  const s = data?.summary || {}

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general de la plataforma Pulpey</p>
        </div>

        {/* Filtros de fecha */}
        <div className="card-sm flex items-center gap-3 flex-wrap">
          <CalendarDays size={15} className="text-slate-400 shrink-0" />
          <div className="flex items-center gap-2">
            <input type="date" className="input text-xs py-1.5 px-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" className="input text-xs py-1.5 px-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p.days)} className="btn-ghost text-xs py-1 px-2">
                {p.label}
              </button>
            ))}
            {(dateFrom || dateTo) && (
              <button onClick={clearDates} className="btn-ghost text-xs py-1 px-2 text-red-400">
                <X size={12} />
              </button>
            )}
          </div>
          {loading && <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total usuarios" value={s.total_users} icon={Users} color="violet" />
        <StatCard title="Nuevos este mes" value={s.new_this_month} icon={TrendingUp} color="emerald" />
        <StatCard title="Activos 30 días" value={s.active_30d} icon={Activity} color="blue" />
        <StatCard title="Con perfil completo" value={s.with_profile} icon={UserCheck} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sin verificar email" value={s.unverified} icon={AlertCircle} color="red" />
        <StatCard title="Registro incompleto" value={s.incomplete} icon={UserX} color="amber" />
        <StatCard title="Migrados" value={s.migrated} icon={GitMerge} color="slate" />
        <StatCard title="Con ubicación" value={s.with_profile} icon={MapPin} color="blue" sub="Aprox. con lat/lng" />
      </div>

      {/* Gráficas fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Registros por período</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthly_registrations || []}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#grad)" strokeWidth={2} dot={false} name="Registros" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Nuevos vs Activos (6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthly_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="nuevos" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Nuevos" />
              <Bar dataKey="activos" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Activos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Género */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Distribución por Género</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.gender_distribution || []}
                cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(data?.gender_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Edad */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Distribución por Edad</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.age_distribution || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departamentos */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Top Departamentos</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data?.department_distribution || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Usuarios" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fila: Profesiones + Estado Civil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Top Profesiones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.profession_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Estado Civil</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data?.marital_distribution || []}
                cx="50%" cy="50%" outerRadius={75} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(data?.marital_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Rango de Ingreso</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.income_distribution || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
