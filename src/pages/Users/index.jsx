import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetUsersQuery } from '../../store/api/usersApi'
import { exportUsers, downloadBlob } from '../../store/api/usersApi'
import ExportButton, { downloadBlob as dl } from '../../components/ui/ExportButton'
import Pagination from '../../components/ui/Pagination'
import { Search, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const INIT_FILTERS = {
  search: '', user_ids: '', emails: '', phones: '', instagram: '',
  age_min: '', age_max: '',
  registered_from: '', registered_to: '',
  last_session_from: '', last_session_to: '',
  page: 1, page_size: 50,
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(INIT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading, isFetching } = useGetUsersQuery(filters)

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }))

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const { page, page_size, ...exportFilters } = filters
      const res = await exportUsers(exportFilters, format)
      dl(res, `usuarios.${format}`)
      toast.success('Descarga iniciada')
    } catch {
      toast.error('Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() ?? '...'} usuarios encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExport={handleExport} loading={exporting} />
          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary">
            <Filter size={15} />
            Filtros
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, correo o teléfono..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="input pl-9 max-w-xl"
        />
      </div>

      {/* Filtros expandibles */}
      {showFilters && (
        <div className="card-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">IDs (separados por coma)</label>
            <input className="input" value={filters.user_ids} onChange={(e) => set('user_ids', e.target.value)} placeholder="1,2,3" />
          </div>
          <div>
            <label className="label">Emails (separados por coma)</label>
            <input className="input" value={filters.emails} onChange={(e) => set('emails', e.target.value)} placeholder="a@b.com,..." />
          </div>
          <div>
            <label className="label">Teléfonos</label>
            <input className="input" value={filters.phones} onChange={(e) => set('phones', e.target.value)} placeholder="55551234,..." />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={filters.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@username" />
          </div>
          <div>
            <label className="label">Edad mín.</label>
            <input type="number" className="input" value={filters.age_min} onChange={(e) => set('age_min', e.target.value)} placeholder="18" />
          </div>
          <div>
            <label className="label">Edad máx.</label>
            <input type="number" className="input" value={filters.age_max} onChange={(e) => set('age_max', e.target.value)} placeholder="65" />
          </div>
          <div>
            <label className="label">Registro desde</label>
            <input type="date" className="input" value={filters.registered_from} onChange={(e) => set('registered_from', e.target.value)} />
          </div>
          <div>
            <label className="label">Registro hasta</label>
            <input type="date" className="input" value={filters.registered_to} onChange={(e) => set('registered_to', e.target.value)} />
          </div>
          <div>
            <label className="label">Última sesión desde</label>
            <input type="date" className="input" value={filters.last_session_from} onChange={(e) => set('last_session_from', e.target.value)} />
          </div>
          <div>
            <label className="label">Última sesión hasta</label>
            <input type="date" className="input" value={filters.last_session_to} onChange={(e) => set('last_session_to', e.target.value)} />
          </div>
          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button onClick={() => setFilters(INIT_FILTERS)} className="btn-ghost text-sm">Limpiar filtros</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['ID', 'Nombre', 'Correo', 'Teléfono', 'Género', 'Departamento', 'Registro', 'Última sesión', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-slate-400">Sin resultados</td></tr>
              ) : (
                data?.data?.map((u) => (
                  <tr key={u.Id} className="table-row">
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{u.Id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{u.Nombre} {u.Apellido}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{u['Correo Electrónico']}</td>
                    <td className="px-4 py-3 text-slate-600">{u.Teléfono}</td>
                    <td className="px-4 py-3">
                      <span className="badge-violet">{u.Género !== '-' ? u.Género : '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.Departamento}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u['Fecha de Registro']}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u['Última Sesión']}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/users/${u.Id}`)} className="btn-ghost btn-sm">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={filters.page} pageSize={filters.page_size} total={data?.total || 0} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>
    </div>
  )
}
