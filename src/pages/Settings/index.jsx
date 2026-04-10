import { useState } from 'react'
import {
  useGetSettingsGroupedQuery,
  useCreateGroupMutation, useUpdateGroupMutation, useDeleteGroupMutation,
  useCreateSettingMutation, useUpdateSettingMutation, useDeleteSettingMutation,
} from '../../store/api/settingsApi'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: groups, isLoading } = useGetSettingsGroupedQuery()
  const [expanded, setExpanded] = useState({})
  const [groupModal, setGroupModal] = useState(null) // null | { id?, name }
  const [settingModal, setSettingModal] = useState(null) // null | { id?, name, code, group_id }

  const [createGroup] = useCreateGroupMutation()
  const [updateGroup] = useUpdateGroupMutation()
  const [deleteGroup] = useDeleteGroupMutation()
  const [createSetting] = useCreateSettingMutation()
  const [updateSetting] = useUpdateSettingMutation()
  const [deleteSetting] = useDeleteSettingMutation()

  const toggleGroup = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const handleSaveGroup = async () => {
    try {
      if (groupModal.id) await updateGroup({ id: groupModal.id, name: groupModal.name }).unwrap()
      else await createGroup({ name: groupModal.name }).unwrap()
      toast.success('Grupo guardado')
      setGroupModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleDeleteGroup = async (id) => {
    if (!confirm('¿Eliminar grupo? Asegúrate de que no tenga catálogos activos.')) return
    try { await deleteGroup(id).unwrap(); toast.success('Eliminado') }
    catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleSaveSetting = async () => {
    try {
      const payload = { name: settingModal.name, code: settingModal.code || null }
      if (settingModal.id) await updateSetting({ id: settingModal.id, ...payload }).unwrap()
      else await createSetting({ ...payload, setting_group_id: settingModal.group_id }).unwrap()
      toast.success('Catálogo guardado. Cambio reflejado en todos los usuarios asociados.')
      setSettingModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  const handleDeleteSetting = async (id) => {
    if (!confirm('¿Eliminar este catálogo?')) return
    try { await deleteSetting(id).unwrap(); toast.success('Eliminado') }
    catch (e) { toast.error(e?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogos</h1>
          <p className="text-slate-500 text-sm">Gestión de grupos y opciones de catálogo</p>
        </div>
        <button onClick={() => setGroupModal({ name: '' })} className="btn-primary">
          <Plus size={15} /> Nuevo grupo
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-sm h-14 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groups?.map((group) => (
            <div key={group.id} className="card p-0 overflow-hidden">
              {/* Header del grupo */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Tag size={15} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{group.name}</p>
                    <p className="text-xs text-slate-500">{group.settings.length} opciones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSettingModal({ name: '', code: '', group_id: group.id }) }}
                    className="btn-ghost btn-sm text-violet-600"
                    title="Agregar catálogo"
                  >
                    <Plus size={13} /> Agregar
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setGroupModal({ id: group.id, name: group.name }) }} className="btn-ghost btn-sm"><Pencil size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id) }} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  {expanded[group.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </div>
              </div>

              {/* Settings del grupo */}
              {expanded[group.id] && (
                <div className="border-t border-slate-50">
                  {group.settings.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-sm">Sin opciones. Agrega la primera.</p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {group.settings.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-violet-400 rounded-full" />
                            <span className="text-sm text-slate-700 font-medium">{s.name}</span>
                            {s.code && <span className="badge-gray text-xs">{s.code}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSettingModal({ id: s.id, name: s.name, code: s.code || '', group_id: group.id })} className="btn-ghost btn-sm"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteSetting(s.id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Grupo */}
      <Modal open={!!groupModal} onClose={() => setGroupModal(null)} title={groupModal?.id ? 'Editar grupo' : 'Nuevo grupo'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del grupo *</label>
            <input autoFocus className="input" value={groupModal?.name || ''} onChange={(e) => setGroupModal((g) => ({ ...g, name: e.target.value }))} placeholder="Ej: Género, Profesiones..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setGroupModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSaveGroup} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Setting */}
      <Modal open={!!settingModal} onClose={() => setSettingModal(null)} title={settingModal?.id ? 'Editar catálogo' : 'Nuevo catálogo'} size="sm">
        {settingModal?.id && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <strong>Nota:</strong> Al cambiar el nombre, se reflejará automáticamente en todos los usuarios que tienen esta opción seleccionada.
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input autoFocus className="input" value={settingModal?.name || ''} onChange={(e) => setSettingModal((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Código (opcional)</label>
            <input className="input" value={settingModal?.code || ''} onChange={(e) => setSettingModal((s) => ({ ...s, code: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSettingModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSaveSetting} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
