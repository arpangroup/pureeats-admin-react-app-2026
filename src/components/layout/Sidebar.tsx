import { NavLink } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { classNames } from '@/lib/format'
import type { NavSection } from './navConfig'

export function Sidebar({ sections, roleLabel }: { sections: NavSection[]; roleLabel: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <UtensilsCrossed size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-800">PureEats</p>
          <p className="text-xs leading-tight text-slate-400">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="mb-4">
            {section.title && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                    )
                  }
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
