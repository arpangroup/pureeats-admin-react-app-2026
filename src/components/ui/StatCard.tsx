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
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="card flex items-start justify-between gap-3 p-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
      <div className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        <Icon size={20} />
      </div>
    </div>
  )
}
