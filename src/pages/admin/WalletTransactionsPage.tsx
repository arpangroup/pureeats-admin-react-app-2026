import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { walletService, type TransactionRow } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'

export default function WalletTransactionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading } = useAsync(() => walletService.transactions(params), [params])

  const columns: Column<TransactionRow>[] = [
    { key: 'wallet', header: 'Wallet', render: (row) => <span className="font-medium text-slate-800">{row.walletName}</span> },
    { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'credit' ? 'green' : 'red'}>{row.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'source', header: 'Source', render: (row) => `${row.payableType} #${row.payableId}` },
    { key: 'confirmed', header: 'Confirmed', render: (row) => (row.confirmed ? <Badge tone="green">Confirmed</Badge> : <Badge tone="amber">Pending</Badge>) },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Wallet Transactions" description="Every credit and debit across customer and restaurant wallets." />
      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search transactions…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No transactions found"
        pagination={data ?? undefined}
        onPageChange={setPage}
      />
    </div>
  )
}
