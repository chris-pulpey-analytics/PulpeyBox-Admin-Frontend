import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectCurrentUser } from '../../store/authSlice'
import {
  LayoutDashboard, Users, Map, ClipboardList, Megaphone,
  Settings, MapPin, Mail, LogOut, Package, ShieldCheck,
  FileSpreadsheet, Menu,
} from 'lucide-react'
import toast from 'react-hot-toast'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users',     icon: Users,           label: 'Usuarios' },
  { to: '/map',       icon: Map,             label: 'Mapa' },
  { to: '/surveys',   icon: ClipboardList,   label: 'Encuestas' },
  { to: '/news',      icon: Megaphone,       label: 'Noticias' },
  { to: '/settings',  icon: Settings,        label: 'Catálogos' },
  { to: '/locations', icon: MapPin,          label: 'Ubicaciones' },
  { to: '/contact',   icon: Mail,            label: 'Contáctenos' },
]

const navBottom = [
  { to: '/reports',     icon: FileSpreadsheet, label: 'Cruce de Datos' },
  { to: '/admin-users', icon: ShieldCheck,     label: 'Usuarios Admin' },
]

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <div className="relative group/tt">
      <NavLink
        to={to}
        className={({ isActive }) =>
          collapsed
            ? `flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-white bg-violet-600 shadow-lg shadow-violet-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`
            : `sidebar-link ${isActive ? 'active' : ''}`
        }
      >
        <Icon size={18} />
        {!collapsed && <span>{label}</span>}
      </NavLink>

      {/* Tooltip (only when collapsed) */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                        opacity-0 group-hover/tt:opacity-100 transition-opacity duration-150">
          <div className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
                          whitespace-nowrap shadow-xl">
            {label}
          </div>
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2
                          border-4 border-transparent border-r-slate-800" />
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900 flex flex-col z-20 select-none
                  transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo + hamburger */}
      <div
        className={`flex items-center border-b border-white/10 shrink-0
                    ${collapsed ? 'flex-col gap-3 px-3 py-4' : 'gap-3 px-5 py-5'}`}
      >
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center
                        shadow-lg shadow-violet-900/50 shrink-0">
          <Package size={18} className="text-white" />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">PulpeyBox</p>
            <p className="text-slate-500 text-xs">Admin Panel</p>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10
                     transition-all shrink-0"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed} />
        ))}

        {/* Separador */}
        <div className="border-t border-white/10 my-3" />

        {!collapsed && (
          <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Herramientas
          </p>
        )}

        {navBottom.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed} />
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center
                            text-white text-xs font-bold shrink-0">
              {user?.user_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user?.user_name || 'Admin'}
              </p>
              <p className="text-slate-500 text-xs truncate">{user?.role || user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center
                            text-white text-xs font-bold">
              {user?.user_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        )}

        {/* Logout with tooltip when collapsed */}
        <div className="relative group/tt">
          <button
            onClick={handleLogout}
            className={`text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all
                        ${collapsed
                          ? 'flex items-center justify-center h-10 w-10 mx-auto rounded-xl'
                          : 'sidebar-link w-full'}`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>

          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                            opacity-0 group-hover/tt:opacity-100 transition-opacity duration-150">
              <div className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5
                              rounded-lg whitespace-nowrap shadow-xl">
                Cerrar sesión
              </div>
              <div className="absolute right-full top-1/2 -translate-y-1/2
                              border-4 border-transparent border-r-slate-800" />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
