import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery, useGetCitiesQuery } from '../../store/api/locationsApi'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function AssignUsersModal({ isOpen, onClose, onAssign, isAssigning, onPreview, previewData, isPreviewing }) {
  const { data: settingsData } = useGetSettingsGroupedQuery()
  const { data: deptsData } = useGetDepartmentsQuery()
  const { data: citiesData } = useGetCitiesQuery()

  const [activeTab, setActiveTab] = useState('filters') // 'filters' or 'file'
  
  // File state
  const [fileUsers, setFileUsers] = useState([])
  const [fileName, setFileName] = useState('')

  // Filters state
  const [filters, setFilters] = useState({
    gender_id: '',
    marital_status_id: '',
    income_range_id: '',
    profession_id: '',
    number_children_id: '',
    level_academic_id: '',
    frequency_activities_id: '',
    department_id: '',
    city_id: '',
    age_min: '',
    age_max: '',
  })

  // Settings extraction
  const getGroup = (name) => {
    if (!settingsData?.data) return []
    const group = settingsData.data.find(g => g.group_name.toLowerCase().includes(name.toLowerCase()))
    return group ? group.settings : []
  }

  const genders = getGroup('gender') || []
  const maritalStatuses = getGroup('marital') || []
  const incomeRanges = getGroup('income') || []
  const professions = getGroup('profession') || []
  const numberChildren = getGroup('children') || []
  const levelAcademic = getGroup('academic') || getGroup('nivel') || []
  const frequencies = getGroup('frequency') || []

  const departments = deptsData?.data || deptsData || []
  const cities = citiesData?.data || citiesData || []

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const handlePreview = (e) => {
    e.preventDefault()
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    )
    onPreview(activeFilters)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)

    const isCsv = file.name.endsWith('.csv')
    
    if (isCsv) {
      Papa.parse(file, {
        complete: (results) => {
          // Asume que la primera columna son los IDs
          const ids = results.data
            .map(row => Number(row[0]))
            .filter(id => !isNaN(id) && id > 0)
          setFileUsers(ids)
        },
        header: false,
        skipEmptyLines: true
      })
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Extraer los IDs asumiendo que la columna se llama "Id" o tomando el primer valor del objeto
        const ids = json.map(row => {
          const firstVal = Object.values(row)[0]
          return Number(row.Id || firstVal)
        }).filter(id => !isNaN(id) && id > 0)
        
        setFileUsers(ids)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleAssignFilters = () => {
    if (!previewData || previewData.total_users === 0) {
      toast.error('No hay usuarios para asignar en esta vista previa')
      return
    }
    const userIds = previewData.users.map(u => u.Id)
    onAssign(userIds)
  }

  const handleAssignFile = () => {
    if (fileUsers.length === 0) {
      toast.error('El archivo no contiene IDs válidos')
      return
    }
    onAssign(fileUsers)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-slate-800">Asignar Usuarios</Dialog.Title>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'filters' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Por Filtros Demográficos
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'file' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Subir Archivo (CSV/Excel)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === 'filters' ? (
              <div className="space-y-6">
                <form onSubmit={handlePreview} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="label text-xs">Edad Mínima</label>
                    <input type="number" className="input text-sm" value={filters.age_min} onChange={(e) => setFilter('age_min', e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Edad Máxima</label>
                    <input type="number" className="input text-sm" value={filters.age_max} onChange={(e) => setFilter('age_max', e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Género</label>
                    <select className="input text-sm" value={filters.gender_id} onChange={(e) => setFilter('gender_id', e.target.value)}>
                      <option value="">Todos</option>
                      {genders.map(g => <option key={g.Id} value={g.Id}>{g.Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Estado Civil</label>
                    <select className="input text-sm" value={filters.marital_status_id} onChange={(e) => setFilter('marital_status_id', e.target.value)}>
                      <option value="">Todos</option>
                      {maritalStatuses.map(g => <option key={g.Id} value={g.Id}>{g.Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Rango de Ingresos</label>
                    <select className="input text-sm" value={filters.income_range_id} onChange={(e) => setFilter('income_range_id', e.target.value)}>
                      <option value="">Todos</option>
                      {incomeRanges.map(g => <option key={g.Id} value={g.Id}>{g.Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Profesión</label>
                    <select className="input text-sm" value={filters.profession_id} onChange={(e) => setFilter('profession_id', e.target.value)}>
                      <option value="">Todas</option>
                      {professions.map(g => <option key={g.Id} value={g.Id}>{g.Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Departamento</label>
                    <select className="input text-sm" value={filters.department_id} onChange={(e) => setFilter('department_id', e.target.value)}>
                      <option value="">Todos</option>
                      {departments.map(d => <option key={d.Id} value={d.Id}>{d.DepartmentName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Ciudad</label>
                    <select className="input text-sm" value={filters.city_id} onChange={(e) => setFilter('city_id', e.target.value)}>
                      <option value="">Todas</option>
                      {cities.filter(c => !filters.department_id || String(c.DepartmentId) === String(filters.department_id)).map(c => (
                        <option key={c.Id} value={c.Id}>{c.CityName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={isPreviewing} className="btn-secondary w-full">
                      {isPreviewing ? <Loader2 size={16} className="animate-spin mx-auto" /> : <><Search size={16} /> Previsualizar</>}
                    </button>
                  </div>
                </form>

                {previewData && (
                  <div className="card border border-emerald-100 bg-emerald-50/30">
                    <h3 className="font-bold text-slate-800 mb-2">Resultados de la búsqueda</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Se encontraron <span className="font-bold text-emerald-600">{previewData.total_users}</span> usuarios que coinciden con los filtros (y que no están asignados previamente).
                    </p>
                    {previewData.total_users > 0 && (
                      <div className="max-h-40 overflow-y-auto text-xs text-slate-500 bg-white border border-slate-200 rounded p-2">
                        {previewData.users.slice(0, 50).map(u => (
                          <div key={u.Id} className="py-1 border-b border-slate-100 last:border-0 flex justify-between">
                            <span>{u.full_name || 'Sin nombre'}</span>
                            <span>{u.phone || u.Email || ''}</span>
                          </div>
                        ))}
                        {previewData.total_users > 50 && <div className="text-center py-2 italic text-slate-400">...y {previewData.total_users - 50} más</div>}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button onClick={handleAssignFilters} disabled={isAssigning || previewData.total_users === 0} className="btn-primary">
                        {isAssigning ? <Loader2 size={16} className="animate-spin" /> : 'Asignar Usuarios Encontrados'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors">
                  <FileSpreadsheet size={40} className="mx-auto text-violet-300 mb-4" />
                  <p className="text-sm text-slate-600 mb-4">Sube un archivo .csv o .xlsx con los IDs de los usuarios en la primera columna.</p>
                  <label className="btn-secondary inline-flex cursor-pointer">
                    <span>Seleccionar Archivo</span>
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {fileName && <p className="text-sm font-medium text-emerald-600 mt-4">Archivo cargado: {fileName} ({fileUsers.length} IDs encontrados)</p>}
                </div>

                <div className="flex justify-end">
                  <button onClick={handleAssignFile} disabled={isAssigning || fileUsers.length === 0} className="btn-primary">
                    {isAssigning ? <Loader2 size={16} className="animate-spin" /> : `Asignar ${fileUsers.length > 0 ? fileUsers.length : ''} Usuarios`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}