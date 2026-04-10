import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetSurveysQuery, useDeleteSurveyMutation, useLinkSurveyToNewsMutation } from '../../store/api/surveysApi'
import { useGetNewsQuery } from '../../store/api/newsApi'
import { exportSurveyUsers, downloadBlob } from '../../store/api/surveysApi'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import ExportButton from '../../components/ui/ExportButton'
import { Plus, Search, Eye, Pencil, Trash2, Link } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SurveysPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [linkModal, setLinkModal] = useState(null)
  const [selectedNews, setSelectedNews] = useState('')

  const { data, isLoading } = useGetSurveysQuery({ page, page_size: 20, search })
  const { data: newsData } = useGetNewsQuery({ page: 1, page_size: 100 })
  const [deleteSurvey] = useDeleteSurveyMutation()
  const [linkToNews, { isLoading: linking }] = useLinkSurveyToNewsMutation()

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta encuesta?')) return
    try {
      await deleteSurvey(id).unwrap()
      toast.success('Encuesta eliminada')
    } catch { toast.error('Error al eliminar') }
  }

  const handleLink = async () => {
    if (!selectedNews) return
    try {
      await linkToNews({ surveyId: linkModal.Id, newsId: Number(selectedNews) }).unwrap()
      toast.success('Encuesta vinculada a la noticia')
      setLinkModal(null)
    } catch { toast.error('Error al vincular') }
  }

  const handleExportUsers = async (surveyId, format) => {
    try {
      const res = await exportSurveyUsers(surveyId, format)
      downloadBlob(res, `encuesta_${surveyId}_usuarios.${format}`)
      toast.success('Descarga iniciada')
    } catch { toast.error('Error al exportar') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Encuestas</h1>
          <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() ?? '...'} encuestas</p>
        </div>
        <button onClick={() => navigate('/surveys/new')} className="btn-primary">
          <Plus size={16} /> Nueva encuesta
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Buscar encuesta..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['ID', 'Nombre', 'Código', 'Estado', 'Enrolados', 'Completados', 'Expiración', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-400">Sin encuestas</td></tr>
              ) : data?.data?.map((s) => (
                <tr key={s.Id} className="table-row">
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{s.Id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.Name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.Code || '—'}</td>
                  <td className="px-4 py-3"><span className="badge-blue">{s.status_name || '—'}</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{s.total_enrolled}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-600">{s.total_completed}</span>
                    <span className="text-slate-400 text-xs ml-1">
                      ({s.total_enrolled ? Math.round((s.total_completed / s.total_enrolled) * 100) : 0}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {s.ExpirationDate ? new Date(s.ExpirationDate).toLocaleDateString('es') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/surveys/${s.Id}/edit`)} className="btn-ghost btn-sm" title="Editar"><Pencil size={13} /></button>
                      <button onClick={() => { setLinkModal(s); setSelectedNews('') }} className="btn-ghost btn-sm" title="Vincular a noticia"><Link size={13} /></button>
                      <ExportButton onExport={(fmt) => handleExportUsers(s.Id, fmt)} />
                      <button onClick={() => handleDelete(s.Id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600" title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
        </div>
      </div>

      {/* Modal vincular a noticia */}
      <Modal open={!!linkModal} onClose={() => setLinkModal(null)} title={`Vincular "${linkModal?.Name}" a una noticia`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Selecciona la noticia/promoción. Su URL de acción se actualizará con la URL de la encuesta.</p>
          <div>
            <label className="label">Noticia / Promoción</label>
            <select className="input" value={selectedNews} onChange={(e) => setSelectedNews(e.target.value)}>
              <option value="">— Selecciona —</option>
              {newsData?.data?.map((n) => <option key={n.Id} value={n.Id}>{n.Title}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setLinkModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleLink} disabled={!selectedNews || linking} className="btn-primary">
              {linking ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
