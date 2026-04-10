import { useState } from 'react'
import {
  useGetAdminUsersQuery, useGetRolesQuery,
  useCreateAdminUserMutation, useUpdateAdminUserMutation,
  useResetAdminPasswordMutation, useToggleAdminActiveMutation, useDeleteAdminUserMutation,
  useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
} from '../../store/api/adminUsersApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../store/authSlice'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight, ShieldCheck, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', last_name: '', email: '', password: '', role_id: '' }

export default function AdminUsersPage() {
  const currentUser = useSelector(selectCurrentUser)
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin'

  const { data: users = [], isLoading } = useGetAdminUsersQuery()
  const { data: roles = [] } = useGetRolesQuery()

  const [createUser] = useCreateAdminUserMutation()
  const [updateUser] = useUpdateAdminUserMutation()
  const [resetPassword] = useResetAdminPasswordMutation()
  const [toggleActive] = useToggleAdminActiveMutation()
  const [deleteUser] = useDeleteAdminUserMutation()
  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()

  const [tab, setTab] = useState('users') // 'users' | 'roles'
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Role form
  const [roleModal, setRoleModal] = useState(null) // null | 'create' | 'edit'
  const [roleForm, setRoleForm] = useState({ rol_name: '' })
  const [selectedRole, setSelectedRole] = useState(null)

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create') }
  const openEdit = (u) => {
    setSelected(u)
    setForm({ name: u.Name, last_name: u.LastName, email: u.Email, role_id: u.role_id, password: '' })
    setModal('edit')
  }
  const openPassword = (u) => { setSelected(u); setNewPassword(''); setModal('password') }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role_id) {
      toast.error('Completa todos los campos'); return
    }
    setSaving(true)
    try {
      await createUser({ ...form, role_id: Number(form.role_id) }).unwrap()
      toast.success('Usuario creado'); setModal(null)
    } catch (e) {
      toast.error(e?.data?.detail || 'Error al crear')
    } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updateUser({ id: selected.Id, name: form.name, last_name: form.last_name, email: form.email, role_id: Number(form.role_id) }).unwrap()
      toast.success('Usuario actualizado'); setModal(null)
    } catch { toast.error('Error al actualizar') } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setSaving(true)
    try {
      await resetPassword({ id: selected.Id, new_password: newPassword }).unwrap()
      toast.success('Contraseña actualizada'); setModal(null)
    } catch { toast.error('Error al cambiar contraseña') } finally { setSaving(false) }
  }

  const handleToggle = async (u) => {
    try {
      const res = await toggleActive(u.Id).unwrap()
      toast.success(res.deleted ? 'Usuario desactivado' : 'Usuario activado')
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar a ${u.Name} ${u.LastName}?`)) return
    try { await deleteUser(u.Id).unwrap(); toast.success('Usuario eliminado') }
    catch { toast.error('Error al eliminar') }
  }

  // Role handlers
  const openCreateRole = () => { setRoleForm({ rol_name: '' }); setRoleModal('create') }
  const openEditRole = (r) => { setSelectedRole(r); setRoleForm({ rol_name: r.RolName }); setRoleModal('edit') }

  const handleCreateRole = async () => {
    if (!roleForm.rol_name.trim()) { toast.error('Ingresa un nombre de rol'); return }
    setSaving(true)
    try {
      await createRole({ rol_name: roleForm.rol_name }).unwrap()
      toast.success('Rol creado'); setRoleModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error al crear rol') } finally { setSaving(false) }
  }

  const handleUpdateRole = async () => {
    if (!roleForm.rol_name.trim()) { toast.error('Ingresa un nombre'); return }
    setSaving(true)
    try {
      await updateRole({ id: selectedRole.Id, rol_name: roleForm.rol_name }).unwrap()
      toast.success('Rol actualizado'); setRoleModal(null)
    } catch (e) { toast.error(e?.data?.detail || 'Error al actualizar') } finally { setSaving(false) }
  }

  const handleDeleteRole = async (r) => {
    if (!confirm(`¿Eliminar el rol "${r.RolName}"?`)) return
    try { await deleteRole(r.Id).unwrap(); toast.success('Rol eliminado') }
    catch (e) { toast.error(e?.data?.detail || 'Error al eliminar') }
  }

  const roleColor = (roleName) =>
    roleName?.toLowerCase() === 'admin' ? 'badge-violet' : 'badge-blue'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios Admin</h1>
          <p className="text-slate-500 text-sm">Gestión de accesos al panel de administración</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {tab === 'users' && (
              <button onClick={openCreate} className="btn-primary">
                <Plus size={16} /> Nuevo usuario
              </button>
            )}
            {tab === 'roles' && (
              <button onClick={openCreateRole} className="btn-primary">
                <Plus size={16} /> Nuevo rol
              </button>
            )}
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="card bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <ShieldCheck size={16} /> Solo el rol <strong>Admin</strong> puede crear, editar o eliminar.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'users' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ShieldCheck size={14} className="inline mr-1.5" />Usuarios ({users.length})
        </button>
        <button
          onClick={() => setTab('roles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'roles' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Tag size={14} className="inline mr-1.5" />Roles ({roles.length})
        </button>
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Último acceso', isAdmin ? 'Acciones' : ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6}><div className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></div></td></tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400">Sin usuarios admin</td></tr>
                ) : users.map((u) => (
                  <tr key={u.Id} className="table-row">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.Name} {u.LastName}</td>
                    <td className="px-4 py-3 text-slate-600">{u.Email}</td>
                    <td className="px-4 py-3"><span className={roleColor(u.role_name)}>{u.role_name}</span></td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.Deleted ? 'badge-gray' : 'badge-green'}`}>
                        {u.Deleted ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {u.LastSession ? new Date(u.LastSession).toLocaleDateString('es') : '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="btn-ghost btn-sm" title="Editar"><Pencil size={13} /></button>
                          <button onClick={() => openPassword(u)} className="btn-ghost btn-sm" title="Cambiar contraseña"><KeyRound size={13} /></button>
                          <button
                            onClick={() => handleToggle(u)}
                            className={`btn-ghost btn-sm ${u.Deleted ? 'text-emerald-500' : 'text-amber-500'}`}
                            title={u.Deleted ? 'Activar' : 'Desactivar'}
                          >
                            {u.Deleted ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                          </button>
                          <button onClick={() => handleDelete(u)} className="btn-ghost btn-sm text-red-400 hover:text-red-600" title="Eliminar"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles table */}
      {tab === 'roles' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Nombre del Rol', 'Usuarios asignados', isAdmin ? 'Acciones' : ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-16 text-slate-400">Sin roles</td></tr>
                ) : roles.map((r) => {
                  const assignedCount = users.filter((u) => u.role_id === r.Id).length
                  return (
                    <tr key={r.Id} className="table-row">
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{r.Id}</td>
                      <td className="px-4 py-3">
                        <span className={roleColor(r.RolName)}>{r.RolName}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{assignedCount}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditRole(r)} className="btn-ghost btn-sm" title="Editar"><Pencil size={13} /></button>
                            <button
                              onClick={() => handleDeleteRole(r)}
                              className="btn-ghost btn-sm text-red-400 hover:text-red-600"
                              title="Eliminar"
                              disabled={assignedCount > 0}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── User Modals ────────────────────────────────────────── */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nuevo usuario admin" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nombre</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Apellido</label><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Contraseña</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">— Selecciona un rol —</option>
              {roles.map((r) => <option key={r.Id} value={r.Id}>{r.RolName}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Editar: ${selected?.Name} ${selected?.LastName}`} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nombre</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Apellido</label><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              {roles.map((r) => <option key={r.Id} value={r.Id}>{r.RolName}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'password'} onClose={() => setModal(null)} title={`Cambiar contraseña: ${selected?.Name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nueva contraseña</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleResetPassword} disabled={saving} className="btn-primary">{saving ? 'Cambiando...' : 'Cambiar contraseña'}</button>
          </div>
        </div>
      </Modal>

      {/* ── Role Modals ────────────────────────────────────────── */}
      <Modal open={roleModal === 'create'} onClose={() => setRoleModal(null)} title="Nuevo rol" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del rol</label>
            <input className="input" value={roleForm.rol_name} onChange={(e) => setRoleForm({ rol_name: e.target.value })} placeholder="Ej: Analista, Supervisor..." />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setRoleModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateRole} disabled={saving} className="btn-primary">{saving ? 'Creando...' : 'Crear rol'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={roleModal === 'edit'} onClose={() => setRoleModal(null)} title={`Editar rol: ${selectedRole?.RolName}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del rol</label>
            <input className="input" value={roleForm.rol_name} onChange={(e) => setRoleForm({ rol_name: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setRoleModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleUpdateRole} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
