import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Header'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
  }

  async function forgot() {
    if (!email.trim()) { setError('Enter your email first, then tap "Forgot password".'); return }
    setBusy(true); setError(null)
    const redirectTo = `${window.location.origin}${window.location.pathname}?reset=1`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    setBusy(false)
    if (error) setError(error.message)
    else setInfo('If that email has a staff account, a reset link is on its way.')
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-12">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-7">
        <Logo />
        <h1 className="mt-6 text-xl font-bold text-ink">Staff sign in</h1>
        <div className="mt-5 space-y-4">
          <div><label className="label" htmlFor="l-email">Email</label><input id="l-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="l-pass">Password</label><input id="l-pass" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          {info && <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-ink">{info}</p>}
          <button className="btn-dark w-full" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button>
          <button type="button" onClick={forgot} className="w-full text-center text-sm text-neutral-500 hover:text-ink" disabled={busy}>Forgot password?</button>
        </div>
      </form>
    </div>
  )
}
