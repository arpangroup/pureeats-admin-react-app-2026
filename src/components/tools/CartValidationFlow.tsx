import { AlertTriangle, CheckCircle2, Info, MinusCircle, Sparkles, XCircle } from 'lucide-react'
import { classNames } from '@/lib/format'
import type { RuleResult, RuleStatus } from '@/lib/cartValidation'

const STATUS_STYLE: Record<RuleStatus, { icon: typeof CheckCircle2; badge: string; ring: string; text: string }> = {
  pass: { icon: CheckCircle2, badge: 'bg-emerald-500', ring: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300' },
  fail: { icon: XCircle, badge: 'bg-rose-500', ring: 'border-rose-200 dark:border-rose-500/30', text: 'text-rose-700 dark:text-rose-300' },
  warn: { icon: AlertTriangle, badge: 'bg-amber-500', ring: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-300' },
  info: { icon: Info, badge: 'bg-sky-500', ring: 'border-sky-200 dark:border-sky-500/30', text: 'text-sky-700 dark:text-sky-300' },
  skipped: { icon: MinusCircle, badge: 'bg-slate-300 dark:bg-slate-600', ring: 'border-slate-200 dark:border-slate-700', text: 'text-slate-400 dark:text-slate-500' },
}

const CATEGORY_LABEL: Record<RuleResult['category'], string> = {
  restaurant: 'Store',
  items: 'Items',
  economics: 'Order economics',
  coupon: 'Coupon',
  payment: 'Payment',
  pricing: 'Pricing',
  account: 'Account',
}

export function CartValidationFlow({ rules, blockingRuleId }: { rules: RuleResult[]; blockingRuleId: string | null }) {
  const blockedIndex = blockingRuleId ? rules.findIndex((r) => r.id === blockingRuleId) : -1

  return (
    <ol className="relative">
      {rules.map((r, i) => {
        const style = STATUS_STYLE[r.status]
        const Icon = style.icon
        const isBlockingStop = r.id === blockingRuleId
        const unreachable = blockedIndex >= 0 && i > blockedIndex && r.status !== 'fail'
        return (
          <li key={r.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < rules.length - 1 && (
              <span className={classNames('absolute left-[15px] top-8 h-full w-px', unreachable ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-800')} />
            )}
            <span className={classNames('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white', style.badge, unreachable && 'opacity-40')}>
              <Icon size={16} />
            </span>
            <div className={classNames('flex-1 rounded-xl border px-4 py-3', style.ring, unreachable && 'opacity-50')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{r.number}</span>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.title}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {CATEGORY_LABEL[r.category]}
                </span>
                {r.implemented === 'suggested' && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    <Sparkles size={10} /> Suggested rule
                  </span>
                )}
                {isBlockingStop && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">Blocks order placement</span>
                )}
              </div>
              <p className={classNames('mt-1 text-sm', style.text)}>{r.summary}</p>
              {r.detail && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{r.detail}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
