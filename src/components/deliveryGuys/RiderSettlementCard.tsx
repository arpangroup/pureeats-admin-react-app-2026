import { useState } from 'react'
import { HandCoins, Banknote, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Modal } from '@/components/ui/Modal'
import { Field, Select, TextInput, Textarea } from '@/components/ui/FormControls'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { riderSettlementService, type RiderSettlement, type SettlementDirection } from '@/services/riderSettlementService'
import { formatCurrency, formatDate } from '@/lib/format'

const MODES = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
]

function directionLabel(direction: SettlementDirection, net: number): string {
  if (direction === 'PAID_TO_RIDER') return `Pay rider ${formatCurrency(Math.abs(net))}`
  if (direction === 'COLLECTED_FROM_RIDER') return `Collect ${formatCurrency(Math.abs(net))} from rider`
  return 'All square - nothing to pay'
}

/**
 * Admin settlement for one delivery partner: what they've earned but not been paid, the COD cash
 * they're holding, and the net. "Settle now" records the payout (mode/reference/note) and marks every
 * pending trip settled - the backend also debits the paid-out earnings from the rider's wallet and
 * clears the settled COD cash, so call `onSettled` to refresh the wallet/earnings cards around it.
 */
export function RiderSettlementCard({ riderUserId, onSettled }: { riderUserId: number; onSettled?: () => void }) {
  const { data: summary, reload: reloadSummary } = useAsync(() => riderSettlementService.summary(riderUserId), [riderUserId])
  const { data: history, reload: reloadHistory } = useAsync(() => riderSettlementService.list(riderUserId), [riderUserId])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSettle() {
    setSaving(true)
    setError(null)
    try {
      await riderSettlementService.settle(riderUserId, { transactionMode: mode, transactionReference: reference || undefined, note: note || undefined })
      setOpen(false)
      setReference('')
      setNote('')
      reloadSummary()
      reloadHistory()
      onSettled?.()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not record the settlement.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<RiderSettlement>[] = [
    { key: 'id', header: '#', render: (s) => `#${s.id}` },
    { key: 'date', header: 'Date', render: (s) => formatDate(s.createdAt) },
    { key: 'trips', header: 'Trips', render: (s) => s.tripCount },
    { key: 'earnings', header: 'Earnings', render: (s) => formatCurrency(s.earningsAmount) },
    { key: 'cod', header: 'COD', render: (s) => `- ${formatCurrency(s.codAmount)}` },
    { key: 'net', header: 'Net', render: (s) => <span className="font-semibold">{directionLabel(s.direction, s.netAmount)}</span> },
    { key: 'ref', header: 'Mode / ref', render: (s) => [s.transactionMode?.replace(/_/g, ' '), s.transactionReference].filter(Boolean).join(' · ') || '—' },
  ]

  const nothingPending = !summary || summary.unsettledTrips === 0

  return (
    <SectionCard title="Settlement" description="Earnings not yet paid out, COD cash the rider holds, and payout history." icon={HandCoins}>
      {summary && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Earnings not yet paid</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(summary.pendingEarnings)}</p>
              <p className="text-xs text-slate-400">{summary.unsettledTrips} trip(s)</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Banknote size={12} /> COD cash held by rider
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">- {formatCurrency(summary.cashInHand)}</p>
              <p className="text-xs text-slate-400">deducted at settlement</p>
            </div>
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">Net</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{directionLabel(summary.netDirection, summary.netPending)}</p>
              <p className="text-xs text-slate-400">Lifetime {formatCurrency(summary.lifetimeEarnings)} · {summary.lifetimeTrips} trips</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {summary.lastSettlement
                ? `Last settled ${formatDate(summary.lastSettlement.createdAt)} (#${summary.lastSettlement.id})`
                : 'Never settled'}
            </p>
            <button className="btn-primary" onClick={() => setOpen(true)} disabled={nothingPending}>
              <CheckCircle2 size={15} /> {nothingPending ? 'Nothing to settle' : 'Settle now'}
            </button>
          </div>
        </>
      )}

      <div className="mt-4">
        <DataTable columns={columns} rows={history ?? []} rowKey={(s) => s.id} emptyTitle="No settlements yet" />
      </div>

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Record settlement"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSettle} disabled={saving}>
              {saving ? 'Recording…' : 'Confirm settlement'}
            </button>
          </>
        }
      >
        {summary && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Earnings ({summary.unsettledTrips} trips)</span>
                <span>{formatCurrency(summary.pendingEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">COD cash held</span>
                <span>- {formatCurrency(summary.cashInHand)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold dark:border-slate-700">
                <span>Result</span>
                <span>{directionLabel(summary.netDirection, summary.netPending)}</span>
              </div>
            </div>
            <Field label="Payment mode">
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Transaction reference" hint="UTR / UPI ref / receipt number - shown to the rider.">
              <TextInput value={reference} maxLength={128} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UTR2310..." />
            </Field>
            <Field label="Note">
              <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </Field>
            <p className="text-xs text-slate-400">
              This marks all {summary.unsettledTrips} pending trip(s) as settled, debits the paid-out earnings from the rider's wallet and clears the settled COD cash.
            </p>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
          </div>
        )}
      </Modal>
    </SectionCard>
  )
}
