import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Feedback'
import { Switch } from '@/components/ui/FormControls'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { moduleService } from '@/services/simpleServices'
import { formatDate } from '@/lib/format'
import type { Module } from '@/types/entities'

export default function ModulesPage() {
  const { data, isLoading, reload } = useAsync(() => moduleService.list({ perPage: 50 }), [])
  const [pendingId, setPendingId] = useState<number | null>(null)

  async function toggle(row: Module) {
    setPendingId(row.id)
    try {
      await moduleService.update(row.id, { isActive: !row.isActive })
      reload()
    } finally {
      setPendingId(null)
    }
  }

  const columns: Column<Module>[] = [
    {
      key: 'name',
      header: 'Module',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-400">{row.description}</p>
        </div>
      ),
    },
    { key: 'version', header: 'Version', render: (row) => <Badge tone="slate">v{row.version}</Badge> },
    { key: 'installed', header: 'Installed', render: (row) => (row.isInstalled ? <Badge tone="green">Installed</Badge> : <Badge tone="amber">Not installed</Badge>) },
    { key: 'updated', header: 'Last updated', render: (row) => (row.updateDate ? formatDate(row.updateDate, false) : '—') },
    {
      key: 'active',
      header: 'Enabled',
      render: (row) => (
        <Switch checked={row.isActive} onChange={() => toggle(row)} disabled={!row.isInstalled || pendingId === row.id} />
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Modules" description="Optional add-on modules that extend PureEats." />
      <DataTable columns={columns} rows={data?.data ?? []} rowKey={(row) => row.id} isLoading={isLoading} emptyTitle="No modules found" />
    </div>
  )
}
