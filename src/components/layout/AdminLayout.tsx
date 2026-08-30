import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { adminNav } from './navConfig'

export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <div className="print:hidden">
        <Sidebar sections={adminNav} roleLabel="Admin Panel" mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
