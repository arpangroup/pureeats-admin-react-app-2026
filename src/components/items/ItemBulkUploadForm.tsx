import { useRef, useState } from 'react'
import { CheckCircle2, Download, UploadCloud, XCircle } from 'lucide-react'
import { itemService } from '@/services/itemService'
import { itemCategories, restaurants } from '@/mocks/fixtures'
import type { Item } from '@/types/entities'

const BASE_COLUMNS = ['name', 'description', 'price', 'oldPrice', 'itemCategoryId', 'isVeg'] as const

interface ParsedRow {
  name: string
  description: string
  price: number
  oldPrice: number | null
  itemCategoryId: number
  restaurantId: number
  isVeg: boolean
}

interface RowResult {
  row: ParsedRow
  status: 'pending' | 'success' | 'error'
  message?: string
}

// Same lightweight comma-split parser as RestaurantBulkUploadForm — good enough
// for these plain text/number columns, not a general-purpose RFC 4180 parser.
function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      cells.push(current.trim())
      return cells
    })
}

function downloadSampleCsv(includeRestaurantColumn: boolean) {
  const columns = includeRestaurantColumn ? ['restaurantId', ...BASE_COLUMNS] : BASE_COLUMNS
  const sampleRow = includeRestaurantColumn
    ? `${restaurants[0]?.id ?? 1},Paneer Wrap,Grilled paneer with mint chutney,179,,${itemCategories[0]?.id ?? 1},true`
    : `Paneer Wrap,Grilled paneer with mint chutney,179,,${itemCategories[0]?.id ?? 1},true`
  const sample = [columns.join(','), sampleRow].join('\n')
  const blob = new Blob([sample], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'items-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ItemBulkUploadForm({ restaurantId, onImported }: { restaurantId?: number; onImported?: () => void }) {
  const requiresRestaurantColumn = !restaurantId
  const columns = requiresRestaurantColumn ? ['restaurantId', ...BASE_COLUMNS] : BASE_COLUMNS

  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<RowResult[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(file: File) {
    setParseError(null)
    setFileName(file.name)
    const text = await file.text()
    const [header, ...dataLines] = parseCsv(text)
    if (!header) {
      setParseError('The file is empty.')
      setRows([])
      return
    }
    const normalizedHeader = header.map((h) => h.trim())
    const missing = columns.filter((c) => !normalizedHeader.includes(c))
    if (missing.length) {
      setParseError(`Missing required column(s): ${missing.join(', ')}`)
      setRows([])
      return
    }

    const parsed: RowResult[] = dataLines.map((cells) => {
      const record: Record<string, string> = {}
      normalizedHeader.forEach((col, i) => {
        record[col] = cells[i] ?? ''
      })
      return {
        row: {
          name: record.name,
          description: record.description ?? '',
          price: Number(record.price) || 0,
          oldPrice: record.oldPrice ? Number(record.oldPrice) : null,
          itemCategoryId: Number(record.itemCategoryId) || itemCategories[0]?.id || 1,
          restaurantId: restaurantId ?? (Number(record.restaurantId) || restaurants[0]?.id || 1),
          isVeg: record.isVeg?.toLowerCase() !== 'false',
        },
        status: 'pending',
      }
    })
    setRows(parsed)
  }

  async function handleImport() {
    setIsUploading(true)
    const next = [...rows]
    for (let i = 0; i < next.length; i += 1) {
      const entry = next[i]
      if (!entry.row.name || !entry.row.price) {
        next[i] = { ...entry, status: 'error', message: 'Name and price are required.' }
        setRows([...next])
        continue
      }
      try {
        const now = new Date().toISOString()
        const payload: Partial<Item> = {
          restaurantId: entry.row.restaurantId,
          itemCategoryId: entry.row.itemCategoryId,
          name: entry.row.name,
          desc: entry.row.description,
          price: entry.row.price,
          oldPrice: entry.row.oldPrice,
          image: '',
          placeholderImage: '',
          isRecommended: false,
          isPopular: false,
          isNew: true,
          isActive: true,
          isVeg: entry.row.isVeg,
          addonCategoryIds: [],
          createdAt: now,
          updatedAt: now,
        }
        await itemService.create(payload)
        next[i] = { ...entry, status: 'success' }
        onImported?.()
      } catch (err) {
        next[i] = { ...entry, status: 'error', message: (err as { message?: string })?.message ?? 'Failed to create' }
      }
      setRows([...next])
    }
    setIsUploading(false)
  }

  const successCount = rows.filter((r) => r.status === 'success').length
  const errorCount = rows.filter((r) => r.status === 'error').length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Required columns: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">{columns.join(', ')}</code>
        </p>
        <button className="btn-secondary shrink-0" onClick={() => downloadSampleCsv(requiresRestaurantColumn)}>
          <Download size={15} /> Sample CSV
        </button>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
      >
        <UploadCloud size={28} />
        <p className="text-sm font-medium">{fileName ?? 'Click or drop a .csv file to upload'}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
      {parseError && <p className="mt-3 text-sm text-rose-500">{parseError}</p>}

      {rows.length > 0 && (
        <>
          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Restaurant</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.row.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{restaurants.find((res) => res.id === r.row.restaurantId)?.name ?? r.row.restaurantId}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{itemCategories.find((c) => c.id === r.row.itemCategoryId)?.name ?? r.row.itemCategoryId}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">₹{r.row.price}</td>
                    <td className="px-3 py-2">
                      {r.status === 'pending' && <span className="text-xs text-slate-400 dark:text-slate-500">Pending</span>}
                      {r.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} /> Created
                        </span>
                      )}
                      {r.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400" title={r.message}>
                          <XCircle size={13} /> {r.message ?? 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {rows.length} row{rows.length !== 1 ? 's' : ''} parsed
              {(successCount > 0 || errorCount > 0) && ` — ${successCount} created, ${errorCount} failed`}
            </p>
            <button className="btn-primary" onClick={handleImport} disabled={isUploading}>
              {isUploading ? 'Importing…' : 'Import items'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
