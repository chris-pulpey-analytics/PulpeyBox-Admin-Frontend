import { useState, useRef } from 'react'
import { crossReference, downloadBlob } from '../../store/api/reportsApi'
import { generateInternalReport, downloadBlob as surveyDownloadBlob, useGetSurveysQuery } from '../../store/api/surveysApi'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, BarChart2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Internal Survey Report ──────────────────────────────────────────────────

function InternalSurveyReport() {
  const [selectedIds, setSelectedIds] = useState([])
  const [statusId, setStatusId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')

  const { data: surveys = [] } = useGetSurveysQuery()
  const { data: settingsData } = useGetSettingsGroupedQuery()

  const grouped = settingsData || []
  const getGroup = (kw) => grouped.find((g) => g.group_name?.toLowerCase().includes(kw))?.settings || []
  const surveyStatuses = getGroup('encuesta') || getGroup('survey')

  const filtered = surveys.filter((s) =>
    s.Title?.toLowerCase().includes(search.toLowerCase()) ||
    String(s.Id).includes(search)
  )

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setResult(null)
  }

  const removeId = (id) => setSelectedIds((prev) => prev.filter((x) => x !== id))

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos una encuesta')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const response = await generateInternalReport(selectedIds, statusId ? Number(statusId) : null)
      if (!response.ok) {
        let msg = 'Error al generar el reporte'
        try { msg = (await response.json()).detail || msg } catch { /* ignore */ }
        setErrorMsg(msg)
        setResult('error')
        return
      }
      const filename = `reporte_encuestas_${new Date().toISOString().slice(0, 10)}.xlsx`
      await surveyDownloadBlob(response, filename)
      setResult('success')
      toast.success('Reporte generado — descargando archivo')
    } catch {
      setErrorMsg('Error de conexión al generar el reporte')
      setResult('error')
    } finally {
      setLoading(false)
    }
  }

  const selectedSurveys = surveys.filter((s) => selectedIds.includes(s.Id))

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="card bg-violet-50 border border-violet-100">
        <h3 className="text-sm font-bold text-violet-800 mb-2">Cómo funciona</h3>
        <ol className="text-xs text-violet-700 space-y-1 list-decimal list-inside">
          <li>Selecciona una o más encuestas de la lista</li>
          <li>Opcionalmente filtra por estado (Pendiente / Completada)</li>
          <li>Genera el Excel — una hoja por encuesta, cada pregunta en una columna</li>
        </ol>
      </div>

      {/* Survey selector */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
          Encuestas seleccionadas ({selectedIds.length})
        </label>

        {selectedSurveys.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedSurveys.map((s) => (
              <span
                key={s.Id}
                className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                #{s.Id} · {s.Title}
                <button
                  onClick={() => removeId(s.Id)}
                  className="hover:text-violet-600 ml-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por título o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No se encontraron encuestas</p>
            ) : (
              filtered.map((s) => {
                const checked = selectedIds.includes(s.Id)
                return (
                  <label
                    key={s.Id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${checked ? 'bg-violet-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(s.Id)}
                      className="accent-violet-600"
                    />
                    <span className="text-xs text-slate-400 w-8 shrink-0">#{s.Id}</span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{s.Title}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
          Filtrar por estado (opcional)
        </label>
        <select
          value={statusId}
          onChange={(e) => { setStatusId(e.target.value); setResult(null) }}
          className="input-field w-full max-w-xs"
        >
          <option value="">Todos los estados</option>
          {surveyStatuses.map((s) => (
            <option key={s.Id} value={s.Id}>{s.Name}</option>
          ))}
        </select>
      </div>

      {/* Result */}
      {result === 'success' && (
        <div className="card bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Reporte generado exitosamente</p>
            <p className="text-xs text-emerald-600">El archivo Excel fue descargado automáticamente</p>
          </div>
        </div>
      )}

      {result === 'error' && (
        <div className="card bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error al generar el reporte</p>
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={selectedIds.length === 0 || loading}
          className="btn-primary gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download size={16} />
              Generar y descargar
            </>
          )}
        </button>
        {selectedIds.length > 0 && !loading && (
          <button
            onClick={() => { setSelectedIds([]); setStatusId(''); setResult(null) }}
            className="btn-ghost text-sm"
          >
            Limpiar selección
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Cross-reference ─────────────────────────────────────────────────────────

function CrossReference() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      toast.error('Solo se aceptan archivos Excel (.xlsx, .xls)')
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleProcess = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const response = await crossReference(file)
      if (!response.ok) {
        const err = await response.json()
        setErrorMsg(err.detail || 'Error al procesar el archivo')
        setResult('error')
        return
      }
      const filename = `cruce_pulpey_${new Date().toISOString().slice(0, 10)}.xlsx`
      await downloadBlob(response, filename)
      setResult('success')
      toast.success('Cruce completado — descargando archivo')
    } catch {
      setErrorMsg('Error de conexión al procesar el archivo')
      setResult('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Instrucciones */}
      <div className="card bg-blue-50 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-800 mb-2">Cómo funciona</h3>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Sube el archivo Excel exportado de QuestionPro</li>
          <li>El sistema detecta automáticamente la columna de correos y/o celulares</li>
          <li>Busca en la base de datos de Pulpey y cruza los perfiles encontrados</li>
          <li>Descarga un nuevo Excel con 3 hojas:
            <strong> "Datos Originales"</strong>, <strong>"Cruce Data Pulpey"</strong> y <strong>"Cruce Completo"</strong>
          </li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          El archivo debe tener columnas con "correo" y "pulpey" en el nombre, y/o una columna con "celular".
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors
          ${dragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <>
            <FileSpreadsheet size={36} className="text-emerald-500" />
            <div className="text-center">
              <p className="font-semibold text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · haz clic para cambiar</p>
            </div>
          </>
        ) : (
          <>
            <Upload size={36} className="text-slate-300" />
            <div className="text-center">
              <p className="font-semibold text-slate-600">Arrastra tu archivo aquí</p>
              <p className="text-xs text-slate-400">o haz clic para seleccionar · .xlsx, .xls</p>
            </div>
          </>
        )}
      </div>

      {/* Resultado */}
      {result === 'success' && (
        <div className="card bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Cruce completado exitosamente</p>
            <p className="text-xs text-emerald-600">El archivo Excel fue descargado automáticamente</p>
          </div>
        </div>
      )}

      {result === 'error' && (
        <div className="card bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error al procesar</p>
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="btn-primary gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Download size={16} />
              Procesar y descargar
            </>
          )}
        </button>
        {file && !loading && (
          <button onClick={() => { setFile(null); setResult(null) }} className="btn-ghost text-sm">
            Limpiar
          </button>
        )}
      </div>

      {/* Columnas del reporte */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Datos incluidos en el reporte</h3>
        <div className="grid grid-cols-2 gap-1">
          {[
            'Nombre y Apellido', 'Teléfono', 'Correo Electrónico', 'Instagram',
            'Fecha de Nacimiento', 'Edad y Rango', 'Género', 'Estado Civil',
            'Rol Familiar', 'Rango de Ingreso', 'Profesión', 'Nivel Académico',
            'Mascotas', 'Hobbies', 'Frecuencia Actividad Física', 'Número de Hijos',
            'Compras en el Hogar', 'Embarazo', 'Tecnología / Alcohol / Nicotina',
            'Dirección completa', 'Zona', 'Departamento / Municipio',
            'Latitud / Longitud', 'Fechas de registro y sesión',
          ].map((col) => (
            <div key={col} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              {col}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'cross', label: 'Cruce de Datos', icon: FileSpreadsheet },
  { id: 'surveys', label: 'Reporte de Encuestas', icon: BarChart2 },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('cross')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Genera reportes y cruces de datos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'cross' && <CrossReference />}
      {tab === 'surveys' && <InternalSurveyReport />}
    </div>
  )
}
