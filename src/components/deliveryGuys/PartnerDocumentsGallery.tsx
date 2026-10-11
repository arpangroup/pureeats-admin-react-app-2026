import { useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, FileText, Loader2, Upload } from 'lucide-react'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { DOC_LABELS, requiredDocuments, type PartnerDocType } from '@/lib/partnerDocuments'
import { compressImage } from '@/lib/imageCompress'

/**
 * Every document a partner's application needs (licence, Aadhaar front & back, PAN, RC unless a cycle, passbook
 * for a bank payout), each opening full size - photos as thumbnails, PDFs as a file tile, missing ones flagged.
 * With `editable`, an admin can upload or replace any of them. Approval is blocked server-side until nothing is
 * missing (photo included).
 */
export function PartnerDocumentsGallery({ partner, editable, onChanged }: { partner: DeliveryGuyRow; editable?: boolean; onChanged?: (p: DeliveryGuyRow) => void }) {
  const types = requiredDocuments(partner.vehicleType ?? 'BIKE', partner.payoutMethod ?? 'UPI')
  // Show any extra uploads too (e.g. an RC from before the partner switched to a cycle).
  const extra = (partner.documents ?? []).map((d) => d.type).filter((t) => !types.includes(t))
  const missing = partner.missingDocuments ?? []

  return (
    <div className="space-y-2">
      {missing.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Missing: <span className="font-semibold">{missing.map((m) => DOC_LABELS[m]).join(', ')}</span> - approval is blocked until they're uploaded.
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...types, ...extra].map((type) => (
          <DocumentTile key={type} partner={partner} type={type} editable={!!editable} onChanged={onChanged} />
        ))}
      </div>
    </div>
  )
}

function DocumentTile({ partner, type, editable, onChanged }: { partner: DeliveryGuyRow; type: PartnerDocType; editable: boolean; onChanged?: (p: DeliveryGuyRow) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const doc = partner.documents?.find((d) => d.type === type)

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const upload = file.type === 'application/pdf' ? file : await compressImage(file)
      onChanged?.(await deliveryGuyService.uploadDocument(partner.id, type, upload))
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
      {doc ? (
        <a href={doc.url} target="_blank" rel="noopener noreferrer" title={`${DOC_LABELS[type]} - open full size`} className="block">
          {doc.contentType === 'application/pdf' ? (
            <span className="flex h-28 flex-col items-center justify-center gap-1 bg-slate-50 text-brand-600 dark:bg-slate-800">
              <FileText size={26} />
              <span className="text-[11px] font-medium">PDF - open</span>
            </span>
          ) : (
            <img src={doc.url} alt={DOC_LABELS[type]} className="h-28 w-full object-cover" />
          )}
        </a>
      ) : (
        <span className="flex h-28 items-center justify-center bg-rose-50 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">Not uploaded</span>
      )}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">{DOC_LABELS[type]}</span>
        {editable && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="shrink-0 text-[11px] font-semibold text-brand-600" title={doc ? 'Replace' : 'Upload'}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          </button>
        )}
      </div>
      {error && <p className="px-2 pb-1.5 text-[10px] text-rose-600">{error}</p>}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={pick} />
    </div>
  )
}
