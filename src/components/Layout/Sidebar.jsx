import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectCurrentUser } from '../../store/authSlice'
import {
  LayoutDashboard, Users, Map, ClipboardList, Megaphone,
  Settings, MapPin, Mail, LogOut, Package, ShieldCheck, FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/map', icon: Map, label: 'Mapa' },
  { to: '/surveys', icon: ClipboardList, label: 'Encuestas' },
  { to: '/news', icon: Megaphone, label: 'Noticias' },
  { to: '/settings', icon: Settings, label: 'Catálogos' },
  { to: '/locations', icon: MapPin, label: 'Ubicaciones' },
  { to: '/contact', icon: Mail, label: 'Contáctenos' },
]

const navBottom = [
  { to: '/reports', icon: FileSpreadsheet, label: 'Cruce de Datos' },
  { to: '/admin-users', icon: ShieldCheck, label: 'Usuarios Admin' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-20 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50">
          <Package size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">PulpeyBox</p>
          <p className="text-slate-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Separador */}
        <div className="border-t border-white/10 my-3" />
        <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Herramientas</p>

        {navBottom.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.user_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.user_name || 'Admin'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.role || user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
