import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, UtensilsCrossed, X } from 'lucide-react'
import { classNames } from '@/lib/format'
import { readStorage, writeStorage } from '@/lib/storage'
import type { NavSection } from './navConfig'

const SIDEBAR_COLLAPSED_KEY = 'pureeats.sidebar.collapsed'

export function Sidebar({
  sections,
  roleLabel,
  mobileOpen = false,
  onCloseMobile,
}: {
  sections: NavSection[]
  roleLabel: string
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
  // Collapse/expand only applies on desktop (lg:) — the mobile drawer always
  // shows full width+labels regardless of this, via the `lg:` prefixed classes below.
  const [collapsed, setCollapsed] = useState(() => readStorage(SIDEBAR_COLLAPSED_KEY, false))

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      writeStorage(SIDEBAR_COLLAPSED_KEY, next)
      return next
    })
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900',
          'lg:relative lg:z-auto lg:flex lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        <div
          className={classNames(
            'flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800',
            collapsed && 'lg:justify-center lg:px-3',
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <UtensilsCrossed size={18} />
            </div>
            <div className={classNames('min-w-0', collapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">PureEats</p>
              <p className="truncate text-xs leading-tight text-slate-400 dark:text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {sections.map((section, i) => (
            <div key={section.title ?? i} className="mb-4">
              {section.title && (
                <p
                  className={classNames(
                    'mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500',
                    collapsed && 'lg:hidden',
                  )}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      classNames(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        collapsed && 'lg:justify-center lg:px-2',
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                      )
                    }
                  >
                    <item.icon size={17} className="shrink-0" />
                    <span className={classNames('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-16 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 lg:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  )
}
