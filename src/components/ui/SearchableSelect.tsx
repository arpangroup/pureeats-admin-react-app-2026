import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { classNames } from '@/lib/format'

interface SearchableSelectProps<T> {
  items: T[]
  value: T | null
  onChange: (item: T) => void
  getId: (item: T) => string | number
  getLabel: (item: T) => string
  getDescription?: (item: T) => string | null | undefined
  placeholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
  /**
   * Controlled/server-search mode: called as the user types, debounced by the caller if needed.
   * When given, `items` is trusted as already matching the current query (e.g. a live customer
   * search) and is rendered as-is, with no client-side filtering. Omit for a small, fully-loaded
   * list (e.g. restaurants) where filtering `items` by label locally is enough.
   */
  onQueryChange?: (query: string) => void
}

/** A typeahead combobox over a list of items — same interaction pattern as LocationPickerMap's address search, generalized for any entity (restaurant, customer, ...) instead of a plain <select> that's unwieldy once there are more than a handful of options. */
export function SearchableSelect<T>({
  items,
  value,
  onChange,
  getId,
  getLabel,
  getDescription,
  placeholder = 'Search…',
  emptyMessage = 'No matches',
  loading = false,
  disabled = false,
  onQueryChange,
}: SearchableSelectProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(value ? getLabel(value) : '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Keep the input text in sync with an externally-changed value (e.g. a default selection loading in) while the dropdown is closed — don't fight the user's own typing while it's open.
  useEffect(() => {
    if (!open) setQuery(value ? getLabel(value) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const filtered = useMemo(() => {
    if (onQueryChange) return items
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => getLabel(item).toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, onQueryChange])

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value ? getLabel(value) : '')
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function pick(item: T) {
    onChange(item)
    setQuery(getLabel(item))
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleQueryChange(next: string) {
    setQuery(next)
    setOpen(true)
    setActiveIndex(-1)
    onQueryChange?.(next)
  }

  const showDropdown = open && !disabled

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-9 pr-8"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (!showDropdown || filtered.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => (i + 1) % filtered.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (activeIndex >= 0) pick(filtered[activeIndex])
            } else if (e.key === 'Escape') {
              setOpen(false)
              setQuery(value ? getLabel(value) : '')
            }
          }}
        />
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
      {showDropdown && (
        <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {loading && <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">Searching…</li>}
          {!loading && filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</li>}
          {!loading &&
            filtered.map((item, i) => {
              const isSelected = value !== null && getId(item) === getId(value)
              const description = getDescription?.(item)
              return (
                <li key={getId(item)}>
                  <button
                    type="button"
                    className={classNames(
                      'flex w-full flex-col items-start px-3 py-2 text-left text-sm',
                      i === activeIndex ? 'bg-brand-50 dark:bg-brand-500/10' : isSelected ? 'bg-slate-50 dark:bg-slate-700/60' : 'hover:bg-slate-50 dark:hover:bg-slate-700',
                    )}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(item)}
                  >
                    <span className="text-slate-700 dark:text-slate-200">{getLabel(item)}</span>
                    {description && <span className="text-xs text-slate-400 dark:text-slate-500">{description}</span>}
                  </button>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
