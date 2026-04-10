import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateNewsMutation, useUpdateNewsMutation, useGetNewsItemQuery } from '../../store/api/newsApi'
import { useGetSurveysQuery } from '../../store/api/surveysApi'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  title: '', description: '', code: '', image_url: '',
  action_url: '', action_text: '', expiration_date: '', default: false,
  linked_survey_id: '',
}

export default function NewsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing } = useGetNewsItemQuery(id, { skip: !isEdit })
  const { data: surveysData } = useGetSurveysQuery({ page: 1, page_size: 100 })
  const [createNews, { isLoading: creating }] = useCreateNewsMutation()
  const [updateNews, { isLoading: updating }] = useUpdateNewsMutation()

  const [form, setForm] = useState(EMPTY)

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
      })
    }
  }, [existing])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Auto-fill action_url cuando se selecciona una encuesta
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
    const body = { ...payload, expiration_date: payload.expiration_date || null }
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

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar noticia' : 'Nueva noticia/promoción'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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
          <div className="col-span-2">
            <label className="label">Descripción *</label>
            <textarea required className="input resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">URL de imagen</label>
            <input className="input" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." />
          </div>

          {/* Vinculación a encuesta */}
          <div className="col-span-2 p-4 bg-violet-50 rounded-xl border border-violet-100">
            <label className="label text-violet-700">Vincular a encuesta (opcional)</label>
            <select className="input" value={form.linked_survey_id} onChange={(e) => handleSurveyLink(e.target.value)}>
              <option value="">— Sin encuesta —</option>
              {surveysData?.data?.map((s) => <option key={s.Id} value={s.Id}>{s.Name}</option>)}
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
          <div className="col-span-2">
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
    </div>
  )
}
