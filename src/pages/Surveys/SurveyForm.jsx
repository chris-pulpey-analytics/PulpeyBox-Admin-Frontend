import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRef } from 'react'
import {
  useCreateSurveyMutation, useUpdateSurveyMutation, useGetSurveyQuery,
  useGetSurveyQuestionsQuery, useCreateSurveyQuestionMutation,
  useUpdateSurveyQuestionMutation, useDeleteSurveyQuestionMutation,
  useGetSurveyAnswersQuery, useCreateSurveyAnswerMutation,
  useUpdateSurveyAnswerMutation, useDeleteSurveyAnswerMutation,
  usePreviewUsersForSurveyQuery, useAssignUsersToSurveyMutation,
  useGetCategoriesQuery,
  downloadSurveyAssignTemplate, assignUsersExcelToSurvey, downloadBlob,
} from '../../store/api/surveysApi'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery } from '../../store/api/locationsApi'
import { ArrowLeft, Save, Plus, Pencil, Trash2, Users, Check, Upload, FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  name: '', code: '', title: '', description: '', survey_url: '',
  expiration_date: '', default: false,
  status_id: '', type_survey_id: '', category_id: '',
}

const TABS = [
  { id: 'info', label: 'Información' },
  { id: 'questions', label: 'Preguntas' },
  { id: 'answers', label: 'Opciones de Respuesta' },
  { id: 'assign', label: 'Asignar Usuarios' },
]

export default function SurveyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing } = useGetSurveyQuery(id, { skip: !isEdit })
  const [createSurvey, { isLoading: creating }] = useCreateSurveyMutation()
  const [updateSurvey, { isLoading: updating }] = useUpdateSurveyMutation()

  const { data: questions = [] } = useGetSurveyQuestionsQuery(id, { skip: !isEdit })
  const [createQuestion] = useCreateSurveyQuestionMutation()
  const [updateQuestion] = useUpdateSurveyQuestionMutation()
  const [deleteQuestion] = useDeleteSurveyQuestionMutation()

  const { data: answers = [] } = useGetSurveyAnswersQuery(id, { skip: !isEdit })
  const [createAnswer] = useCreateSurveyAnswerMutation()
  const [updateAnswer] = useUpdateSurveyAnswerMutation()
  const [deleteAnswer] = useDeleteSurveyAnswerMutation()

  const [assignUsers] = useAssignUsersToSurveyMutation()

  const { data: settingsData } = useGetSettingsGroupedQuery()
  const { data: departments } = useGetDepartmentsQuery()

  const grouped = settingsData || []
  const getGroup = (kw) =>
    grouped.find((g) => g.group_name?.toLowerCase().includes(kw.toLowerCase()))?.settings || []
  const genders       = getGroup('Gender')
  const professions   = getGroup('Profession')
  const incomeRanges  = getGroup('IncomeRange')
  const surveyStatuses = getGroup('SurveyStatus')
  const surveyTypes    = getGroup('TypeSurvey')

  const { data: categoriesData } = useGetCategoriesQuery()
  const surveyCategories = categoriesData || []

  const [tab, setTab] = useState('info')
  const [form, setForm] = useState(EMPTY)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const [editingQ, setEditingQ] = useState(null)
  const [newQText, setNewQText] = useState('')
  const [editingA, setEditingA] = useState(null)
  const [newAText, setNewAText] = useState('')

  const [assignFilters, setAssignFilters] = useState({
    gender_id: '', profession_id: '', income_range_id: '', department_id: '',
    age_min: '', age_max: '',
    is_buy_manager_home: '', is_pregnant: '', is_interested_technology: '',
    is_alcohol_consume: '', is_tobacco_consume: '',
  })
  const [assignStatusId, setAssignStatusId] = useState(146)
  const [skipPreview, setSkipPreview] = useState(true)
  const [assigning, setAssigning] = useState(false)

  // Excel upload state
  const excelInputRef = useRef(null)
  const [excelFile, setExcelFile] = useState(null)
  const [excelStatusId, setExcelStatusId] = useState(146)
  const [excelLoading, setExcelLoading] = useState(false)
  const [excelResult, setExcelResult] = useState(null) // { assigned, skipped, errors }

  const activeAssignFilters = Object.fromEntries(
    Object.entries({ surveyId: id, ...assignFilters }).filter(([, v]) => v !== '' && v !== null)
  )
  const { data: preview } = usePreviewUsersForSurveyQuery(activeAssignFilters, { skip: skipPreview || !isEdit })

  useEffect(() => {
    if (existing?.survey) {
      const s = existing.survey
      setForm({
        name: s.Name || '', code: s.Code || '', title: s.Title || '',
        description: s.Description || '', survey_url: s.SurveyUrl || '',
        expiration_date: s.ExpirationDate ? s.ExpirationDate.split('T')[0] : '',
        default: s.Default || false,
        status_id: s.StatusId || '',
        type_survey_id: s.TypeSurveyId || '',
        category_id: s.CategoryId || '',
      })
    }
  }, [existing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      expiration_date:  form.expiration_date  || null,
      status_id:        form.status_id        ? Number(form.status_id)       : null,
      type_survey_id:   form.type_survey_id   ? Number(form.type_survey_id)  : null,
      category_id:      form.category_id      ? Number(form.category_id)     : null,
    }
    try {
      if (isEdit) {
        await updateSurvey({ id: Number(id), ...payload }).unwrap()
        toast.success('Encuesta actualizada')
      } else {
        const res = await createSurvey(payload).unwrap()
        toast.success('Encuesta creada — ahora puedes agregar preguntas y respuestas')
        navigate(`/surveys/${res.id}/edit`)
      }
    } catch { toast.error('Error al guardar') }
  }

  // Question handlers
  const handleAddQuestion = async () => {
    if (!newQText.trim()) return
    try {
      await createQuestion({ surveyId: Number(id), product_name: newQText.trim() }).unwrap()
      setNewQText('')
      toast.success('Pregunta agregada')
    } catch { toast.error('Error al agregar pregunta') }
  }

  const handleUpdateQuestion = async (q) => {
    if (!editingQ?.text?.trim()) return
    try {
      await updateQuestion({ surveyId: Number(id), qId: q.Id, product_name: editingQ.text }).unwrap()
      setEditingQ(null)
    } catch { toast.error('Error al actualizar') }
  }

  const handleDeleteQuestion = async (q) => {
    if (!confirm(`¿Eliminar "${q.ProductName}"?`)) return
    try { await deleteQuestion({ surveyId: Number(id), qId: q.Id }).unwrap() }
    catch { toast.error('Error al eliminar') }
  }

  // Answer handlers
  const handleAddAnswer = async () => {
    if (!newAText.trim()) return
    try {
      await createAnswer({ surveyId: Number(id), answer: newAText.trim() }).unwrap()
      setNewAText('')
      toast.success('Opción agregada')
    } catch { toast.error('Error al agregar opción') }
  }

  const handleUpdateAnswer = async (a) => {
    if (!editingA?.text?.trim()) return
    try {
      await updateAnswer({ surveyId: Number(id), aId: a.Id, answer: editingA.text }).unwrap()
      setEditingA(null)
    } catch { toast.error('Error al actualizar') }
  }

  const handleDeleteAnswer = async (a) => {
    if (!confirm(`¿Eliminar "${a.Answer}"?`)) return
    try { await deleteAnswer({ surveyId: Number(id), aId: a.Id }).unwrap() }
    catch { toast.error('Error al eliminar') }
  }

  // Assignment
  const handleAssign = async () => {
    if (!preview?.total) { toast.error('No hay usuarios para asignar'); return }
    if (!confirm(`¿Asignar esta encuesta a ${preview.total} usuarios?`)) return
    setAssigning(true)
    try {
      const userIds = preview.sample.map((u) => u.Id)
      if (preview.total > userIds.length) {
        toast(`⚠️ Solo se asignarán ${userIds.length} de ${preview.total} (límite de muestra)`)
      }
      const res = await assignUsers({ surveyId: Number(id), user_ids: userIds, status_id: Number(assignStatusId) }).unwrap()
      toast.success(`${res.assigned} asignados, ${res.skipped} ya tenían la encuesta`)
    } catch { toast.error('Error al asignar') } finally { setAssigning(false) }
  }

  const loading = creating || updating

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar encuesta' : 'Nueva encuesta'}</h1>
      </div>

      {isEdit && (
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Información ── */}
      {(tab === 'info' || !isEdit) && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Código</label>
              <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="ENC-001" />
            </div>
            <div>
              <label className="label">Fecha de expiración</label>
              <input type="date" className="input" value={form.expiration_date} onChange={(e) => set('expiration_date', e.target.value)} />
            </div>

            {/* ── Campos de catálogo ── */}
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status_id} onChange={(e) => set('status_id', e.target.value)}>
                <option value="">— Sin estado —</option>
                {surveyStatuses.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de encuesta</label>
              <select className="input" value={form.type_survey_id} onChange={(e) => set('type_survey_id', e.target.value)}>
                <option value="">— Sin tipo —</option>
                {surveyTypes.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Categoría</label>
              <select className="input" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">— Sin categoría —</option>
                {surveyCategories.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Título</label>
              <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">URL de la encuesta</label>
              <input className="input" value={form.survey_url} onChange={(e) => set('survey_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.default} onChange={(e) => set('default', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
                <span className="text-sm text-slate-700 font-medium">Encuesta por defecto</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              <Save size={15} />
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear encuesta'}
            </button>
          </div>
        </form>
      )}

      {/* ── Preguntas ── */}
      {tab === 'questions' && isEdit && (
        <div className="card space-y-4">
          <p className="text-xs text-slate-500">Preguntas almacenadas en <code>ProductsSurvey</code>. Las respuestas del usuario referencian el ID de cada pregunta.</p>
          <div className="flex gap-2">
            <input className="input flex-1" value={newQText} onChange={(e) => setNewQText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuestion())}
              placeholder="Texto de la pregunta..." />
            <button onClick={handleAddQuestion} disabled={!newQText.trim()} className="btn-primary"><Plus size={15} /> Agregar</button>
          </div>
          {questions.length === 0
            ? <p className="text-center text-slate-400 py-8">Sin preguntas aún. Agrega la primera.</p>
            : <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.Id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{idx + 1}</span>
                    {editingQ?.id === q.Id ? (
                      <>
                        <input className="input flex-1 py-1.5" value={editingQ.text}
                          onChange={(e) => setEditingQ({ ...editingQ, text: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateQuestion(q)} autoFocus />
                        <button onClick={() => handleUpdateQuestion(q)} className="btn-ghost btn-sm text-emerald-600"><Check size={14} /></button>
                        <button onClick={() => setEditingQ(null)} className="btn-ghost btn-sm text-slate-400">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-800">{q.ProductName}</span>
                        <span className="text-xs text-slate-400 font-mono">ID:{q.Id}</span>
                        <button onClick={() => setEditingQ({ id: q.Id, text: q.ProductName })} className="btn-ghost btn-sm"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteQuestion(q)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Opciones de Respuesta ── */}
      {tab === 'answers' && isEdit && (
        <div className="card space-y-4">
          <p className="text-xs text-slate-500">Opciones de respuesta en <code>AnswersSurveys</code>. Aplican a todas las preguntas de esta encuesta.</p>
          <div className="flex gap-2">
            <input className="input flex-1" value={newAText} onChange={(e) => setNewAText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAnswer())}
              placeholder="Ej: Frecuentemente, Ocasionalmente, Nunca..." />
            <button onClick={handleAddAnswer} disabled={!newAText.trim()} className="btn-primary"><Plus size={15} /> Agregar</button>
          </div>
          {answers.length === 0
            ? <p className="text-center text-slate-400 py-8">Sin opciones aún.</p>
            : <div className="space-y-2">
                {answers.map((a, idx) => (
                  <div key={a.Id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{idx + 1}</span>
                    {editingA?.id === a.Id ? (
                      <>
                        <input className="input flex-1 py-1.5" value={editingA.text}
                          onChange={(e) => setEditingA({ ...editingA, text: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateAnswer(a)} autoFocus />
                        <button onClick={() => handleUpdateAnswer(a)} className="btn-ghost btn-sm text-emerald-600"><Check size={14} /></button>
                        <button onClick={() => setEditingA(null)} className="btn-ghost btn-sm text-slate-400">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-800">{a.Answer}</span>
                        <span className="text-xs text-slate-400 font-mono">ID:{a.Id}</span>
                        <button onClick={() => setEditingA({ id: a.Id, text: a.Answer })} className="btn-ghost btn-sm"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteAnswer(a)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Asignar Usuarios ── */}
      {tab === 'assign' && isEdit && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Filtrar usuarios a asignar</h3>
            <p className="text-xs text-slate-500">Solo se incluirán usuarios que <strong>aún no tienen</strong> esta encuesta asignada y cumplen los filtros seleccionados.</p>
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
              {[['is_buy_manager_home','Compras Hogar'],['is_pregnant','Embarazo'],['is_interested_technology','Tecnología'],['is_alcohol_consume','Alcohol'],['is_tobacco_consume','Nicotina']].map(([key, label]) => (
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
              <div>
                <label className="label">Estado a asignar</label>
                <select className="input" value={assignStatusId} onChange={(e) => setAssignStatusId(e.target.value)}>
                  {surveyStatuses.length > 0
                    ? surveyStatuses.map((s) => <option key={s.Id} value={s.Id}>{s.Name}</option>)
                    : <option value={146}>Pendiente (146)</option>}
                </select>
              </div>
              <button onClick={() => { setSkipPreview(false) }} className="btn-secondary">
                <Users size={15} /> Previsualizar
              </button>
            </div>
          </div>

          {!skipPreview && preview && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-2xl text-violet-600 font-bold">{preview.total}</span> usuarios elegibles
                  </p>
                  <p className="text-xs text-slate-400">No tienen esta encuesta y cumplen los filtros</p>
                </div>
                <button onClick={handleAssign} disabled={assigning || !preview.total} className="btn-primary">
                  {assigning
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Asignando...</>
                    : <><Check size={15} />Asignar {preview.total} usuarios</>
                  }
                </button>
              </div>
              {preview.sample?.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto border-t border-slate-100 pt-2">
                  {preview.sample.map((u) => (
                    <div key={u.Id} className="flex items-center gap-2 text-xs py-1">
                      <span className="font-mono text-slate-400 w-10 shrink-0">{u.Id}</span>
                      <span className="text-slate-700 flex-1">{u.full_name?.trim()}</span>
                      <span className="text-slate-400 truncate max-w-[160px]">{u.email}</span>
                    </div>
                  ))}
                  {preview.total > preview.sample.length && (
                    <p className="text-xs text-slate-400 text-center pt-1">+{preview.total - preview.sample.length} más no mostrados</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Excel upload ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Asignar por Excel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sube un archivo con una columna <code className="bg-slate-100 px-1 rounded">user_id</code> para asignar usuarios en bloque.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await downloadSurveyAssignTemplate()
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
            <div className="shrink-0">
              <label className="label">Estado</label>
              <select className="input" value={excelStatusId} onChange={(e) => setExcelStatusId(Number(e.target.value))}>
                {surveyStatuses.length > 0
                  ? surveyStatuses.map((s) => <option key={s.Id} value={s.Id}>{s.Name}</option>)
                  : <option value={146}>Pendiente (146)</option>}
              </select>
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
                const res = await assignUsersExcelToSurvey(Number(id), excelFile, excelStatusId)
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
              : <><Users size={15} /> Asignar desde Excel</>
            }
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
