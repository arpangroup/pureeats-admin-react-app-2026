import { useMemo, useState } from 'react'
import { CheckCircle2, Send, Users as UsersIcon, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field, SearchInput, TextInput, Textarea } from '@/components/ui/FormControls'
import { SectionCard } from '@/components/ui/SectionCard'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { users } from '@/mocks/fixtures'
import { pushNotificationService } from '@/services/simpleServices'
import { initials } from '@/lib/format'
import type { User } from '@/types/entities'

export default function SendNotificationPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [target, setTarget] = useState<'all' | 'selected'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User[]>([])
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => !selected.some((s) => s.id === u.id))
      .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 8)
  }, [search, selected])

  const canSend = title.trim() && message.trim() && (target === 'all' || selected.length > 0)

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    setSentCount(null)
    try {
      const result = await pushNotificationService.send({
        title: title.trim(),
        message: message.trim(),
        image,
        url: url.trim() || null,
        target,
        userIds: selected.map((u) => u.id),
      })
      setSentCount(result.recipientCount)
      setTitle('')
      setMessage('')
      setImage(null)
      setUrl('')
      setSelected([])
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader title="Send Notification" description="Compose and send a push notification to your users." />

      {sentCount !== null && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={16} /> Sent to {sentCount} recipient{sentCount !== 1 ? 's' : ''}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard title="Notification content">
            <div className="space-y-4">
              <ImageUpload value={image} onChange={setImage} fullWidth label="Notification image" hint="Optional — shown as a banner in the notification." />
              <Field label="Title" required>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend offer is live!" maxLength={80} />
              </Field>
              <Field label="Message" required>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write the notification body…" maxLength={240} />
              </Field>
              <Field label="URL" hint="Optional deep link or web URL opened when the notification is tapped.">
                <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Recipients" icon={UsersIcon}>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                <input type="radio" name="target" checked={target === 'all'} onChange={() => setTarget('all')} className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">All users</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{users.length} recipients</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                <input type="radio" name="target" checked={target === 'selected'} onChange={() => setTarget('selected')} className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Selected users</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Choose specific recipients</p>
                </div>
              </label>
            </div>

            {target === 'selected' && (
              <div className="mt-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
                {searchResults.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelected((prev) => [...prev, u])
                          setSearch('')
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                          {initials(u.name)}
                        </span>
                        <span className="truncate text-slate-700 dark:text-slate-300">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selected.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {u.name}
                        <button onClick={() => setSelected((prev) => prev.filter((s) => s.id !== u.id))} className="rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <button className="btn-primary w-full" onClick={handleSend} disabled={!canSend || sending}>
            <Send size={16} /> {sending ? 'Sending…' : 'Send notification'}
          </button>
        </div>
      </div>
    </div>
  )
}
