import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { walletService, type TransactionRow } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import { restaurantDetailPath, userDetailPath } from '@/lib/routes'
import { users } from '@/mocks/fixtures'

export default function WalletTransactionsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading } = useAsync(() => walletService.transactions(params), [params])

  function goToHolder(row: TransactionRow) {
    if (row.walletHolderType === 'User') {
      const user = users.find((u) => u.id === row.walletHolderId)
      if (user) navigate(userDetailPath(user))
      return
    }
    if (row.walletHolderType === 'Restaurant') {
      navigate(restaurantDetailPath(row.walletHolderId))
    }
  }

  const columns: Column<TransactionRow>[] = [
    {
      key: 'wallet',
      header: 'Wallet',
      render: (row) => (
        <button
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          onClick={(e) => {
            e.stopPropagation()
            goToHolder(row)
          }}
        >
          {row.walletName}
        </button>
      ),
    },
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
