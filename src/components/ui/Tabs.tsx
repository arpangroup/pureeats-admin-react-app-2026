import { classNames } from '@/lib/format'

export interface TabItem {
  key: string
  label: string
  count?: number
}

export function Tabs({
  items,
  activeKey,
  onChange,
}: {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={classNames(
            'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            activeKey === item.key
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={classNames(
                'rounded-full px-1.5 text-xs',
                activeKey === item.key
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
