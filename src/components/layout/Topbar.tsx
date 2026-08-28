import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/format'
import { IS_MOCK } from '@/config/env'

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2 text-xs font-medium">
        {IS_MOCK ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            <WifiOff size={13} /> Standalone demo data
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <Wifi size={13} /> Connected to live API
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {user ? initials(user.name) : '?'}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{user?.name}</span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
