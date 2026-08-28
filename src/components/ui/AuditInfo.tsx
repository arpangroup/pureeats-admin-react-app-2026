import { users } from '@/mocks/fixtures'
import { formatDate } from '@/lib/format'
import type { Id } from '@/types/common'

function resolveUserName(id: Id | null | undefined): string {
  if (!id) return 'System'
  return users.find((u) => u.id === id)?.name ?? `User #${id}`
}

interface AuditInfoProps {
  createdAt: string
  updatedAt: string
  createdBy?: Id | null
  updatedBy?: Id | null
}

export function AuditInfo({ createdAt, updatedAt, createdBy, updatedBy }: AuditInfoProps) {
  return (
    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <AuditField label="Created At" value={formatDate(createdAt)} />
      <AuditField label="Created By" value={resolveUserName(createdBy)} />
      <AuditField label="Updated At" value={formatDate(updatedAt)} />
      <AuditField label="Updated By" value={resolveUserName(updatedBy)} />
    </div>
  )
}

function AuditField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-600 dark:text-slate-300">{value}</p>
    </div>
  )
}
