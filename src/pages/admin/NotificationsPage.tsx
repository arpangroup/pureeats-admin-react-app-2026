import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState } from '@/components/ui/Feedback'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { notificationService } from '@/services/simpleServices'
import { timeAgo } from '@/lib/format'

export default function NotificationsPage() {
  const { data, isLoading, reload } = useAsync(() => notificationService.list({ perPage: 50 }), [])
  const alerts = data?.data ?? []

  async function markRead(id: number) {
    await notificationService.update(id, { isRead: true })
    reload()
  }

  return (
    <div>
      <PageHeader title="Notifications" description="System alerts for approvals, payouts and low ratings." />
      {isLoading ? (
        <LoadingBlock />
      ) : alerts.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications right now." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => !alert.isRead && markRead(alert.id)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.isRead ? 'bg-slate-200' : 'bg-brand-600'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{alert.data.title}</p>
                  <p className="text-sm text-slate-500">{alert.data.body}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-slate-400">{timeAgo(alert.createdAt)}</span>
                {!alert.isRead && <Badge tone="blue">New</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
