import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Link2, type LucideIcon } from 'lucide-react'
import { classNames } from '@/lib/format'

interface SectionCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  children: ReactNode
  /**
   * Makes the section deep-linkable: renders it with this id, shows a small "copy link" icon next to
   * the title, and - when the page is opened with #{anchorId} - scrolls it into view and briefly
   * highlights it. Used by the Settings page (see lib/settingsLinks.ts).
   */
  anchorId?: string
}

export function SectionCard({ title, description, icon: Icon, actions, children, anchorId }: SectionCardProps) {
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const [highlighted, setHighlighted] = useState(false)

  useEffect(() => {
    if (!anchorId || window.location.hash !== `#${anchorId}`) return
    // Settings content renders after its data loads - this runs once the card itself exists.
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlighted(true)
    const t = window.setTimeout(() => setHighlighted(false), 2500)
    return () => window.clearTimeout(t)
  }, [anchorId])

  async function copyLink() {
    if (!anchorId) return
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`
    try {
      await window.navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link', url)
    }
    window.history.replaceState(null, '', `#${anchorId}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section
      ref={ref}
      id={anchorId}
      className={classNames('card scroll-mt-20 p-5 transition-shadow', highlighted && 'ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-slate-950')}
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Icon size={16} />
            </span>
          )}
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {title}
              {anchorId && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  title={copied ? 'Link copied' : 'Copy link to this section'}
                  aria-label={copied ? 'Link copied' : `Copy link to the ${title} section`}
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Link2 size={13} />}
                </button>
              )}
            </h3>
            {description && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
