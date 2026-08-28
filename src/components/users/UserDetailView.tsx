import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bike,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Minus,
  Plus,
  Radio,
  Receipt,
  ShieldAlert,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState, Badge } from '@/components/ui/Feedback'
import { Field, Select, Switch, TextInput } from '@/components/ui/FormControls'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SectionCard } from '@/components/ui/SectionCard'
import { AuditInfo } from '@/components/ui/AuditInfo'
import { MapEmbed } from '@/components/ui/MapEmbed'
import { SlideOver } from '@/components/ui/SlideOver'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services/userService'
import { deliveryGuyService } from '@/services/deliveryGuyService'
import { walletService } from '@/services/financeServices'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import type { User, DeliveryGuyDetail, Transaction, TripDetail, Wallet } from '@/types/entities'
import type { UserRole } from '@/types/common'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  employee: 'Employee',
  'restaurant-owner': 'Restaurant Owner',
  'delivery-guy': 'Delivery Partner',
  customer: 'Customer',
}

const roleBasePaths: Partial<Record<UserRole, string>> = {
  customer: '/admin/users',
  employee: '/admin/employees',
  'restaurant-owner': '/admin/restaurant-owners',
  'delivery-guy': '/admin/delivery-guys',
}

const assignableRoles: UserRole[] = ['customer', 'employee', 'restaurant-owner', 'delivery-guy']

export function UserDetailView({ role, basePath }: { role: UserRole; basePath: string }) {
  const { id } = useParams()
  const userId = Number(id)
  const navigate = useNavigate()

  const { data: user, isLoading, reload } = useAsync(() => userService.get(userId), [userId])
  const isDeliveryGuy = role === 'delivery-guy'

  const { data: guyDetail, reload: reloadGuy } = useAsync(
    () => (isDeliveryGuy && user?.deliveryGuyDetailId ? deliveryGuyService.get(user.deliveryGuyDetailId) : Promise.resolve(undefined)),
    [isDeliveryGuy, user?.deliveryGuyDetailId],
  )

  const { data: wallet, reload: reloadWallet } = useAsync(
    () => (user ? walletService.forHolder('User', user.id, user.name) : Promise.resolve(undefined)),
    [user?.id],
  )

  const { data: sessions } = useAsync(() => (user ? userService.recentLoginSessions(user.id, 5) : Promise.resolve([])), [user?.id])

  const { data: earnings } = useAsync(
    () => (isDeliveryGuy && guyDetail ? deliveryGuyService.earningsForRider(guyDetail.userId) : Promise.resolve([])),
    [isDeliveryGuy, guyDetail?.id],
  )

  const { data: walletTxns, reload: reloadTxns } = useAsync(
    () => (wallet ? walletService.transactionsForWallet(wallet.id) : Promise.resolve([])),
    [wallet?.id],
  )

  const [values, setValues] = useState<Partial<User>>({})
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>(role)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [notifiable, setNotifiable] = useState(true)
  const [walletAction, setWalletAction] = useState<'credit' | 'debit' | null>(null)

  useEffect(() => {
    if (user && !initialized) {
      setValues(user)
      setNewRole(user.role)
      setInitialized(true)
    }
  }, [user, initialized])

  useEffect(() => {
    if (guyDetail) setNotifiable(guyDetail.isNotifiable)
  }, [guyDetail])

  if (isLoading || !initialized) return <LoadingBlock />
  if (!user) return <EmptyState title="User not found" />

  function handleChange<K extends keyof User>(key: K, value: User[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await userService.update(user!.id, { ...values, updatedBy: 1, updatedAt: now })
      if (isDeliveryGuy && guyDetail) {
        await deliveryGuyService.update(guyDetail.id, { isNotifiable: notifiable, photo: values.photo ?? guyDetail.photo })
        reloadGuy()
      }
      reload()
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange() {
    if (newRole === user!.role) return
    setSaving(true)
    try {
      await userService.update(user!.id, { role: newRole, updatedBy: 1, updatedAt: new Date().toISOString() })
      const target = roleBasePaths[newRole] ?? basePath
      navigate(`${target}/${user!.id}`)
    } finally {
      setSaving(false)
    }
  }

  function handleSavePassword() {
    // Mock-only: there's no password field on the User model to persist to —
    // this simulates the admin-triggered reset action the UI asks for.
    setPasswordSaved(true)
    setPassword('')
    setTimeout(() => setPasswordSaved(false), 2500)
  }

  return (
    <div>
      <button onClick={() => navigate(basePath)} className="btn-ghost mb-3 px-2">
        <ArrowLeft size={15} /> Back to {roleLabels[role].toLowerCase()}s
      </button>

      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <>
            <Badge tone={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Blocked'}</Badge>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard title="User details" description="Manage user information and preferences" icon={UserIcon}>
            <div className="mb-4">
              <ImageUpload value={values.photo} onChange={(v) => handleChange('photo', v)} className="h-20 w-20 rounded-full" label="Photo" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <TextInput value={values.name ?? ''} onChange={(e) => handleChange('name', e.target.value)} />
              </Field>
              <Field label="Email" required>
                <TextInput type="email" value={values.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} />
              </Field>
              <Field label="Phone">
                <TextInput value={values.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value)} />
              </Field>
              {isDeliveryGuy && (
                <Field label="SMS Notification for New Orders">
                  <Switch checked={notifiable} onChange={setNotifiable} />
                </Field>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Role management" description="Manage user roles and permissions" icon={ShieldAlert}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Current role">
                <p className="input flex items-center bg-slate-50 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  {roleLabels[user.role]}
                </p>
              </Field>
              <Field label="Account blocked">
                <Switch checked={!values.isActive} onChange={(blocked) => handleChange('isActive', !blocked)} />
              </Field>
              <Field label="New role">
                <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{roleLabels[r]}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {newRole !== user.role && (
              <button className="btn-secondary mt-3" onClick={handleRoleChange} disabled={saving}>
                Move to {roleLabels[newRole]}
              </button>
            )}
          </SectionCard>

          <SectionCard title="Security" description="Admin-only — resets the account's sign-in password." icon={KeyRound}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Field label="New password">
                  <div className="relative">
                    <TextInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set a new password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              </div>
              <button className="btn-secondary" onClick={handleSavePassword} disabled={!password}>
                Reset password
              </button>
              {passwordSaved && <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Password updated</span>}
            </div>
          </SectionCard>

          {isDeliveryGuy && (
            <SectionCard title="Earnings" description="Per-order rider earnings." icon={Receipt} >
              <EarningsTable rows={earnings ?? []} />
            </SectionCard>
          )}

          <SectionCard title="Wallet transactions" description="View and manage wallet transactions." icon={Receipt}>
            <TransactionsTable rows={walletTxns ?? []} />
          </SectionCard>

          <SectionCard title="Record info" description="View audit information for this user." icon={ShieldAlert}>
            <AuditInfo createdAt={user.createdAt} updatedAt={user.updatedAt} createdBy={user.createdBy} updatedBy={user.updatedBy} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Wallet" description="Manage your wallet balance." icon={WalletIcon}>
            <p className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(wallet?.balance ?? 0)}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Current balance</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setWalletAction('credit')}>
                <Plus size={15} /> Add Amount
              </button>
              <button className="btn-secondary flex-1" onClick={() => setWalletAction('debit')}>
                <Minus size={15} /> Subtract Amount
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Activity" description="View user activity and login history." icon={Radio}>
            {isDeliveryGuy && guyDetail && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span className={`h-2 w-2 rounded-full ${guyDetail.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  {guyDetail.isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Last seen {guyDetail.lastSeenAt ? timeAgo(guyDetail.lastSeenAt) : '—'}
                </span>
              </div>
            )}
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Last 5 logins</p>
            {sessions && sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{s.location}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(s.loginAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No login history yet.</p>
            )}
          </SectionCard>

          {isDeliveryGuy && guyDetail && (
            <SectionCard title="Last known location" description="Static preview, not a live GPS feed." icon={MapPin} >
              <MapEmbed lat={guyDetail.lastLat} lng={guyDetail.lastLng} />
            </SectionCard>
          )}

          {isDeliveryGuy && guyDetail && (
            <SectionCard title="Vehicle" description="View and manage vehicle information." icon={Bike}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Vehicle number</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{guyDetail.vehicleNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Rating</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{guyDetail.rating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Max simultaneous deliveries</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{guyDetail.maxAcceptDeliveryLimit}</span>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <WalletAdjustPanel
        action={walletAction}
        wallet={wallet}
        onClose={() => setWalletAction(null)}
        onDone={() => {
          setWalletAction(null)
          reloadWallet()
          reloadTxns()
        }}
      />
    </div>
  )
}

function EarningsTable({ rows }: { rows: TripDetail[] }) {
  const columns: Column<TripDetail>[] = [
    { key: 'order', header: 'Order', render: (row) => `#${row.orderId}` },
    { key: 'distance', header: 'Distance', render: (row) => `${row.distanceTravelled.toFixed(1)} km` },
    { key: 'earning', header: 'Rider earning', render: (row) => formatCurrency(row.riderEarning) },
    { key: 'settled', header: 'Settled', render: (row) => <Badge tone={row.isSettlementDone ? 'green' : 'amber'}>{row.isSettlementDone ? 'Settled' : 'Pending'}</Badge> },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ]
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="No earnings yet" />
  )
}

function TransactionsTable({ rows }: { rows: Transaction[] }) {
  const columns: Column<Transaction>[] = [
    { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'credit' ? 'green' : 'red'}>{row.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'reason', header: 'Reason', render: (row) => (row.meta as { reason?: string } | null)?.reason ?? row.payableType },
    { key: 'confirmed', header: 'Status', render: (row) => (row.confirmed ? <Badge tone="green">Confirmed</Badge> : <Badge tone="amber">Pending</Badge>) },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ]
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="No wallet transactions yet" />
  )
}

function WalletAdjustPanel({
  action,
  wallet,
  onClose,
  onDone,
}: {
  action: 'credit' | 'debit' | null
  wallet: Wallet | null | undefined
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (action) {
      setAmount('')
      setMessage('')
    }
  }, [action])

  async function handleSubmit() {
    if (!wallet || !action || !amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      await walletService.adjustBalance(wallet.id, action, Number(amount), message || (action === 'credit' ? 'Manual credit by admin' : 'Manual debit by admin'))
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlideOver
      open={action !== null}
      onClose={onClose}
      title={action === 'credit' ? 'Add Amount' : 'Subtract Amount'}
      description={`Current balance: ${formatCurrency(wallet?.balance ?? 0)}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !amount}>
            {saving ? 'Saving…' : action === 'credit' ? 'Add to wallet' : 'Subtract from wallet'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Amount (₹)" required>
          <TextInput type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Message" hint="Shown against this transaction in wallet history.">
          <TextInput value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reason for this adjustment" />
        </Field>
      </div>
    </SlideOver>
  )
}
