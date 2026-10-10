import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { classNames } from '@/lib/format'

function format(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mmss = `${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

/** Live countdown to `to`; keeps counting as a negative delay ("-03:12 late") once passed. */
export function Countdown({ to, label, lateLabel = 'late' }: { to: string | null | undefined; label?: string; lateLabel?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!to) return null
  const due = new Date(to).getTime()
  if (Number.isNaN(due)) return null
  const left = due - now
  const late = left < 0
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        late ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
      )}
    >
      <Timer size={11} />
      {label && <span className="font-medium">{label}</span>}
      {late ? `-${format(left)} ${lateLabel}` : format(left)}
    </span>
  )
}
