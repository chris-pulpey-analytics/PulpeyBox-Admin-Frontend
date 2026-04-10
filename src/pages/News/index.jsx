import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetNewsQuery, useDeleteNewsMutation } from '../../store/api/newsApi'
import { exportNews, downloadBlob } from '../../store/api/newsApi'
import ExportButton from '../../components/ui/ExportButton'
import Pagination from '../../components/ui/Pagination'
import { Plus, Search, Pencil, Trash2, Eye, MousePointer } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetNewsQuery({ page, page_size: 20, search })
  const [deleteNews] = useDeleteNewsMutation()

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar?')) return
    try { await deleteNews(id).unwrap(); toast.success('Eliminado') }
    catch { toast.error('Error al eliminar') }
  }

  const handleExport = async (format) => {
    try {
      const res = await exportNews({ search }, format)
      downloadBlob(res, `noticias.${format}`)
      toast.success('Descarga iniciada')
    } catch { toast.error('Error al exportar') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Noticias y Promociones</h1>
          <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() ?? '...'} registros</p>
        </div>
        <div className="flex gap-2">
          <ExportButton onExport={handleExport} />
          <button onClick={() => navigate('/news/new')} className="btn-primary"><Plus size={15} /> Nueva</button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Buscar noticia..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['ID', 'Título', 'Código', 'Enviados', 'Vistos', 'Clicks', 'Expiración', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8}><div className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></div></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-400">Sin registros</td></tr>
              ) : data?.data?.map((n) => (
                <tr key={n.Id} className="table-row">
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{n.Id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{n.Title}</td>
                  <td className="px-4 py-3 text-slate-500">{n.Code || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{n.total_sent}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye size={13} />
                      <span className="font-semibold">{n.total_viewed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <MousePointer size={13} />
                      <span className="font-semibold">{n.total_clicks}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {n.ExpirationDate ? new Date(n.ExpirationDate).toLocaleDateString('es') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/news/${n.Id}/edit`)} className="btn-ghost btn-sm"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(n.Id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
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
    </div>
  )
}
