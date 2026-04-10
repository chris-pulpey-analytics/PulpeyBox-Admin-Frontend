import { useState } from 'react'
import { useGetContactQuery } from '../../store/api/contactApi'
import { exportContact, downloadBlob } from '../../store/api/contactApi'
import ExportButton from '../../components/ui/ExportButton'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { Search, Mail, Phone, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const { data, isLoading } = useGetContactQuery({ page, page_size: 20, search })

  const handleExport = async (format) => {
    try {
      const res = await exportContact({ search }, format)
      downloadBlob(res, `contactenos.${format}`)
      toast.success('Descarga iniciada')
    } catch { toast.error('Error al exportar') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contáctenos</h1>
          <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() ?? '...'} solicitudes</p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Buscar por nombre, empresa..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Nombre', 'Email', 'Teléfono', 'Empresa', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></div></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">Sin solicitudes</td></tr>
              ) : data?.data?.map((c) => (
                <tr key={c.Id} className="table-row cursor-pointer" onClick={() => setDetail(c)}>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.Name} {c.LastName}</td>
                  <td className="px-4 py-3 text-slate-600">{c.Email}</td>
                  <td className="px-4 py-3 text-slate-600">{c.PhoneNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{c.Company}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(c.CreationDate).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3 text-violet-500 text-xs font-medium">Ver →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
        </div>
      </div>

      {/* Detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalle de solicitud">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Nombre</p>
                <p className="text-sm font-medium text-slate-800">{detail.Name} {detail.LastName}</p>
              </div>
              <div>
                <p className="label">Empresa</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><Building2 size={13} className="text-slate-400" />{detail.Company}</p>
              </div>
              <div>
                <p className="label">Email</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{detail.Email}</p>
              </div>
              <div>
                <p className="label">Teléfono</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{detail.PhoneNumber}</p>
              </div>
              <div>
                <p className="label">Fecha</p>
                <p className="text-sm text-slate-700">{new Date(detail.CreationDate).toLocaleDateString('es', { dateStyle: 'long' })}</p>
              </div>
              <div>
                <p className="label">Aceptó términos</p>
                <p className="text-sm text-slate-700">{detail.AcceptTermCondition ? new Date(detail.AcceptTermCondition).toLocaleDateString('es') : '—'}</p>
              </div>
            </div>
            <div>
              <p className="label">Mensaje</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">{detail.Message}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
