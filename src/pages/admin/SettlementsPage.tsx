import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, ChevronDown, ChevronRight, HandCoins, Store, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { RiderSettlementCard } from '@/components/deliveryGuys/RiderSettlementCard'
import { WithdrawalRequestList } from '@/components/deliveryGuys/WithdrawalRequestList'
import { StorePayoutsTable } from '@/components/finance/StorePayoutsTable'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { riderSettlementService, type RiderSettlement, type RiderSettlementSummary } from '@/services/riderSettlementService'
import { payoutService } from '@/services/financeServices'
import { classNames, formatCurrency, formatDate } from '@/lib/format'

type Tab = 'partners' | 'withdrawals' | 'stores'

interface PartnerSettlement {
  partner: DeliveryGuyRow
  summary: RiderSettlementSummary | null
}

/** How many partner summaries are fetched at once (one per partner - same API the partner page uses). */
const CONCURRENCY = 5

async function loadSummaries(partners: DeliveryGuyRow[]): Promise<PartnerSettlement[]> {
  const out: PartnerSettlement[] = partners.map((partner) => ({ partner, summary: null }))
  let next = 0
  async function worker() {
    while (next < partners.length) {
      const i = next++
      try {
        out[i].summary = await riderSettlementService.summary(partners[i].userId)
      } catch {
        out[i].summary = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, partners.length) }, worker))
  return out
}

const hasSomethingPending = (s: RiderSettlementSummary | null) =>
  !!s && (s.cashInHand > 0 || s.walletBalance > 0 || s.pendingWithdrawals > 0 || s.earningsOnOldBasis > 0)

function Stat({ icon: Icon, label, value, sub, tone }: { icon: typeof Wallet; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className={classNames('rounded-xl border p-4', tone)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
        <Icon size={14} /> {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  )
}

/**
 * Every settlement in one place: delivery partners' COD cash to collect and wallet earnings to pay, their
 * withdrawal requests, and store payouts. Uses the same APIs and the same components as the partner and
 * store pages (expanding a partner opens their own settlement card), so actions behave identically.
 */
export default function SettlementsPage() {
  const [tab, setTab] = useState<Tab>('partners')
  const [rows, setRows] = useState<PartnerSettlement[] | null>(null)
  const [withdrawals, setWithdrawals] = useState<RiderSettlement[] | null>(null)
  const [storePending, setStorePending] = useState<{ count: number; amount: number } | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const loadPartners = useCallback(async () => {
    const partners = await deliveryGuyService.list({ page: 1, perPage: 500 })
    setRows(await loadSummaries(partners.data.filter((p) => p.userId != null)))
  }, [])
  const loadWithdrawals = useCallback(async () => setWithdrawals(await riderSettlementService.withdrawals('REQUESTED')), [])
  const loadStores = useCallback(async () => {
    const payouts = await payoutService.list({ page: 1, perPage: 500 })
    const open = payouts.data.filter((p) => p.status === 'pending' || p.status === 'processing')
    setStorePending({ count: open.length, amount: open.reduce((a, p) => a + p.amount, 0) })
  }, [])

  useEffect(() => {
    loadPartners().catch(() => setRows([]))
    loadWithdrawals().catch(() => setWithdrawals([]))
    loadStores().catch(() => setStorePending({ count: 0, amount: 0 }))
  }, [loadPartners, loadWithdrawals, loadStores])

  /** After a settlement on one partner: refresh just that row, plus the withdrawal queue. */
  async function refreshPartner(userId: number) {
    const summary = await riderSettlementService.summary(userId).catch(() => null)
    setRows((rs) => rs?.map((r) => (r.partner.userId === userId ? { ...r, summary } : r)) ?? rs)
    loadWithdrawals().catch(() => undefined)
  }

  const sum = (pick: (s: RiderSettlementSummary) => number) => (rows ?? []).reduce((a, r) => a + (r.summary ? pick(r.summary) : 0), 0)
  const codTotal = sum((s) => s.cashInHand)
  const codPartners = (rows ?? []).filter((r) => (r.summary?.cashInHand ?? 0) > 0).length
  const walletTotal = sum((s) => s.walletBalance)
  const walletPartners = (rows ?? []).filter((r) => (r.summary?.walletBalance ?? 0) > 0).length
  const visible = (rows ?? []).filter((r) => showAll || hasSomethingPending(r.summary))

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'partners', label: 'Delivery partners', count: rows ? rows.filter((r) => hasSomethingPending(r.summary)).length : undefined },
    { key: 'withdrawals', label: 'Withdrawal requests', count: withdrawals?.length },
    { key: 'stores', label: 'Store payouts', count: storePending?.count },
  ]

  return (
    <div>
      <PageHeader title="Settlements" description="Everything waiting to be settled - delivery partners' COD cash and earnings, withdrawal requests and store payouts." />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Banknote} label="COD cash to collect" value={rows ? formatCurrency(codTotal) : '…'} sub={`from ${codPartners} partner(s)`} tone="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10" />
        <Stat icon={Wallet} label="Partner wallets (earnings)" value={rows ? formatCurrency(walletTotal) : '…'} sub={`${walletPartners} partner(s) with a balance`} tone="border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10" />
        <Stat
          icon={HandCoins}
          label="Withdrawal requests"
          value={withdrawals ? formatCurrency(withdrawals.reduce((a, w) => a + w.earningsAmount, 0)) : '…'}
          sub={`${withdrawals?.length ?? 0} waiting to be paid`}
          tone="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
        <Stat
          icon={Store}
          label="Store payouts pending"
          value={storePending ? formatCurrency(storePending.amount) : '…'}
          sub={`${storePending?.count ?? 0} payout(s)`}
          tone="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      <div className="mb-4 inline-flex flex-wrap rounded-lg bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={classNames('rounded-md px-3 py-1.5', tab === t.key ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400')}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 text-[11px] text-white">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'partners' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800">
            <span>{showAll ? 'All delivery partners' : 'Partners with COD cash, wallet earnings or withdrawals to settle'} · click a row to settle</span>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all partners
            </label>
          </div>
          {rows === null ? (
            <LoadingBlock label="Loading every partner's balance…" />
          ) : visible.length === 0 ? (
            <EmptyState title="Nothing to settle" description="No delivery partner holds COD cash or has earnings waiting." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Partner</th>
                  <th className="px-4 py-2.5 text-right">COD to collect</th>
                  <th className="px-4 py-2.5 text-right">Wallet</th>
                  <th className="px-4 py-2.5 text-right">Withdrawals requested</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Pays to</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">Last settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map(({ partner, summary }) => {
                  const open = expanded === partner.userId
                  return (
                    <Fragment key={partner.id}>
                      <tr className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => setExpanded(open ? null : partner.userId)}>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            {partner.name}
                            <Link to={`/admin/delivery-guys/${partner.userId}`} onClick={(e) => e.stopPropagation()} className="text-xs font-normal text-brand-600 hover:underline">
                              open
                            </Link>
                          </span>
                          {summary && summary.earningsOnOldBasis > 0 && <span className="ml-6 text-[11px] text-amber-600">{summary.earningsOnOldBasis} earning(s) need recalculating</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {summary ? (summary.cashInHand > 0 ? `${formatCurrency(summary.cashInHand)} · ${summary.codOrders} order(s)` : '—') : '?'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{summary ? formatCurrency(summary.walletBalance) : '?'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{summary && summary.pendingWithdrawals > 0 ? formatCurrency(summary.pendingWithdrawals) : '—'}</td>
                        <td className="hidden max-w-[220px] truncate px-4 py-3 text-xs text-slate-500 md:table-cell">{summary?.payoutTo ?? '—'}</td>
                        <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">{summary?.lastSettlement ? formatDate(summary.lastSettlement.createdAt) : 'Never'}</td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/60 px-4 py-4 dark:bg-slate-900/40">
                            <RiderSettlementCard riderUserId={partner.userId} payout={partner} onSettled={() => refreshPartner(partner.userId)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="card p-4">
          {withdrawals === null ? (
            <LoadingBlock />
          ) : (
            <WithdrawalRequestList
              requests={withdrawals}
              showPartner
              onChanged={() => {
                loadWithdrawals().catch(() => undefined)
                loadPartners().catch(() => undefined)
              }}
            />
          )}
        </div>
      )}

      {tab === 'stores' && (
        <div className="card p-4">
          <StorePayoutsTable onChanged={() => loadStores().catch(() => undefined)} />
        </div>
      )}
    </div>
  )
}
