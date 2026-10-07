import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Field, Select, TextInput, Textarea } from '@/components/ui/FormControls'
import { riderSettlementService, type RiderSettlement } from '@/services/riderSettlementService'
import { formatCurrency, formatDate } from '@/lib/format'

const MODES = [
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
]

/**
 * Partners' wallet withdrawal requests: transfer the amount to the bank/UPI shown, then "Mark paid" with the
 * reference (the partner's wallet is debited), or reject it (the money stays in their wallet).
 */
export function WithdrawalRequestList({ requests, showPartner = false, onChanged }: { requests: RiderSettlement[]; showPartner?: boolean; onChanged: () => void }) {
  const [paying, setPaying] = useState<RiderSettlement | null>(null)
  const [rejecting, setRejecting] = useState<RiderSettlement | null>(null)
  const [mode, setMode] = useState('UPI')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setPaying(null)
      setRejecting(null)
      setReference('')
      setReason('')
      onChanged()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not update the request.')
    } finally {
      setBusy(false)
    }
  }

  if (requests.length === 0) return <p className="text-sm text-slate-400">No withdrawal requests waiting.</p>

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {requests.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatCurrency(r.earningsAmount)}
              {showPartner && (
                <>
                  {' · '}
                  <Link to={`/admin/delivery-guys/${r.riderUserId}`} className="text-brand-600 hover:underline">
                    {r.riderName ?? `Partner #${r.riderUserId}`}
                  </Link>
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pay to {r.payoutTo ?? '—'} · requested {formatDate(r.requestedAt ?? r.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => {
                setMode(r.transactionMode === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'UPI')
                setPaying(r)
              }}
            >
              <CheckCircle2 size={14} /> Mark paid
            </button>
            <button className="btn-secondary px-3 py-1.5 text-xs text-rose-600" onClick={() => setRejecting(r)}>
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      ))}

      <Modal
        open={!!paying}
        onClose={() => !busy && setPaying(null)}
        title={`Mark ${paying ? formatCurrency(paying.earningsAmount) : ''} as paid`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPaying(null)} disabled={busy}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy} onClick={() => paying && run(() => riderSettlementService.payWithdrawal(paying.id, mode, reference || undefined))}>
              {busy ? 'Saving…' : 'Mark paid'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">Transfer to: {paying?.payoutTo ?? '—'}</p>
          <Field label="Paid via">
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Transaction reference" hint="UTR / UPI reference - shown to the partner.">
            <TextInput value={reference} maxLength={128} onChange={(e) => setReference(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={!!rejecting}
        onClose={() => !busy && setRejecting(null)}
        title="Reject withdrawal"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejecting(null)} disabled={busy}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy || reason.trim().length < 3} onClick={() => rejecting && run(() => riderSettlementService.rejectWithdrawal(rejecting.id, reason.trim()))}>
              {busy ? 'Saving…' : 'Reject'}
            </button>
          </>
        }
      >
        <Field label="Reason (shown to the partner)" hint="The amount stays in their wallet.">
          <Textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </Modal>
    </div>
  )
}
