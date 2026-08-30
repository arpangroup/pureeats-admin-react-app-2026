import { Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState } from '@/components/ui/Feedback'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { notificationService } from '@/services/simpleServices'
import { timeAgo } from '@/lib/format'

export default function NotificationsPage() {
  const { data: alerts, isLoading, reload } = useAsync(() => notificationService.list(), [])
  const hasUnread = (alerts ?? []).some((a) => !a.isRead)

  async function markRead(id: number) {
    await notificationService.markRead(id)
    reload()
  }

  async function markAllRead() {
    await notificationService.markAllRead()
    reload()
  }

  async function remove(id: number) {
    await notificationService.remove(id)
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts for approvals, payouts and low ratings."
        actions={
          hasUnread ? (
            <button className="btn-secondary" onClick={markAllRead}>Mark all as read</button>
          ) : undefined
        }
      />
      {isLoading ? (
        <LoadingBlock />
      ) : !alerts || alerts.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications right now." />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <button
                onClick={() => !alert.isRead && markRead(alert.id)}
                className="flex flex-1 items-start gap-3 text-left"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-brand-600'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{alert.data.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{alert.data.body}</p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(alert.createdAt)}</span>
                {!alert.isRead && <Badge tone="blue">New</Badge>}
                <button
                  onClick={() => remove(alert.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  aria-label="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
