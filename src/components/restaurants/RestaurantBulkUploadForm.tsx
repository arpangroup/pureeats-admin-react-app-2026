import { useRef, useState } from 'react'
import { CheckCircle2, Download, UploadCloud, XCircle } from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { locations } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

const COLUMNS = ['name', 'contactNumber', 'address', 'pincode', 'locationId', 'openingTime', 'closingTime', 'minOrderPrice'] as const

interface ParsedRow {
  name: string
  contactNumber: string
  address: string
  pincode: string
  locationId: number
  openingTime: string
  closingTime: string
  minOrderPrice: number
}

interface RowResult {
  row: ParsedRow
  status: 'pending' | 'success' | 'error'
  message?: string
}

// No CSV parsing library in the project — this is a simple comma-split with
// light double-quote support, enough for the plain address/name fields this
// form expects (not a general-purpose RFC 4180 parser).
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

function downloadSampleCsv() {
  const sample = [
    COLUMNS.join(','),
    'Curry Leaf Kitchen,9811100099,"22, Main Road, Koramangala",560095,1,09:00,22:00,99',
  ].join('\n')
  const blob = new Blob([sample], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'restaurants-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function RestaurantBulkUploadForm({ onImported }: { onImported?: () => void }) {
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
    const missing = COLUMNS.filter((c) => !normalizedHeader.includes(c))
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
          contactNumber: record.contactNumber,
          address: record.address,
          pincode: record.pincode,
          locationId: Number(record.locationId) || locations[0]?.id || 1,
          openingTime: record.openingTime || '09:00',
          closingTime: record.closingTime || '22:00',
          minOrderPrice: Number(record.minOrderPrice) || 99,
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
      if (!entry.row.name || !entry.row.contactNumber) {
        next[i] = { ...entry, status: 'error', message: 'Name and contact number are required.' }
        setRows([...next])
        continue
      }
      try {
        const now = new Date().toISOString()
        const payload: Partial<Restaurant> = {
          name: entry.row.name,
          slug: entry.row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: '',
          contactNumber: entry.row.contactNumber,
          openingTime: entry.row.openingTime,
          closingTime: entry.row.closingTime,
          locationId: entry.row.locationId,
          image: '',
          placeholderImage: '',
          images: [],
          rating: 0,
          deliveryTime: 30,
          priceRange: 2,
          isPureveg: false,
          address: entry.row.address,
          pincode: entry.row.pincode,
          landmark: '',
          sku: `RES-${Math.floor(Math.random() * 90000 + 10000)}`,
          latitude: 0,
          longitude: 0,
          certificate: null,
          restaurantCharges: 0,
          deliveryCharges: 20,
          isActive: true,
          isAccepted: false,
          isFeatured: false,
          commissionRate: 15,
          deliveryType: 'delivery',
          deliveryRadius: 6,
          deliveryChargeType: 'fixed',
          baseDeliveryCharge: 20,
          baseDeliveryDistance: 2,
          extraDeliveryCharge: 0,
          extraDeliveryDistance: 0,
          minOrderPrice: entry.row.minOrderPrice,
          isNotifiable: true,
          autoAcceptable: false,
          isSchedulable: false,
          isAcceptCod: true,
          categoryIds: [],
          createdBy: null,
          updatedBy: null,
          createdAt: now,
          updatedAt: now,
        }
        await restaurantService.create(payload)
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
          Required columns: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">{COLUMNS.join(', ')}</code>
        </p>
        <button className="btn-secondary shrink-0" onClick={downloadSampleCsv}>
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
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.row.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.row.contactNumber || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{locations.find((l) => l.id === r.row.locationId)?.name ?? r.row.locationId}</td>
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
              {isUploading ? 'Importing…' : 'Import restaurants'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
