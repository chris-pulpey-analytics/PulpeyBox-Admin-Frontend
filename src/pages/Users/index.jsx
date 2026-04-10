import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetUsersQuery, exportUsers } from '../../store/api/usersApi'
import ExportButton, { downloadBlob as dl } from '../../components/ui/ExportButton'
import Pagination from '../../components/ui/Pagination'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery, useGetCitiesQuery } from '../../store/api/locationsApi'
import { useGetSurveysQuery } from '../../store/api/surveysApi'
import { Search, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const INIT_FILTERS = {
  // Identificación
  search: '', user_ids: '', emails: '', phones: '', instagram: '',
  // Demográficos
  gender_id: '', marital_status_id: '', role_house_id: '', income_range_id: '',
  profession_id: '', number_children_id: '', level_academic_id: '', frequency_activities_id: '',
  age_min: '', age_max: '',
  // Ubicación
  department_id: '', city_id: '', zone: '',
  // Comportamiento (booleanos)
  is_buy_manager_home: '', is_pregnant: '', is_interested_technology: '',
  is_alcohol_consume: '', is_tobacco_consume: '',
  // Encuesta
  survey_id: '', survey_status_id: '',
  // Fechas
  registered_from: '', registered_to: '',
  last_session_from: '', last_session_to: '',
  profile_updated_from: '',
  // Paginación
  page: 1, page_size: 50,
}

const BoolSelect = ({ value, onChange, label }) => (
  <div>
    <label className="label">{label}</label>
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Cualquiera —</option>
      <option value="true">Sí</option>
      <option value="false">No</option>
    </select>
  </div>
)

const CatalogSelect = ({ value, onChange, label, options }) => (
  <div>
    <label className="label">{label}</label>
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Todos —</option>
      {options.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
    </select>
  </div>
)

export default function UsersPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(INIT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading, isFetching } = useGetUsersQuery(filters)
  const { data: settingsData } = useGetSettingsGroupedQuery()
  const { data: departments } = useGetDepartmentsQuery()
  const { data: citiesData } = useGetCitiesQuery(
    { department_id: filters.department_id },
    { skip: !filters.department_id }
  )
  const { data: surveysData } = useGetSurveysQuery({ page: 1, page_size: 200 }, { skip: !showFilters })

  const grouped = settingsData || []
  const getGroup = (keyword) =>
    grouped.find((g) => g.group_name?.toLowerCase().includes(keyword.toLowerCase()))?.settings || []

  const genders = getGroup('géner') || getGroup('gener')
  const maritalStatuses = getGroup('civil') || getGroup('marital')
  const roleHouses = getGroup('hogar') || getGroup('rol familiar')
  const incomeRanges = getGroup('ingreso') || getGroup('income')
  const professions = getGroup('profesion') || getGroup('profesión')
  const numberChildren = getGroup('hijo') || getGroup('children')
  const levelAcademic = getGroup('academ') || getGroup('nivel')
  const frequencies = getGroup('actividad') || getGroup('frecuencia')
  const surveyStatuses = getGroup('encuesta') || getGroup('survey')

  const cities = citiesData?.data || citiesData || []
  const surveyList = surveysData?.data || []

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }))

  const handleDeptChange = (v) => {
    setFilters((f) => ({ ...f, department_id: v, city_id: '', page: 1 }))
  }

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

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    !['page', 'page_size', 'search'].includes(k) && v !== '' && v !== null && v !== undefined
  ).length

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
            {activeFilterCount > 0 && (
              <span className="bg-violet-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Búsqueda */}
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

      {/* Panel de filtros */}
      {showFilters && (
        <div className="card-sm space-y-5">

          {/* Identificación */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Identificación</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">IDs (coma separados)</label>
                <input className="input" value={filters.user_ids} onChange={(e) => set('user_ids', e.target.value)} placeholder="1,2,3" />
              </div>
              <div>
                <label className="label">Emails</label>
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
            </div>
          </div>

          {/* Demográficos */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Demográficos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Edad mín.</label>
                <input type="number" className="input" value={filters.age_min} onChange={(e) => set('age_min', e.target.value)} placeholder="18" />
              </div>
              <div>
                <label className="label">Edad máx.</label>
                <input type="number" className="input" value={filters.age_max} onChange={(e) => set('age_max', e.target.value)} placeholder="65" />
              </div>
              <CatalogSelect label="Género" value={filters.gender_id} onChange={(v) => set('gender_id', v)} options={genders} />
              <CatalogSelect label="Estado Civil" value={filters.marital_status_id} onChange={(v) => set('marital_status_id', v)} options={maritalStatuses} />
              <CatalogSelect label="Rol Familiar" value={filters.role_house_id} onChange={(v) => set('role_house_id', v)} options={roleHouses} />
              <CatalogSelect label="Rango de Ingreso" value={filters.income_range_id} onChange={(v) => set('income_range_id', v)} options={incomeRanges} />
              <CatalogSelect label="Profesión" value={filters.profession_id} onChange={(v) => set('profession_id', v)} options={professions} />
              <CatalogSelect label="Número de Hijos" value={filters.number_children_id} onChange={(v) => set('number_children_id', v)} options={numberChildren} />
              <CatalogSelect label="Nivel Académico" value={filters.level_academic_id} onChange={(v) => set('level_academic_id', v)} options={levelAcademic} />
              <CatalogSelect label="Frec. Actividad Física" value={filters.frequency_activities_id} onChange={(v) => set('frequency_activities_id', v)} options={frequencies} />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ubicación</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Departamento</label>
                <select className="input" value={filters.department_id} onChange={(e) => handleDeptChange(e.target.value)}>
                  <option value="">— Todos —</option>
                  {(departments?.data || departments || []).map((d) => (
                    <option key={d.Id} value={d.Id}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Municipio</label>
                <select className="input" value={filters.city_id} onChange={(e) => set('city_id', e.target.value)} disabled={!filters.department_id}>
                  <option value="">— Todos —</option>
                  {cities.map((c) => (
                    <option key={c.Id} value={c.Id}>{c.CityName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Zona</label>
                <input type="number" className="input" value={filters.zone} onChange={(e) => set('zone', e.target.value)} placeholder="1" />
              </div>
            </div>
          </div>

          {/* Comportamiento */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Comportamiento y Estilo de Vida</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BoolSelect label="Compras en el Hogar" value={filters.is_buy_manager_home} onChange={(v) => set('is_buy_manager_home', v)} />
              <BoolSelect label="Embarazo" value={filters.is_pregnant} onChange={(v) => set('is_pregnant', v)} />
              <BoolSelect label="Interesado en Tecnología" value={filters.is_interested_technology} onChange={(v) => set('is_interested_technology', v)} />
              <BoolSelect label="Consume Alcohol" value={filters.is_alcohol_consume} onChange={(v) => set('is_alcohol_consume', v)} />
              <BoolSelect label="Consume Nicotina" value={filters.is_tobacco_consume} onChange={(v) => set('is_tobacco_consume', v)} />
            </div>
          </div>

          {/* Encuesta */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Encuesta</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="label">Filtrar por encuesta</label>
                <select className="input" value={filters.survey_id} onChange={(e) => set('survey_id', e.target.value)}>
                  <option value="">— Cualquiera —</option>
                  {surveyList.map((s) => (
                    <option key={s.Id} value={s.Id}>{s.Name}</option>
                  ))}
                </select>
              </div>
              <CatalogSelect label="Estado de encuesta" value={filters.survey_status_id} onChange={(v) => set('survey_status_id', v)} options={surveyStatuses} />
            </div>
          </div>

          {/* Fechas */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Fechas</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div>
                <label className="label">Perfil actualizado desde</label>
                <input type="date" className="input" value={filters.profile_updated_from} onChange={(e) => set('profile_updated_from', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button onClick={() => setFilters(INIT_FILTERS)} className="btn-ghost text-sm">
              Limpiar todos los filtros
            </button>
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
