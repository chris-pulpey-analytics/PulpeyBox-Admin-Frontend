import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCreateNewsMutation, useUpdateNewsMutation, useGetNewsItemQuery,
  usePreviewUsersForNewsQuery, useAssignNewsUsersMutation,
  assignUsersExcelToNews, downloadNewsAssignTemplate, downloadBlob,
} from '../../store/api/newsApi'
import { useGetSurveysQuery } from '../../store/api/surveysApi'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery } from '../../store/api/locationsApi'
import {
  ArrowLeft, Save, List, FileEdit, Users, Check,
  Upload, FileSpreadsheet, Download, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  title: '', description: '', code: '', image_url: '',
  action_url: '', action_text: '', expiration_date: '', default: false,
  linked_survey_id: '', link_types_id: '', banners_types_id: ''
}

const TABS = [
  { id: 'form',   label: 'Editar',           Icon: FileEdit },
  { id: 'users',  label: 'Usuarios',          Icon: List },
  { id: 'assign', label: 'Asignar Usuarios',  Icon: Users },
]

export default function NewsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing } = useGetNewsItemQuery(id, { skip: !isEdit })
  const { data: surveysData } = useGetSurveysQuery({ page: 1, page_size: 100 })

  const { data: linkTypesData } = useGetSettingsGroupedQuery({ group_name: 'LinkTypes' })
  const { data: bannersData }   = useGetSettingsGroupedQuery({ group_name: 'Banners' })
  const { data: settingsData }  = useGetSettingsGroupedQuery()
  const { data: departments }   = useGetDepartmentsQuery()

  const [createNews, { isLoading: creating }] = useCreateNewsMutation()
  const [updateNews, { isLoading: updating }] = useUpdateNewsMutation()
  const [assignNewsUsers] = useAssignNewsUsersMutation()

  const grouped = settingsData || []
  const getGroup = (kw) =>
    grouped.find((g) => g.group_name?.toLowerCase().includes(kw.toLowerCase()))?.settings || []
  const genders      = getGroup('Gender')
  const professions  = getGroup('Profession')
  const incomeRanges = getGroup('IncomeRange')

  const linkTypes     = linkTypesData?.[0]?.settings || []
  const allBannerTypes = bannersData ? bannersData.flatMap((g) => g.settings) : []

  const [form, setForm] = useState(EMPTY)
  const [activeTab, setActiveTab] = useState('form')

  // ── Filter-based assignment ──────────────────────────────────────
  const [assignFilters, setAssignFilters] = useState({
    gender_id: '', profession_id: '', income_range_id: '', department_id: '',
    age_min: '', age_max: '',
    is_buy_manager_home: '', is_pregnant: '', is_interested_technology: '',
    is_alcohol_consume: '', is_tobacco_consume: '',
  })
  const [skipPreview, setSkipPreview] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const activeAssignFilters = Object.fromEntries(
    Object.entries({ newsId: id, ...assignFilters }).filter(([, v]) => v !== '' && v !== null)
  )
  const { data: preview } = usePreviewUsersForNewsQuery(activeAssignFilters, { skip: skipPreview || !isEdit })

  // ── Excel upload ─────────────────────────────────────────────────
  const excelInputRef = useRef(null)
  const [excelFile, setExcelFile] = useState(null)
  const [excelLoading, setExcelLoading] = useState(false)
  const [excelResult, setExcelResult] = useState(null)

  useEffect(() => {
    if (existing?.news) {
      const n = existing.news
      setForm({
        title: n.Title || '',
        description: n.Description || '',
        code: n.Code || '',
        image_url: n.ImageUrl || '',
        action_url: n.ActionUrl || '',
        action_text: n.ActionText || '',
        expiration_date: n.ExpirationDate ? n.ExpirationDate.split('T')[0] : '',
        default: n.Default || false,
        linked_survey_id: '',
        link_types_id: n.LinkTypesId || '',
        banners_types_id: n.BannersTypesId || ''
      })
    }
  }, [existing])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSurveyLink = (surveyId) => {
    set('linked_survey_id', surveyId)
    if (surveyId) {
      const survey = surveysData?.data?.find((s) => String(s.Id) === String(surveyId))
      if (survey?.SurveyUrl) set('action_url', survey.SurveyUrl)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { linked_survey_id, ...payload } = form
    const body = {
      ...payload,
      expiration_date: payload.expiration_date || null,
      link_types_id: payload.link_types_id ? Number(payload.link_types_id) : null,
      banners_types_id: payload.banners_types_id ? Number(payload.banners_types_id) : null,
    }
    try {
      if (isEdit) {
        await updateNews({ id: Number(id), ...body }).unwrap()
        toast.success('Actualizado')
      } else {
        await createNews(body).unwrap()
        toast.success('Creado')
      }
      navigate('/news')
    } catch { toast.error('Error al guardar') }
  }

  const handleAssign = async () => {
    if (!preview?.total) { toast.error('No hay usuarios para asignar'); return }
    if (!confirm(`¿Asignar esta noticia a ${preview.total} usuarios?`)) return
    setAssigning(true)
    try {
      const userIds = preview.sample.map((u) => u.Id)
      if (preview.total > userIds.length) {
        toast(`⚠️ Solo se asignarán ${userIds.length} de ${preview.total} (límite de muestra)`)
      }
      const res = await assignNewsUsers({ newsId: Number(id), user_ids: userIds, status: 0 }).unwrap()
      toast.success(`${res.assigned} asignados, ${res.skipped} ya tenían la noticia`)
    } catch { toast.error('Error al asignar') } finally { setAssigning(false) }
  }

  const users = existing?.users || []

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar noticia' : 'Nueva noticia/promoción'}</h1>
      </div>

      {isEdit && (
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map(({ id: tid, label, Icon }) => (
            <button
              key={tid}
              onClick={() => setActiveTab(tid)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tid
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} /> {label}
              {tid === 'users' && users.length > 0 && (
                <span className="bg-violet-100 text-violet-700 text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{users.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab Editar ── */}
      {(activeTab === 'form' || !isEdit) && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="label">Título *</label>
              <input required className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="¡Oferta especial!" />
            </div>
            <div>
              <label className="label">Código</label>
              <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="PROMO-2025" />
            </div>
            <div>
              <label className="label">Expiración</label>
              <input type="date" className="input" value={form.expiration_date} onChange={(e) => set('expiration_date', e.target.value)} />
            </div>

            <div>
              <label className="label">Tipo de Enlace (Link Type)</label>
              <select className="input" value={form.link_types_id} onChange={(e) => set('link_types_id', e.target.value)}>
                <option value="">Seleccione un tipo de enlace</option>
                {linkTypes.map((t) => <option key={t.Id} value={t.Id}>{t.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de Banner *</label>
              <select required className="input" value={form.banners_types_id} onChange={(e) => set('banners_types_id', e.target.value)}>
                <option value="">Seleccione un tipo de banner</option>
                {allBannerTypes.map((b) => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="label">Descripción *</label>
              <textarea required className="input resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="label">URL de imagen</label>
              <input className="input" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." />
            </div>

            <div className="col-span-1 md:col-span-2 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <label className="label text-violet-700">Vincular a encuesta (opcional)</label>
              <select className="input" value={form.linked_survey_id} onChange={(e) => handleSurveyLink(e.target.value)}>
                <option value="">— Sin encuesta —</option>
                {surveysData?.data?.map((s) => <option key={s.Id} value={s.Id}>{s.Code || '—'} - {s.Name}</option>)}
              </select>
              <p className="text-xs text-violet-500 mt-1.5">Al seleccionar una encuesta, la URL de acción se completará automáticamente.</p>
            </div>

            <div>
              <label className="label">URL de acción</label>
              <input className="input" value={form.action_url} onChange={(e) => set('action_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Texto del botón</label>
              <input className="input" value={form.action_text} onChange={(e) => set('action_text', e.target.value)} placeholder="¡Participar!" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.default} onChange={(e) => set('default', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                <span className="text-sm text-slate-700 font-medium">Noticia por defecto</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creating || updating} className="btn-primary">
              <Save size={15} /> {creating || updating ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* ── Tab Usuarios ── */}
      {activeTab === 'users' && isEdit && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Usuarios asignados <span className="text-slate-400 font-normal">({users.length})</span></p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Nombre', 'Email', 'Clicks', 'Estado', 'Edad', 'Género', 'Ciudad', 'Departamento', 'Último click'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-16 text-slate-400">Sin usuarios asignados</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.Id} className="table-row">
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{u.Id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{u.Name} {u.LastName}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{u.Email}</td>
                      <td className="px-4 py-3 text-center">
                        {u.ClickCount > 0
                          ? <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{u.ClickCount}</span>
                          : <span className="text-slate-300">0</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.Status ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-center">{u.edad !== '-' ? u.edad : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.genero !== '-' ? u.genero : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.ciudad !== '-' ? u.ciudad : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.departamento !== '-' ? u.departamento : '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {u.LastClickDate ? new Date(u.LastClickDate).toLocaleDateString('es-GT') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Asignar Usuarios ── */}
      {activeTab === 'assign' && isEdit && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Filtrar usuarios a asignar</h3>
            <p className="text-xs text-slate-500">Solo se incluirán usuarios que <strong>aún no tienen</strong> esta noticia asignada y cumplen los filtros seleccionados.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Género</label>
                <select className="input" value={assignFilters.gender_id} onChange={(e) => setAssignFilters((f) => ({ ...f, gender_id: e.target.value }))}>
                  <option value="">Todos</option>
                  {genders.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Profesión</label>
                <select className="input" value={assignFilters.profession_id} onChange={(e) => setAssignFilters((f) => ({ ...f, profession_id: e.target.value }))}>
                  <option value="">Todos</option>
                  {professions.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Rango de Ingreso</label>
                <select className="input" value={assignFilters.income_range_id} onChange={(e) => setAssignFilters((f) => ({ ...f, income_range_id: e.target.value }))}>
                  <option value="">Todos</option>
                  {incomeRanges.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Departamento</label>
                <select className="input" value={assignFilters.department_id} onChange={(e) => setAssignFilters((f) => ({ ...f, department_id: e.target.value }))}>
                  <option value="">Todos</option>
                  {(departments?.data || departments || []).map((d) => <option key={d.Id} value={d.Id}>{d.DepartmentName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Edad mín.</label>
                <input type="number" className="input" value={assignFilters.age_min} onChange={(e) => setAssignFilters((f) => ({ ...f, age_min: e.target.value }))} placeholder="18" />
              </div>
              <div>
                <label className="label">Edad máx.</label>
                <input type="number" className="input" value={assignFilters.age_max} onChange={(e) => setAssignFilters((f) => ({ ...f, age_max: e.target.value }))} placeholder="65" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-slate-100 pt-3">
              {[
                ['is_buy_manager_home', 'Compras Hogar'],
                ['is_pregnant', 'Embarazo'],
                ['is_interested_technology', 'Tecnología'],
                ['is_alcohol_consume', 'Alcohol'],
                ['is_tobacco_consume', 'Nicotina'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <select className="input" value={assignFilters[key]} onChange={(e) => setAssignFilters((f) => ({ ...f, [key]: e.target.value }))}>
                    <option value="">Cualquiera</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-3 border-t border-slate-100 pt-3">
              <button onClick={() => setSkipPreview(false)} className="btn-secondary">
                <Users size={15} /> Previsualizar
              </button>
            </div>
          </div>

          {/* Preview resultado */}
          {!skipPreview && preview && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-2xl text-violet-600 font-bold">{preview.total}</span> usuarios elegibles
                  </p>
                  <p className="text-xs text-slate-400">No tienen esta noticia y cumplen los filtros</p>
                </div>
                <button onClick={handleAssign} disabled={assigning || !preview.total} className="btn-primary">
                  {assigning
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Asignando...</>
                    : <><Check size={15} />Asignar {preview.total} usuarios</>}
                </button>
              </div>
              {preview.sample?.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto border-t border-slate-100 pt-2">
                  {preview.sample.map((u) => (
                    <div key={u.Id} className="flex items-center gap-2 text-xs py-1">
                      <span className="font-mono text-slate-400 w-10 shrink-0">{u.Id}</span>
                      <span className="text-slate-700 flex-1">{u.full_name?.trim()}</span>
                      <span className="text-slate-400 truncate max-w-[160px]">{u.Email}</span>
                    </div>
                  ))}
                  {preview.total > preview.sample.length && (
                    <p className="text-xs text-slate-400 text-center pt-1">+{preview.total - preview.sample.length} más no mostrados</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Excel upload */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Asignar por Excel</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sube un archivo con una columna <code className="bg-slate-100 px-1 rounded">user_id</code> para asignar usuarios en bloque.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await downloadNewsAssignTemplate()
                    await downloadBlob(res, 'plantilla_asignar_usuarios.xlsx')
                  } catch { toast.error('Error al descargar plantilla') }
                }}
                className="btn-ghost text-xs gap-1.5 shrink-0"
              >
                <Download size={13} /> Descargar plantilla
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div
                onClick={() => excelInputRef.current?.click()}
                className="flex-1 flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-violet-300 hover:bg-slate-50 transition-colors"
              >
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { setExcelFile(e.target.files[0] || null); setExcelResult(null) }}
                />
                {excelFile ? (
                  <>
                    <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{excelFile.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{(excelFile.size / 1024).toFixed(1)} KB</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-slate-300 shrink-0" />
                    <span className="text-sm text-slate-400">Selecciona un .xlsx o .xls</span>
                  </>
                )}
              </div>
            </div>

            {excelResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-600 font-semibold">✓ {excelResult.assigned} asignados</span>
                  <span className="text-slate-500">{excelResult.skipped} ya asignados (omitidos)</span>
                  {excelResult.errors.length > 0 && (
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={14} /> {excelResult.errors.length} errores
                    </span>
                  )}
                </div>
                {excelResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-red-100 rounded-lg bg-red-50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-red-100">
                          <th className="text-left px-3 py-1.5 text-red-700 font-semibold">Fila</th>
                          <th className="text-left px-3 py-1.5 text-red-700 font-semibold">user_id</th>
                          <th className="text-left px-3 py-1.5 text-red-700 font-semibold">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelResult.errors.map((err, i) => (
                          <tr key={i} className="border-b border-red-50">
                            <td className="px-3 py-1 text-red-600 font-mono">{err.row ?? '—'}</td>
                            <td className="px-3 py-1 text-red-600 font-mono">{err.user_id}</td>
                            <td className="px-3 py-1 text-red-700">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <button
              disabled={!excelFile || excelLoading}
              onClick={async () => {
                setExcelLoading(true)
                setExcelResult(null)
                try {
                  const res = await assignUsersExcelToNews(Number(id), excelFile)
                  if (!res.ok) {
                    const err = await res.json()
                    toast.error(err.detail || 'Error al procesar el archivo')
                    return
                  }
                  const data = await res.json()
                  setExcelResult(data)
                  toast.success(`${data.assigned} asignados, ${data.skipped} omitidos${data.errors.length ? `, ${data.errors.length} errores` : ''}`)
                } catch { toast.error('Error de conexión') } finally { setExcelLoading(false) }
              }}
              className="btn-primary gap-2"
            >
              {excelLoading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando...</>
                : <><Users size={15} /> Asignar desde Excel</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
