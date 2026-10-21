import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { StaffMember } from '../lib/types'
import Spinner from '../components/Spinner'

export default function Staff() {
  const { session, staff } = useAuth()
  const [rows, setRows] = useState<StaffMember[] | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [makeAdmin, setMakeAdmin] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const admin = !!staff?.is_admin

  const load = async () => {
    const { data, error } = await supabase.rpc('list_staff')
    if (error) setMsg({ ok: false, text: error.message })
    setRows((data ?? []) as StaffMember[])
  }
  useEffect(() => { void load() }, [])

  async function add(e: FormEvent) {
    e.preventDefault(); setMsg(null)
    const { error } = await supabase.rpc('add_staff_by_email', { p_email: email.trim(), p_full_name: name.trim(), p_is_admin: makeAdmin })
    if (error) { setMsg({ ok: false, text: error.message }); return }
    setMsg({ ok: true, text: `${name} can now sign in to the admin.` })
    setEmail(''); setName(''); setMakeAdmin(false); void load()
  }
  async function toggleAdmin(s: StaffMember) {
    const { error } = await supabase.from('staff').update({ is_admin: !s.is_admin }).eq('user_id', s.user_id)
    if (error) setMsg({ ok: false, text: error.message }); else void load()
  }
  async function remove(s: StaffMember) {
    if (!confirm(`Remove ${s.full_name}'s access to the admin?`)) return
    const { error } = await supabase.from('staff').delete().eq('user_id', s.user_id)
    if (error) setMsg({ ok: false, text: error.message }); else void load()
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Staff</h1>
      {!rows ? <Spinner /> : (
        <div className="card mt-6 divide-y divide-slate-100">
          {rows.map((s) => (
            <div key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-ink">{s.full_name} {s.is_admin && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">ADMIN</span>}</p>
                <p className="text-sm text-slate-500">{s.email}</p>
              </div>
              {admin && s.user_id !== session?.user.id && (
                <div className="flex gap-2">
                  <button className="btn-outline btn-sm" onClick={() => toggleAdmin(s)}>{s.is_admin ? 'Remove admin' : 'Make admin'}</button>
                  <button className="btn-outline btn-sm text-red-600" onClick={() => remove(s)}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {admin && (
        <form onSubmit={add} className="card mt-6 space-y-4 p-6">
          <h2 className="font-bold text-ink">Add a staff member</h2>
          <p className="text-sm text-slate-600">First create their login in Supabase: <b>Authentication › Users › Add user</b> (tick “Auto confirm”). Then add them here.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Their email</span><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block"><span className="label">Full name</span><input required className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand" checked={makeAdmin} onChange={(e) => setMakeAdmin(e.target.checked)} /> Admin (can change settings and manage staff)</label>
          <button className="btn-dark">Add staff member</button>
        </form>
      )}
      {msg && <p className={`mt-4 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</p>}
    </div>
  )
}
