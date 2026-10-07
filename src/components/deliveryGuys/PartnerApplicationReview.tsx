import { useState, type ReactNode } from 'react'
import { BadgeCheck, CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { Field, Textarea } from '@/components/ui/FormControls'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { formatDate } from '@/lib/format'
import type { PartnerApprovalStatus } from '@/types/entities'
import { PartnerDocumentsEditor } from '@/components/deliveryGuys/PartnerDocumentsEditor'

const VEHICLE = { BIKE: 'Bike', CYCLE: 'Cycle', EV: 'EV' } as const

export function ApprovalBadge({ status }: { status?: PartnerApprovalStatus }) {
  const s = status ?? 'APPROVED'
  return <Badge tone={s === 'APPROVED' ? 'green' : s === 'REJECTED' ? 'red' : 'amber'}>{s === 'APPROVED' ? 'Approved' : s === 'REJECTED' ? 'Rejected' : 'Pending approval'}</Badge>
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800 dark:text-slate-100">{value || '—'}</span>
    </div>
  )
}

/**
 * A delivery partner's application (sign-up details + licence photo) with Approve / Reject. Only approved
 * partners can go online and take orders; a rejection needs a reason, which the partner sees in the app
 * and can fix and resubmit. Used on the Approvals page and the partner's own page.
 */
export function PartnerApplicationReview({ partner, onReviewed }: { partner: DeliveryGuyRow; onReviewed: (updated: DeliveryGuyRow) => void }) {
  const [rejecting, setRejecting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(approve: boolean) {
    setBusy(true)
    setError(null)
    try {
      const updated = approve ? await deliveryGuyService.approve(partner.id) : await deliveryGuyService.reject(partner.id, reason.trim())
      setRejecting(false)
      setReason('')
      onReviewed(updated)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not update the application.')
    } finally {
      setBusy(false)
    }
  }

  const status = partner.approvalStatus ?? 'APPROVED'
  const hasSignUpDetails = !!(partner.licenseNumber || partner.idProofNumber || partner.payoutMethod)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ApprovalBadge status={partner.approvalStatus} />
        {partner.approvalUpdatedAt && <span className="text-xs text-slate-400">since {formatDate(partner.approvalUpdatedAt)}</span>}
      </div>
      {status === 'REJECTED' && partner.rejectionReason && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Reason given: {partner.rejectionReason}</p>
      )}

      {!hasSignUpDetails && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Added before sign-up verification (or by an admin) - no licence, ID or payout details on file yet.
        </p>
      )}

      {/* The licence image only takes a column when there is one - no empty placeholder box. */}
      <div className={partner.licensePhotoUrl ? 'grid gap-4 sm:grid-cols-[1fr_auto]' : ''}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Line label="Name" value={partner.name} />
          <Line
            label="Mobile"
            value={
              <span className="inline-flex items-center gap-1">
                {partner.phone}
                {partner.phoneVerified && <BadgeCheck size={14} className="text-emerald-500" aria-label="Verified" />}
              </span>
            }
          />
          <Line label="Email" value={partner.email} />
          <Line label="Driving licence" value={partner.licenseNumber} />
          {!partner.licensePhotoUrl && <Line label="Licence photo" value={<span className="font-normal text-slate-400">Not uploaded</span>} />}
          <Line label={partner.idProofType === 'PAN' ? 'PAN' : 'Aadhaar'} value={partner.idProofNumber} />
          <Line label="Vehicle" value={[partner.vehicleType ? VEHICLE[partner.vehicleType] : null, partner.vehicleNumber].filter(Boolean).join(' · ')} />
          <Line
            label="Payout"
            value={partner.payoutMethod === 'UPI' ? `UPI ${partner.upiId ?? ''}` : partner.payoutMethod === 'BANK' ? `${partner.bankAccountHolder} · ${partner.bankAccountNumber} · ${partner.bankIfsc}` : null}
          />
          <Line label={hasSignUpDetails ? 'Applied' : 'Joined'} value={formatDate(partner.createdAt)} />
        </div>
        {partner.licensePhotoUrl && (
          <a href={partner.licensePhotoUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img src={partner.licensePhotoUrl} alt="Driving licence" className="h-40 w-full rounded-lg object-cover ring-1 ring-slate-200 sm:w-60 dark:ring-slate-700" />
            <span className="mt-1 block text-center text-[11px] text-slate-400">Driving licence - open full size</span>
          </a>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => setEditing(true)} disabled={busy}>
          <Pencil size={15} /> Edit details
        </button>
        {status !== 'APPROVED' && (
          <button className="btn-primary" onClick={() => act(true)} disabled={busy}>
            <CheckCircle2 size={15} /> Approve
          </button>
        )}
        {status !== 'REJECTED' && (
          <button className="btn-secondary text-rose-600" onClick={() => setRejecting(true)} disabled={busy}>
            <XCircle size={15} /> {status === 'APPROVED' ? 'Revoke approval' : 'Reject'}
          </button>
        )}
      </div>

      {editing && <PartnerDocumentsEditor partner={partner} open={editing} onClose={() => setEditing(false)} onSaved={onReviewed} />}

      <Modal
        open={rejecting}
        onClose={() => !busy && setRejecting(false)}
        title={status === 'APPROVED' ? 'Revoke approval' : 'Reject application'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejecting(false)} disabled={busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => act(false)} disabled={busy || reason.trim().length < 5}>
              {busy ? 'Saving…' : 'Reject'}
            </button>
          </>
        }
      >
        <Field label="Reason (shown to the partner)" hint="Tell them what to fix, e.g. 'Licence photo is blurry - please upload a clear photo of the front.'">
          <Textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}
