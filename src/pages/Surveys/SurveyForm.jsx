import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateSurveyMutation, useUpdateSurveyMutation, useGetSurveyQuery } from '../../store/api/surveysApi'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', title: '', description: '', survey_url: '', expiration_date: '', default: false }

export default function SurveyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing } = useGetSurveyQuery(id, { skip: !isEdit })
  const [createSurvey, { isLoading: creating }] = useCreateSurveyMutation()
  const [updateSurvey, { isLoading: updating }] = useUpdateSurveyMutation()

  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (existing?.survey) {
      const s = existing.survey
      setForm({
        name: s.Name || '',
        code: s.Code || '',
        title: s.Title || '',
        description: s.Description || '',
        survey_url: s.SurveyUrl || '',
        expiration_date: s.ExpirationDate ? s.ExpirationDate.split('T')[0] : '',
        default: s.Default || false,
      })
    }
  }, [existing])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, expiration_date: form.expiration_date || null }
    try {
      if (isEdit) {
        await updateSurvey({ id: Number(id), ...payload }).unwrap()
        toast.success('Encuesta actualizada')
      } else {
        await createSurvey(payload).unwrap()
        toast.success('Encuesta creada')
      }
      navigate('/surveys')
    } catch { toast.error('Error al guardar') }
  }

  const loading = creating || updating

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar encuesta' : 'Nueva encuesta'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nombre *</label>
            <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Encuesta de perfil 2025" />
          </div>
          <div>
            <label className="label">Código</label>
            <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="ENC-001" />
          </div>
          <div>
            <label className="label">Fecha de expiración</label>
            <input type="date" className="input" value={form.expiration_date} onChange={(e) => set('expiration_date', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Título</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="¡Completa tu perfil!" />
          </div>
          <div className="col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descripción de la encuesta..." />
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
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
