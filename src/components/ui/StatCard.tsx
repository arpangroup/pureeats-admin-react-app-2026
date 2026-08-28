import type { LucideIcon } from 'lucide-react'
import { classNames } from '@/lib/format'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  sub,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'brand' | 'green' | 'blue' | 'amber' | 'rose'
  sub?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    blue: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  }

  return (
    <div className="card flex items-start justify-between gap-3 p-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
      <div className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        <Icon size={20} />
      </div>
    </div>
  )
}
