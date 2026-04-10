import { useState, useRef } from 'react'
import { crossReference, downloadBlob } from '../../store/api/reportsApi'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // null | 'success' | 'error'
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cruce de Datos</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Sube un Excel de QuestionPro para cruzar con los perfiles de Pulpey
        </p>
      </div>

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
