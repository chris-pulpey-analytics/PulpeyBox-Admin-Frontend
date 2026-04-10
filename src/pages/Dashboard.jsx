import { useGetMetricsQuery } from '../store/api/metricsApi'
import StatCard from '../components/ui/StatCard'
import {
  Users, UserCheck, Activity, AlertCircle, TrendingUp, MapPin, GitMerge, UserX
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

export default function Dashboard() {
  const { data, isLoading } = useGetMetricsQuery()

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = data?.summary || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resumen general de la plataforma Pulpey</p>
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

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registros mensuales */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Registros últimos 12 meses</h3>
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
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Comparativa nuevos vs activos */}
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
              <Pie data={data?.gender_distribution || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(data?.gender_distribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
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

        {/* Departamentos */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Top Departamentos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.department_distribution || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profesiones */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Top Profesiones</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data?.profession_distribution || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Usuarios" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
