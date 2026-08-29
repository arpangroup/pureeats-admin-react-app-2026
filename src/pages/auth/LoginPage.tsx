import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Field, TextInput } from '@/components/ui/FormControls'
import { DEMO_ACCOUNTS } from '@/services/authService'
import { IS_MOCK } from '@/config/env'

function MockLoginForm() {
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

      <p className="mt-4 text-center text-xs text-slate-400">
        Testing the real OTP screens?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Try the OTP flow (mock)
        </Link>
      </p>
    </div>
  )
}

function LiveOtpLoginForm() {
  const { requestOtp, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL')
  const [email, setEmail] = useState('')
  const [countryId, setCountryId] = useState('91')
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const payload = method === 'EMAIL' ? { method: 'EMAIL' as const, email } : { method: 'PHONE' as const, countryId: Number(countryId), phone }
      const challenge = await requestOtp(payload)
      navigate('/verify', {
        state: {
          challengeId: challenge.challengeId,
          maskedDestination: challenge.maskedDestination,
          expiresIn: challenge.expiresIn,
          resendAvailableIn: challenge.resendAvailableIn,
          purpose: 'login',
        },
      })
    } catch {
      // error is surfaced via auth context
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMethod('EMAIL')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${method === 'EMAIL' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500'}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setMethod('PHONE')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${method === 'PHONE' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500'}`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {method === 'EMAIL' ? (
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
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Field label="Code" required>
              <TextInput value={countryId} onChange={(e) => setCountryId(e.target.value)} placeholder="91" required />
            </Field>
            <div className="col-span-2">
              <Field label="Phone" required>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9800000000"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
            </div>
          </div>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Sending OTP…' : 'Send OTP'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return IS_MOCK ? <MockLoginForm /> : <LiveOtpLoginForm />
}
