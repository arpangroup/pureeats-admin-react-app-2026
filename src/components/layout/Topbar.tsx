import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, Moon, ShieldOff, Sun, Wifi, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { initials, timeAgo } from '@/lib/format'
import { IS_MOCK } from '@/config/env'
import { useAsync } from '@/hooks/useAsync'
import { notificationService } from '@/services/simpleServices'
import { EmptyState } from '@/components/ui/Feedback'

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, logoutAll } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { data: alerts, reload: reloadAlerts } = useAsync(() => notificationService.list(), [])
  const unreadCount = (alerts ?? []).filter((a) => !a.isRead).length

  async function handleAlertClick(id: number, isRead: boolean) {
    if (!isRead) {
      await notificationService.markRead(id)
      reloadAlerts()
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleLogoutAll() {
    await logoutAll()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-xs font-medium">
        {IS_MOCK ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <WifiOff size={13} /> Standalone demo data
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Wifi size={13} /> Connected to live API
          </span>
        )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!alerts || alerts.length === 0 ? (
                    <EmptyState title="No notifications" />
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {alerts.slice(0, 8).map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => handleAlertClick(alert.id, alert.isRead)}
                          className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${alert.isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-brand-600'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{alert.data.title}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{alert.data.body}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(alert.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNotifOpen(false)
                    navigate('/admin/notifications')
                  }}
                  className="block w-full border-t border-slate-100 px-3 py-2 text-center text-sm font-medium text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:text-brand-400 dark:hover:bg-slate-800/60"
                >
                  View all
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              {user ? initials(user.name) : '?'}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">{user?.name}</span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={15} /> Sign out
                </button>
                {!IS_MOCK && (
                  <button
                    onClick={handleLogoutAll}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <ShieldOff size={15} /> Sign out of all devices
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
