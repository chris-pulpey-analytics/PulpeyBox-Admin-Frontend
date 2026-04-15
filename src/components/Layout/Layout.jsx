import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function getSavedCollapsed() {
  try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(getSavedCollapsed)

  const toggle = () =>
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className="flex-1 min-h-screen bg-slate-50 transition-all duration-300"
        style={{ marginLeft: collapsed ? '4rem' : '16rem' }}
      >
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
