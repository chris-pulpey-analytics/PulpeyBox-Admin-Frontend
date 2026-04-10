import { useState } from 'react'
import {
  useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation,
  useGetCitiesQuery, useCreateCityMutation, useUpdateCityMutation, useDeleteCityMutation,
} from '../../store/api/locationsApi'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LocationsPage() {
  const [activeDept, setActiveDept] = useState(null)
  const [deptModal, setDeptModal] = useState(null)
  const [cityModal, setCityModal] = useState(null)

  const { data: departments = [], isLoading: loadingDepts } = useGetDepartmentsQuery()
  const { data: cities = [], isLoading: loadingCities } = useGetCitiesQuery(activeDept ? { department_id: activeDept } : {})

  const [createDept] = useCreateDepartmentMutation()
  const [updateDept] = useUpdateDepartmentMutation()
  const [deleteDept] = useDeleteDepartmentMutation()
  const [createCity] = useCreateCityMutation()
  const [updateCity] = useUpdateCityMutation()
  const [deleteCity] = useDeleteCityMutation()

  const handleSaveDept = async () => {
    try {
      if (deptModal.id) await updateDept({ id: deptModal.id, name: deptModal.name, code: deptModal.code }).unwrap()
      else await createDept({ name: deptModal.name, code: deptModal.code }).unwrap()
      toast.success('Departamento guardado')
      setDeptModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleDeleteDept = async (id) => {
    if (!confirm('¿Eliminar departamento?')) return
    try { await deleteDept(id).unwrap(); if (activeDept === id) setActiveDept(null); toast.success('Eliminado') }
    catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleSaveCity = async () => {
    try {
      if (cityModal.id) await updateCity({ id: cityModal.id, name: cityModal.name, code: cityModal.code, department_id: cityModal.department_id }).unwrap()
      else await createCity({ name: cityModal.name, code: cityModal.code, department_id: cityModal.department_id }).unwrap()
      toast.success('Municipio guardado')
      setCityModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleDeleteCity = async (id) => {
    if (!confirm('¿Eliminar municipio?')) return
    try { await deleteCity(id).unwrap(); toast.success('Eliminado') }
    catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Ubicaciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departamentos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-700 flex items-center gap-2"><Building2 size={16} className="text-violet-600" /> Departamentos ({departments.length})</h2>
            <button onClick={() => setDeptModal({ name: '', code: '' })} className="btn-primary btn-sm"><Plus size={13} /> Agregar</button>
          </div>
          <div className="card p-0 overflow-hidden max-h-[500px] overflow-y-auto">
            {loadingDepts ? (
              <div className="p-4 animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}</div>
            ) : departments.map((d) => (
              <div
                key={d.Id}
                onClick={() => setActiveDept(d.Id === activeDept ? null : d.Id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${activeDept === d.Id ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.DepartmentName}</p>
                  <p className="text-xs text-slate-400">{d.Code} · {d.city_count} municipios</p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setDeptModal({ id: d.Id, name: d.DepartmentName, code: d.Code })} className="btn-ghost btn-sm"><Pencil size={12} /></button>
                  <button onClick={() => handleDeleteDept(d.Id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Municipios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-violet-600" />
              Municipios {activeDept ? `(${cities.length})` : ''}
            </h2>
            {activeDept && (
              <button onClick={() => setCityModal({ name: '', code: '', department_id: activeDept })} className="btn-primary btn-sm"><Plus size={13} /> Agregar</button>
            )}
          </div>
          <div className="card p-0 overflow-hidden max-h-[500px] overflow-y-auto">
            {!activeDept ? (
              <p className="text-center py-12 text-slate-400 text-sm">Selecciona un departamento</p>
            ) : loadingCities ? (
              <div className="p-4 animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}</div>
            ) : cities.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-sm">Sin municipios</p>
            ) : cities.map((c) => (
              <div key={c.Id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.CityName}</p>
                  {c.Code && <p className="text-xs text-slate-400">{c.Code}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCityModal({ id: c.Id, name: c.CityName, code: c.Code || '', department_id: c.DepartmentId })} className="btn-ghost btn-sm"><Pencil size={12} /></button>
                  <button onClick={() => handleDeleteCity(c.Id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Departamento */}
      <Modal open={!!deptModal} onClose={() => setDeptModal(null)} title={deptModal?.id ? 'Editar departamento' : 'Nuevo departamento'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nombre *</label><input autoFocus className="input" value={deptModal?.name || ''} onChange={(e) => setDeptModal((d) => ({ ...d, name: e.target.value }))} /></div>
          <div><label className="label">Código *</label><input className="input" value={deptModal?.code || ''} onChange={(e) => setDeptModal((d) => ({ ...d, code: e.target.value }))} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setDeptModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleSaveDept} className="btn-primary">Guardar</button></div>
        </div>
      </Modal>

      {/* Modal Municipio */}
      <Modal open={!!cityModal} onClose={() => setCityModal(null)} title={cityModal?.id ? 'Editar municipio' : 'Nuevo municipio'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nombre *</label><input autoFocus className="input" value={cityModal?.name || ''} onChange={(e) => setCityModal((c) => ({ ...c, name: e.target.value }))} /></div>
          <div><label className="label">Código</label><input className="input" value={cityModal?.code || ''} onChange={(e) => setCityModal((c) => ({ ...c, code: e.target.value }))} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setCityModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleSaveCity} className="btn-primary">Guardar</button></div>
        </div>
      </Modal>
    </div>
  )
}
