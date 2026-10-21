import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Spinner from '../components/Spinner'

export default function ResetPassword() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (!session) return <div className="container-x py-20 text-center text-neutral-600">This reset link has expired. Request a new one from the staff sign-in page.</div>

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) { setError('Use at least 8 characters.'); return }
    if (pw !== pw2) { setError('The passwords do not match.'); return }
    setBusy(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/admin', { replace: true })
  }

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-7">
        <h1 className="text-xl font-bold text-ink">Set a new password</h1>
        <div><label className="label" htmlFor="r1">New password</label><input id="r1" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><label className="label" htmlFor="r2">Repeat password</label><input id="r2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-dark w-full" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  )
}
