import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Field, TextInput } from '@/components/ui/FormControls'
import { DEMO_ACCOUNTS } from '@/services/authService'
import { IS_MOCK } from '@/config/env'

export default function LoginPage() {
  const { login, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const user = await login({ email, password })
      navigate(user.role === 'restaurant-owner' ? '/restaurant-owner/dashboard' : '/admin/dashboard')
    } catch {
      // error is surfaced via auth context
    }
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" required>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pureeats.in"
              className="pl-9"
              required
            />
          </div>
        </Field>
        <Field label="Password" required>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9"
              required
            />
          </div>
        </Field>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {IS_MOCK && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts (any password)</p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('demo')
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="font-medium text-slate-700">{account.label}</span>
                <span className="text-xs text-slate-400">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
