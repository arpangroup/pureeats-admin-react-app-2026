import { useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field, Select, TextInput } from '@/components/ui/FormControls'
import { EmptyState } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import type { Paginated } from '@/types/common'
import type { SecurityBlockType } from '@/types/audit'

interface FetchParams {
  page: number
  perPage: number
  userId?: number
  blockType?: SecurityBlockType
}

const blockTypeOptions: SecurityBlockType[] = ['IP', 'DEVICE', 'EMAIL', 'PHONE', 'USER']

export function AuditListView<T extends { id: number }>({
  title,
  description,
  columns,
  fetchPage,
  filter,
}: {
  title: string
  description?: string
  columns: Column<T>[]
  fetchPage: (params: FetchParams) => Promise<Paginated<T>>
  filter: 'userId' | 'blockType' | 'none'
}) {
  const [userIdInput, setUserIdInput] = useState('')
  const [blockTypeInput, setBlockTypeInput] = useState<SecurityBlockType | ''>('')
  const [appliedFilter, setAppliedFilter] = useState<{ userId?: number; blockType?: SecurityBlockType }>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [data, setData] = useState<Paginated<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(page: number, appliedOverride?: { userId?: number; blockType?: SecurityBlockType }) {
    const applied = appliedOverride ?? appliedFilter
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchPage({ page, perPage: 10, ...applied })
      setData(result)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Failed to load data')
      setData(null)
    } finally {
      setIsLoading(false)
      setHasSearched(true)
    }
  }

  function handleSearch() {
    const applied =
      filter === 'userId'
        ? { userId: userIdInput.trim() ? Number(userIdInput.trim()) : undefined }
        : filter === 'blockType'
          ? { blockType: blockTypeInput || undefined }
          : {}
    setAppliedFilter(applied)
    load(1, applied)
  }

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="card mb-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        {filter === 'userId' && (
          <Field label="User ID" hint="Leave blank to fetch across all users">
            <TextInput
              type="number"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="e.g. 1"
              className="max-w-[180px]"
            />
          </Field>
        )}
        {filter === 'blockType' && (
          <Field label="Block type">
            <Select value={blockTypeInput} onChange={(e) => setBlockTypeInput(e.target.value as SecurityBlockType | '')} className="max-w-[180px]">
              <option value="">All types</option>
              {blockTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
          <Search size={16} /> {filter === 'none' ? 'Load' : 'Search'}
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      {!hasSearched ? (
        <div className="card">
          <EmptyState
            title="No data loaded yet"
            description={
              filter === 'none'
                ? 'Click Load to fetch the latest records.'
                : 'Set a filter above and click Search to fetch matching records.'
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No records found"
          pagination={data ?? undefined}
          onPageChange={(page) => load(page)}
        />
      )}
    </div>
  )
}
