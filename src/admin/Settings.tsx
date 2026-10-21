import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { HOUR_ROWS } from '../lib/format'


export default function Settings() {
  const { staff } = useAuth()
  const { settings, reload } = useSettings()
  const [f, setF] = useState({ ...settings, zig: settings.zig_per_usd ? String(settings.zig_per_usd) : '' })
  const [hours, setHours] = useState<Record<string, string>>(settings.opening_hours ?? {})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setF({ ...settings, zig: settings.zig_per_usd ? String(settings.zig_per_usd) : '' }); setHours(settings.opening_hours ?? {}) }, [settings])
  const admin = !!staff?.is_admin

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const opening_hours = Object.fromEntries(Object.entries(hours).filter(([, v]) => v.trim()))
    const { error } = await supabase.from('dealership_settings').update({
      name: f.name.trim() || 'Benauto', tagline: f.tagline?.trim() || null, phone: f.phone?.trim() || null, whatsapp: f.whatsapp?.trim() || null,
      email: f.email?.trim() || null, address: f.address?.trim() || null, map_url: f.map_url?.trim() || null, opening_hours,
      zig_per_usd: f.zig.trim() ? Number(f.zig) : null,
    }).eq('id', 1)
    setBusy(false)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: 'Saved. The website is updated.' }); void reload() }
  }

  const input = (key: 'name' | 'tagline' | 'phone' | 'whatsapp' | 'email' | 'address' | 'map_url', label: string, hint?: string, type = 'text') => (
    <label className="block"><span className="label">{label}</span>
      <input type={type} className="input" disabled={!admin} value={(f[key] as string | null) ?? ''} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink">Dealership settings</h1>
      {!admin && <p className="mt-2 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-700">Only admins can change these settings.</p>}
      <div className="card mt-6 grid gap-4 p-6 sm:grid-cols-2">
        {input('name', 'Dealership name')}
        {input('tagline', 'Tagline')}
        {input('phone', 'Phone number', 'Shown in the header, e.g. +263 77 123 4567', 'tel')}
        {input('whatsapp', 'WhatsApp number', 'Used for every WhatsApp button, e.g. +263 77 123 4567', 'tel')}
        {input('email', 'Email', undefined, 'email')}
        {input('address', 'Address', 'Also used for the map on the Contact page')}
        <div className="sm:col-span-2">{input('map_url', 'Google Maps embed link (optional)', 'In Google Maps: Share > Embed a map > copy the src link. Leave empty to use the address.', 'url')}</div>
        <label className="block"><span className="label">ZiG per 1 USD (optional)</span>
          <input type="number" step="0.0001" min={0} className="input" disabled={!admin} value={f.zig} onChange={(e) => setF({ ...f, zig: e.target.value })} />
          <span className="mt-1 block text-xs text-neutral-500">Shows an approximate ZiG price on each car. Leave empty to hide it.</span>
        </label>
      </div>
      <div className="card mt-6 p-6">
        <h2 className="font-bold text-ink">Opening hours</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {HOUR_ROWS.map((d) => (
            <label key={d} className="block"><span className="label">{d}</span>
              <input className="input" disabled={!admin} value={hours[d] ?? ''} onChange={(e) => setHours({ ...hours, [d]: e.target.value })} placeholder={d.startsWith('Sun') ? 'Closed' : '8:00 – 17:00'} />
            </label>
          ))}
        </div>
      </div>
      {admin && (
        <div className="mt-6 flex items-center gap-4">
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
          {msg && <p className={`text-sm ${msg.ok ? 'text-ink' : 'text-red-700'}`}>{msg.text}</p>}
        </div>
      )}
    </form>
  )
}
