import { useState } from 'react'
import { Bell, BellOff, BellRing, ChevronDown, LogOut, Menu, Moon, ShieldOff, Sun, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useNewOrderAlerts } from '@/hooks/useNewOrderAlerts'
import { NEW_ORDER_ALERT_INTERVAL_OPTIONS } from '@/lib/newOrderAlertSettings'
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
  const [alertSettingsOpen, setAlertSettingsOpen] = useState(false)
  const { data: alerts, reload: reloadAlerts } = useAsync(() => notificationService.list(), [])
  const unreadCount = (alerts ?? []).filter((a) => !a.isRead).length
  const canAutoFetchOrders = user?.role === 'admin' || user?.role === 'employee' || user?.role === 'restaurant-owner'
  const { settings: alertSettings, updateSettings: updateAlertSettings } = useNewOrderAlerts()

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

        {canAutoFetchOrders && (
          <div className="relative">
            <button
              onClick={() => setAlertSettingsOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="New order alert settings"
              title={alertSettings.enabled ? 'New order alerts on' : 'New order alerts off'}
            >
              {alertSettings.enabled ? <BellRing size={18} className="text-brand-600 dark:text-brand-400" /> : <BellOff size={18} />}
            </button>

            {alertSettingsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAlertSettingsOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-lg border border-slate-100 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">New order alerts</p>

                  <label className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Auto-fetch new orders</span>
                    <input
                      type="checkbox"
                      checked={alertSettings.enabled}
                      onChange={(e) => updateAlertSettings({ enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
                    />
                  </label>

                  <label className="flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      {alertSettings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Play sound
                    </span>
                    <input
                      type="checkbox"
                      checked={alertSettings.soundEnabled}
                      onChange={(e) => updateAlertSettings({ soundEnabled: e.target.checked })}
                      disabled={!alertSettings.enabled}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
                    />
                  </label>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Check every</span>
                    <select
                      value={alertSettings.intervalSeconds}
                      onChange={(e) => updateAlertSettings({ intervalSeconds: Number(e.target.value) })}
                      disabled={!alertSettings.enabled}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {NEW_ORDER_ALERT_INTERVAL_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}s
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
