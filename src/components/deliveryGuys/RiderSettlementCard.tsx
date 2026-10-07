import { useState } from 'react'
import { HandCoins, Banknote, CheckCircle2, Wallet, AlertTriangle, RefreshCw } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Modal } from '@/components/ui/Modal'
import { Field, Select, TextInput, Textarea } from '@/components/ui/FormControls'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { riderSettlementService, type RiderSettlement } from '@/services/riderSettlementService'
import { WithdrawalRequestList } from '@/components/deliveryGuys/WithdrawalRequestList'
import { formatCurrency, formatDate } from '@/lib/format'
import type { DeliveryGuyDetail } from '@/types/entities'

const MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
]

/** Older settlements netted earnings against COD into one transfer; current ones move both in full. */
function settlementLabel(s: RiderSettlement): string {
  if (s.status === 'REJECTED') return 'Withdrawal rejected'
  if (s.requestedAt) return `Withdrawal paid ${formatCurrency(s.earningsAmount)}`
  const legacyNetted = s.direction !== 'BOTH' && s.earningsAmount > 0 && s.codAmount > 0
  if (legacyNetted) {
    if (s.direction === 'PAID_TO_RIDER') return `Paid rider ${formatCurrency(Math.abs(s.netAmount))} (netted)`
    if (s.direction === 'COLLECTED_FROM_RIDER') return `Collected ${formatCurrency(Math.abs(s.netAmount))} (netted)`
    return 'Even (netted)'
  }
  return [s.codAmount > 0 ? `Collected ${formatCurrency(s.codAmount)}` : null, s.earningsAmount > 0 ? `Paid ${formatCurrency(s.earningsAmount)}` : null]
    .filter(Boolean)
    .join(' · ') || '—'
}

function payoutDetails(p?: Pick<DeliveryGuyDetail, 'payoutMethod' | 'upiId' | 'bankAccountHolder' | 'bankAccountNumber' | 'bankIfsc'> | null): string | null {
  if (!p?.payoutMethod) return null
  return p.payoutMethod === 'UPI' ? `UPI ${p.upiId ?? ''}` : `${p.bankAccountHolder ?? ''} · A/c ${p.bankAccountNumber ?? ''} · ${p.bankIfsc ?? ''}`
}

/**
 * Admin settlement for one delivery partner. Two separate things, never netted: the COD cash the partner
 * holds (they hand over ALL of it) and their wallet earnings - which leave the wallet either through the
 * partner's withdrawal requests (listed here, pay or reject) or an admin payout (bank/UPI transfer of the
 * available balance). The backend debits paid earnings from the wallet and clears collected cash, so
 * `onSettled` refreshes the cards around it.
 */
export function RiderSettlementCard({
  riderUserId,
  payout,
  onSettled,
}: {
  riderUserId: number
  payout?: Pick<DeliveryGuyDetail, 'payoutMethod' | 'upiId' | 'bankAccountHolder' | 'bankAccountNumber' | 'bankIfsc'> | null
  onSettled?: () => void
}) {
  const { data: summary, reload: reloadSummary } = useAsync(() => riderSettlementService.summary(riderUserId), [riderUserId])
  const { data: history, reload: reloadHistory } = useAsync(() => riderSettlementService.list(riderUserId), [riderUserId])
  const pendingRequests = (history ?? []).filter((s) => s.status === 'REQUESTED')
  const settledHistory = (history ?? []).filter((s) => s.status !== 'REQUESTED')
  const [open, setOpen] = useState(false)
  const [collectCod, setCollectCod] = useState(true)
  const [payEarnings, setPayEarnings] = useState(true)
  const [mode, setMode] = useState('CASH')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCash = (summary?.cashInHand ?? 0) > 0
  // Earnings live in the wallet; what's already requested for withdrawal is paid from the request instead.
  const available = summary?.availableToWithdraw ?? 0
  const hasEarnings = available > 0

  function openModal(cash: boolean, earnings: boolean) {
    setCollectCod(cash)
    setPayEarnings(earnings)
    setMode(cash && !earnings ? 'CASH' : 'UPI')
    setError(null)
    setOpen(true)
  }

  function refresh() {
    reloadSummary()
    reloadHistory()
    onSettled?.()
  }

  async function handleSettle() {
    setSaving(true)
    setError(null)
    try {
      await riderSettlementService.settle(riderUserId, {
        transactionMode: mode,
        transactionReference: reference || undefined,
        note: note || undefined,
        collectCod: collectCod && hasCash,
        payEarnings: payEarnings && hasEarnings,
      })
      setOpen(false)
      setReference('')
      setNote('')
      refresh()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not record the settlement.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRecalculate() {
    setRecalculating(true)
    try {
      await riderSettlementService.recalculate(riderUserId)
      refresh()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not recalculate the earnings.')
    } finally {
      setRecalculating(false)
    }
  }

  const columns: Column<RiderSettlement>[] = [
    { key: 'id', header: '#', render: (s) => `#${s.id}` },
    { key: 'date', header: 'Date', render: (s) => formatDate(s.createdAt) },
    { key: 'trips', header: 'Trips', render: (s) => s.tripCount },
    { key: 'cod', header: 'COD collected', render: (s) => formatCurrency(s.codAmount) },
    { key: 'earnings', header: 'Earnings paid', render: (s) => (s.status === 'REJECTED' ? <span className="text-slate-400 line-through">{formatCurrency(s.earningsAmount)}</span> : formatCurrency(s.earningsAmount)) },
    { key: 'result', header: 'Result', render: (s) => <span className="font-semibold">{settlementLabel(s)}</span> },
    { key: 'ref', header: 'Mode / ref', render: (s) => [s.transactionMode?.replace(/_/g, ' '), s.transactionReference].filter(Boolean).join(' · ') || '—' },
  ]

  const toCollect = collectCod && hasCash ? summary?.cashInHand ?? 0 : 0
  const toPay = payEarnings && hasEarnings ? available : 0
  const payoutLine = summary?.payoutTo ?? payoutDetails(payout)

  return (
    <SectionCard title="Settlement" description="COD cash the partner must hand over and earnings to pay them - settled separately, never netted." icon={HandCoins}>
      {summary && (
        <>
          {summary.earningsOnOldBasis > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="flex items-start gap-1.5">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {summary.earningsOnOldBasis} unpaid earning(s) were recorded on a different basis than today's setting (e.g. on the order total). Recalculate them before paying - the wallet is adjusted with a note per order.
              </span>
              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={handleRecalculate} disabled={recalculating}>
                <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Recalculating…' : 'Recalculate earnings'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Orders since last settlement</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{summary.openOrders}</p>
              <p className="text-xs text-slate-400">Order value {formatCurrency(summary.openOrderValue)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <Banknote size={12} /> COD cash to collect ({summary.codOrders} order{summary.codOrders === 1 ? '' : 's'})
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(summary.cashInHand)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Collect the full amount from the partner</p>
            </div>
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
              <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <Wallet size={12} /> Wallet (earnings)
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(summary.walletBalance)}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {summary.pendingWithdrawals > 0 ? `${formatCurrency(summary.pendingWithdrawals)} requested · ` : ''}
                {summary.payoutTo ?? payoutLine ?? 'No bank/UPI on file'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {summary.lastSettlement ? `Last settled ${formatDate(summary.lastSettlement.createdAt)} (#${summary.lastSettlement.id})` : 'Never settled'}
              {' · '}Lifetime {formatCurrency(summary.lifetimeEarnings)} · {summary.lifetimeTrips} trips
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => openModal(true, false)} disabled={!hasCash}>
                <Banknote size={15} /> Collect COD {hasCash ? formatCurrency(summary.cashInHand) : ''}
              </button>
              <button className="btn-secondary" onClick={() => openModal(false, true)} disabled={!hasEarnings || summary.earningsOnOldBasis > 0}>
                <Wallet size={15} /> Pay out wallet {hasEarnings ? formatCurrency(available) : ''}
              </button>
              <button className="btn-primary" onClick={() => openModal(true, true)} disabled={!(hasCash || hasEarnings) || summary.earningsOnOldBasis > 0}>
                <CheckCircle2 size={15} /> Settle both
              </button>
            </div>
          </div>
        </>
      )}

      {pendingRequests.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 p-3 dark:border-amber-500/30">
          <p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Withdrawal requests</p>
          <WithdrawalRequestList requests={pendingRequests} onChanged={refresh} />
        </div>
      )}

      <div className="mt-4">
        <DataTable columns={columns} rows={settledHistory} rowKey={(s) => s.id} emptyTitle="No settlements yet" />
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
            <button className="btn-primary" onClick={handleSettle} disabled={saving || (toCollect === 0 && toPay === 0)}>
              {saving ? 'Recording…' : 'Confirm settlement'}
            </button>
          </>
        }
      >
        {summary && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Orders ({summary.openOrders}) · order value</span>
                <span>{formatCurrency(summary.openOrderValue)}</span>
              </div>
              <label className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={collectCod && hasCash} disabled={!hasCash} onChange={(e) => setCollectCod(e.target.checked)} />
                  Collect COD cash ({summary.codOrders} order{summary.codOrders === 1 ? '' : 's'})
                </span>
                <span>{formatCurrency(summary.cashInHand)}</span>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={payEarnings && hasEarnings} disabled={!hasEarnings} onChange={(e) => setPayEarnings(e.target.checked)} />
                  Pay out wallet earnings (bank/UPI transfer)
                </span>
                <span>{formatCurrency(available)}</span>
              </label>
              <div className="space-y-0.5 border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
                {toCollect > 0 && (
                  <div className="flex justify-between">
                    <span>Collect from partner</span>
                    <span>{formatCurrency(toCollect)}</span>
                  </div>
                )}
                {toPay > 0 && (
                  <div className="flex justify-between">
                    <span>Pay to partner</span>
                    <span>{formatCurrency(toPay)}</span>
                  </div>
                )}
                {toCollect > 0 && toPay > 0 && <p className="text-xs font-normal text-slate-400">Two separate transfers - the cash isn't reduced by the earnings.</p>}
              </div>
              {toPay > 0 && payoutLine && <p className="text-xs text-slate-500 dark:text-slate-400">Pay to: {payoutLine}</p>}
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
            <Field label="Transaction reference" hint="UTR / UPI ref / receipt number - shown to the partner.">
              <TextInput value={reference} maxLength={128} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UTR2310..." />
            </Field>
            <Field label="Note">
              <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </Field>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
          </div>
        )}
      </Modal>
      {!open && error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
    </SectionCard>
  )
}
