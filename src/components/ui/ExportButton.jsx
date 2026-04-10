import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'

export default function ExportButton({ onExport, loading }) {
  const [open, setOpen] = useState(false)

  const handle = (format) => {
    setOpen(false)
    onExport(format)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="btn-secondary flex items-center gap-2"
      >
        <Download size={15} />
        Exportar
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[120px]">
          <button onClick={() => handle('xlsx')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">
            XLSX
          </button>
          <button onClick={() => handle('csv')} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">
            CSV
          </button>
        </div>
      )}
    </div>
  )
}

export function downloadBlob(response, filename) {
  response.blob().then((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  })
}
