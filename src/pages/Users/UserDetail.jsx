import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetUserQuery, useUpdateUserMutation } from '../../store/api/usersApi'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery, useGetCitiesQuery } from '../../store/api/locationsApi'
import Modal from '../../components/ui/Modal'
import { ArrowLeft, User, MapPin, ClipboardList, Megaphone, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-800 font-medium mt-0.5">{value || '—'}</p>
  </div>
)

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetUserQuery(id)
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation()
  const { data: settingsData } = useGetSettingsGroupedQuery()
  const { data: departments } = useGetDepartmentsQuery()
  const [deptId, setDeptId] = useState(null)
  const { data: citiesData } = useGetCitiesQuery({ department_id: deptId }, { skip: !deptId })
  const cities = citiesData?.data || citiesData || []

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({})

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return <div className="text-center py-20 text-slate-400">Usuario no encontrado</div>

  const u = data.user || {}
  const surveys = data.surveys || []
  const news = data.news || []

  // Grupos de settings por tipo
  const grouped = settingsData || []
  const getGroup = (keyword) =>
    grouped.find((g) => g.group_name?.toLowerCase().includes(keyword.toLowerCase()))?.settings || []

  const openEdit = () => {
    setForm({
      name: u.Nombre || '',
      last_name: u.Apellido || '',
      email: u['Correo Electrónico'] || '',
      mobil_number: u.Teléfono || '',
      instagram: u['Usuario Instagram'] || '',
      address: u.Dirección || '',
      exact_address: u['Dirección Exacta'] || '',
      instruction: u.Indicaciones || '',
      zone: u.Zona || '',
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = { id }
      if (form.name) payload.name = form.name
      if (form.last_name) payload.last_name = form.last_name
      if (form.email) payload.email = form.email
      if (form.mobil_number) payload.mobil_number = form.mobil_number
      if (form.instagram !== undefined) payload.instagram = form.instagram
      if (form.address !== undefined) payload.address = form.address
      if (form.exact_address !== undefined) payload.exact_address = form.exact_address
      if (form.instruction !== undefined) payload.instruction = form.instruction
      if (form.zone !== '') payload.zone = Number(form.zone) || null
      if (form.gender_id) payload.gender_id = Number(form.gender_id)
      if (form.marital_status_id) payload.marital_status_id = Number(form.marital_status_id)
      if (form.role_house_id) payload.role_house_id = Number(form.role_house_id)
      if (form.income_range_id) payload.income_range_id = Number(form.income_range_id)
      if (form.professions_id) payload.professions_id = Number(form.professions_id)
      if (form.number_children_id) payload.number_children_id = Number(form.number_children_id)
      if (form.level_academic_id) payload.level_academic_id = Number(form.level_academic_id)
      if (form.frequency_activities_id) payload.frequency_activities_id = Number(form.frequency_activities_id)
      if (form.city_id) payload.city_id = Number(form.city_id)
      if (form.birth_date) payload.birth_date = form.birth_date

      await updateUser(payload).unwrap()
      toast.success('Usuario actualizado')
      setEditOpen(false)
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{u.Nombre} {u.Apellido}</h1>
            <p className="text-slate-500 text-sm">ID: {u.Id} · {u['Correo Electrónico']}</p>
          </div>
        </div>
        <button onClick={openEdit} className="btn-secondary gap-2">
          <Pencil size={14} /> Editar perfil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2"><User size={16} className="text-violet-600" /><h3 className="font-bold text-slate-700">Datos personales</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" value={u.Nombre} />
            <Field label="Apellido" value={u.Apellido} />
            <Field label="Email" value={u['Correo Electrónico']} />
            <Field label="Teléfono" value={u.Teléfono} />
            <Field label="Instagram" value={u['Usuario Instagram']} />
            <Field label="Fecha nacimiento" value={u['Fecha de Nacimiento']} />
            <Field label="Edad" value={u.Edad} />
            <Field label="Rango edad" value={u['Rango de Edad']} />
            <Field label="Género" value={u.Género} />
            <Field label="Estado Civil" value={u['Estado Civil']} />
            <Field label="Rol familiar" value={u['Rol Familiar']} />
            <Field label="Hijos" value={u['Número de Hijos']} />
            <Field label="Profesión" value={u.Profesión} />
            <Field label="Nivel académico" value={u['Nivel Académico']} />
            <Field label="Rango ingreso" value={u['Rango de Ingreso']} />
            <Field label="Act. física" value={u['Frecuencia Actividad Física']} />
            <Field label="Hobbies" value={u.Hobbies} />
            <Field label="Mascotas" value={u.Mascotas} />
          </div>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            {[['Compras hogar', u['Compras en el Hogar']], ['Embarazo', u.Embarazo], ['Int. Tecnología', u['Interesado en Tecnología']], ['Alcohol', u['Consume Alcohol']], ['Nicotina', u['Consume Nicotina']]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between text-sm">
                <span className="text-slate-500 text-xs">{l}</span>
                <span className={`badge ${v === 'SI' ? 'badge-green' : 'badge-gray'}`}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ubicación */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-violet-600" /><h3 className="font-bold text-slate-700">Ubicación y fechas</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="País" value={u.País} />
            <Field label="Departamento" value={u.Departamento} />
            <Field label="Municipio" value={u.Municipio} />
            <Field label="Zona" value={u.Zona} />
            <Field label="Dirección" value={u.Dirección} />
            <Field label="Dir. exacta" value={u['Dirección Exacta']} />
            <Field label="Indicaciones" value={u.Indicaciones} />
            <Field label="Latitud" value={u.Latitud} />
            <Field label="Longitud" value={u.Longitud} />
            <Field label="Registro" value={u['Fecha de Registro']} />
            <Field label="Último perfil" value={u['Último Perfil']} />
            <Field label="Última sesión" value={u['Última Sesión']} />
            <Field label="Migrado" value={u.Migrado} />
          </div>
        </div>
      </div>

      {surveys.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><ClipboardList size={16} className="text-violet-600" /><h3 className="font-bold text-slate-700">Encuestas ({surveys.length})</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">{['Survey ID', 'Estado', 'Fecha respuesta'].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.Id} className="table-row">
                  <td className="px-3 py-2 font-mono text-slate-500">{s.SurveyId}</td>
                  <td className="px-3 py-2"><span className="badge-blue">{s.status_name || s.StatusId || '—'}</span></td>
                  <td className="px-3 py-2 text-slate-500">{s.AnsweredDate ? new Date(s.AnsweredDate).toLocaleDateString('es') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {news.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><Megaphone size={16} className="text-violet-600" /><h3 className="font-bold text-slate-700">Noticias/Promociones ({news.length})</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">{['Noticia ID', 'Estado', 'Clicks', 'Primer click', 'Último click'].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {news.map((n) => (
                <tr key={n.Id} className="table-row">
                  <td className="px-3 py-2 font-mono text-slate-500">{n.NewsAndPromotionId}</td>
                  <td className="px-3 py-2"><span className={n.Status >= 1 ? 'badge-green' : 'badge-gray'}>{n.Status >= 1 ? 'Visto' : 'No visto'}</span></td>
                  <td className="px-3 py-2 font-semibold">{n.ClickCount}</td>
                  <td className="px-3 py-2 text-slate-500">{n.FirstClickDate ? new Date(n.FirstClickDate).toLocaleDateString('es') : '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{n.LastClickDate ? new Date(n.LastClickDate).toLocaleDateString('es') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Editar */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil de usuario" size="lg">
        <div className="space-y-5">
          {/* Datos básicos */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Datos de cuenta</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nombre</label><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
              <div><label className="label">Apellido</label><input className="input" value={form.last_name || ''} onChange={(e) => set('last_name', e.target.value)} /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
              <div><label className="label">Teléfono</label><input className="input" value={form.mobil_number || ''} onChange={(e) => set('mobil_number', e.target.value)} /></div>
              <div><label className="label">Instagram</label><input className="input" value={form.instagram || ''} onChange={(e) => set('instagram', e.target.value)} /></div>
              <div><label className="label">Fecha nacimiento</label><input type="date" className="input" value={form.birth_date || ''} onChange={(e) => set('birth_date', e.target.value)} /></div>
            </div>
          </div>

          {/* Catálogos */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Perfil demográfico</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['gender_id', 'Género', 'Género'],
                ['marital_status_id', 'Estado Civil', 'Estado Civil'],
                ['role_house_id', 'Rol Familiar', 'Rol Familiar'],
                ['income_range_id', 'Rango de Ingreso', 'Rango de Ingreso'],
                ['professions_id', 'Profesión', 'Profesion'],
                ['number_children_id', 'Número de Hijos', 'Hijos'],
                ['level_academic_id', 'Nivel Académico', 'Nivel Academico'],
                ['frequency_activities_id', 'Frecuencia Actividad Física', 'Frecuencia Actividad'],
              ].map(([field, label, groupKeyword]) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <select className="input" value={form[field] || ''} onChange={(e) => set(field, e.target.value)}>
                    <option value="">— Sin cambio —</option>
                    {getGroup(groupKeyword).map((s) => <option key={s.Id} value={s.Id}>{s.Name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Ubicación</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Departamento</label>
                <select className="input" value={deptId || ''} onChange={(e) => { setDeptId(Number(e.target.value)); set('city_id', '') }}>
                  <option value="">— Selecciona —</option>
                  {(departments || []).map((d) => <option key={d.Id} value={d.Id}>{d.DepartmentName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Municipio</label>
                <select className="input" value={form.city_id || ''} onChange={(e) => set('city_id', e.target.value)} disabled={!deptId}>
                  <option value="">— Selecciona —</option>
                  {cities.map((c) => <option key={c.Id} value={c.Id}>{c.CityName}</option>)}
                </select>
              </div>
              <div><label className="label">Zona</label><input type="number" className="input" value={form.zone || ''} onChange={(e) => set('zone', e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Dirección</label><input className="input" value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Dirección exacta</label><input className="input" value={form.exact_address || ''} onChange={(e) => set('exact_address', e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Indicaciones</label><input className="input" value={form.instruction || ''} onChange={(e) => set('instruction', e.target.value)} /></div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setEditOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
