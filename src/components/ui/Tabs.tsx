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
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={classNames(
            'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            activeKey === item.key
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={classNames(
                'rounded-full px-1.5 text-xs',
                activeKey === item.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
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
