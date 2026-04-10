import { useParams, useNavigate } from 'react-router-dom'
import { useGetUserQuery } from '../../store/api/usersApi'
import { ArrowLeft, User, MapPin, ClipboardList, Megaphone } from 'lucide-react'

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

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return <div className="text-center py-20 text-slate-400">Usuario no encontrado</div>

  const u = data.user || {}
  const surveys = data.surveys || []
  const news = data.news || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{u.Nombre} {u.Apellido}</h1>
          <p className="text-slate-500 text-sm">ID: {u.Id} · {u['Correo Electrónico']}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-violet-600" /><h3 className="font-bold text-slate-700">Ubicación y fechas</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="País" value={u.País} />
            <Field label="Departamento" value={u.Departamento} />
            <Field label="Municipio" value={u.Municipio} />
            <Field label="Zona" value={u.Zona} />
            <Field label="Dirección" value={u.Dirección} />
            <Field label="Dir. exacta" value={u['Dirección Exacta']} />
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
    </div>
  )
}
