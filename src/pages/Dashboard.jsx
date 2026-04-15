import { useState } from 'react'
import { useGetMetricsQuery } from '../store/api/metricsApi'
import StatCard from '../components/ui/StatCard'
import {
  Users, UserCheck, Activity, AlertCircle, TrendingUp,
  MapPin, GitMerge, UserX, CalendarDays, X,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

const PRESETS = [
  { label: 'Último mes', days: 30 },
  { label: '3 meses',    days: 90 },
  { label: '6 meses',    days: 180 },
  { label: '1 año',      days: 365 },
]

function toISO(d) { return d.toISOString().slice(0, 10) }

/* ─── reusable chart card ──────────────────────────────────── */
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

/* ─── vertical bar chart shorthand ────────────────────────── */
function VBarChart({ data, color = '#7c3aed', yWidth = 130, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={yWidth} />
        <Tooltip formatter={(v) => [v.toLocaleString(), 'Usuarios']} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} name="Usuarios" />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ─── pie chart shorthand ──────────────────────────────────── */
function DemoPie({ data, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%" outerRadius={75} dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [v.toLocaleString(), 'Usuarios']} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const params = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo)   params.date_to   = dateTo

  const { data, isLoading, isFetching } = useGetMetricsQuery(params)

  const applyPreset = (days) => {
    const to   = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateFrom(toISO(from))
    setDateTo(toISO(to))
  }

  const clearDates = () => { setDateFrom(''); setDateTo('') }

  const loading = isLoading || isFetching
  const s = data?.summary || {}

  return (
    <div className="space-y-6">
      {/* ── Header + date filter ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general de la plataforma Pulpey</p>
        </div>

        <div className="card-sm flex items-center gap-3 flex-wrap">
          <CalendarDays size={15} className="text-slate-400 shrink-0" />
          <div className="flex items-center gap-2">
            <input
              type="date" className="input text-xs py-1.5 px-2"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-slate-400 text-xs">—</span>
            <input
              type="date" className="input text-xs py-1.5 px-2"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            />
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
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* ── KPIs row 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total usuarios"     value={s.total_users}    icon={Users}      color="violet" />
        <StatCard title="Nuevos este mes"    value={s.new_this_month} icon={TrendingUp}  color="emerald" />
        <StatCard title="Activos 30 días"    value={s.active_30d}     icon={Activity}    color="blue" />
        <StatCard title="Con perfil completo" value={s.with_profile}   icon={UserCheck}   color="amber" />
      </div>

      {/* ── KPIs row 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sin verificar email"  value={s.unverified}     icon={AlertCircle} color="red" />
        <StatCard title="Registro incompleto"  value={s.incomplete}     icon={UserX}       color="amber" />
        <StatCard title="Migrados"             value={s.migrated}       icon={GitMerge}    color="slate" />
        <StatCard title="Con ubicación"        value={s.with_location}  icon={MapPin}      color="blue" />
      </div>

      {/* ── Registros + Comparativa ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Registros por período">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthly_registrations || []}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v.toLocaleString(), 'Registros']} />
              <Area
                type="monotone" dataKey="value" stroke="#7c3aed"
                fill="url(#grad)" strokeWidth={2} dot={false} name="Registros"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Nuevos vs Activos (6 meses)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthly_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="nuevos"  fill="#7c3aed" radius={[4, 4, 0, 0]} name="Nuevos" />
              <Bar dataKey="activos" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Activos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Género + Edad ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Distribución por Género">
          <DemoPie data={data?.gender_distribution || []} height={220} />
        </ChartCard>

        <ChartCard title="Distribución por Edad">
          <VBarChart data={data?.age_distribution || []} color="#7c3aed" yWidth={55} height={220} />
        </ChartCard>
      </div>

      {/* ── Departamentos (full width) ── */}
      <ChartCard title="Top Departamentos">
        <VBarChart data={data?.department_distribution || []} color="#06b6d4" yWidth={140} height={260} />
      </ChartCard>

      {/* ── Profesiones + Estado Civil ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Profesiones">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.profession_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v.toLocaleString(), 'Usuarios']} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estado Civil">
          <DemoPie data={data?.marital_distribution || []} height={220} />
        </ChartCard>
      </div>

      {/* ── Ingreso + Hijos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Rango de Ingreso">
          <VBarChart data={data?.income_distribution || []} color="#f59e0b" yWidth={140} height={220} />
        </ChartCard>

        <ChartCard title="Número de Hijos">
          <VBarChart data={data?.children_distribution || []} color="#8b5cf6" yWidth={100} height={220} />
        </ChartCard>
      </div>

      {/* ── Nivel Académico + Rol en el Hogar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Nivel Académico">
          <VBarChart data={data?.level_academic_distribution || []} color="#14b8a6" yWidth={150} height={220} />
        </ChartCard>

        <ChartCard title="Rol en el Hogar">
          <DemoPie data={data?.role_house_distribution || []} height={220} />
        </ChartCard>
      </div>

      {/* ── Frecuencia de Actividades ── */}
      <ChartCard title="Frecuencia de Actividades Físicas">
        <VBarChart data={data?.frequency_distribution || []} color="#ec4899" yWidth={160} height={200} />
      </ChartCard>
    </div>
  )
}
