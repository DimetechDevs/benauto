import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { LEAD_STATUSES, LEAD_TYPES, formatDate, formatUsd, telLink, whatsappLink } from '../lib/format'
import type { Lead, LeadStatus, LeadType } from '../lib/types'
import Spinner, { ErrorBox } from '../components/Spinner'
import { PhoneIcon, WhatsAppIcon } from '../components/Icons'

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-brand text-ink', contacted: 'bg-sky-100 text-sky-800', won: 'bg-emerald-100 text-emerald-800', lost: 'bg-slate-200 text-slate-600',
}
const DETAIL_LABELS: Record<string, string> = {
  deposit_usd: 'Deposit', monthly_income_usd: 'Monthly income', employer: 'Employer', budget_usd: 'Budget', term_months: 'Term',
  make: 'Make', model: 'Model', year: 'Year', mileage_km: 'Mileage', asking_usd: 'Asking price',
}
function detailValue(k: string, v: unknown) {
  if (k.endsWith('_usd')) return formatUsd(Number(v))
  if (k === 'mileage_km') return `${Number(v).toLocaleString()} km`
  if (k === 'term_months') return `${v} months`
  return String(v)
}

export default function Leads() {
  const { staff } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as LeadStatus | ''
  const type = (params.get('type') ?? '') as LeadType | ''
  const [rows, setRows] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = async () => {
    setRows(null); setError(null)
    let q = supabase.from('leads').select('*, vehicles(id, slug, year, make, model, stock_number)').order('created_at', { ascending: false }).limit(300)
    if (status) q = q.eq('status', status)
    if (type) q = q.eq('type', type)
    const { data, error } = await q
    if (error) setError(error.message); else setRows((data ?? []) as Lead[])
  }
  useEffect(() => { void load() }, [status, type]) // eslint-disable-line react-hooks/exhaustive-deps

  async function update(l: Lead, patch: Partial<Lead>) {
    const { error } = await supabase.from('leads').update(patch).eq('id', l.id)
    if (error) { alert(error.message); return }
    setRows((r) => r?.map((x) => (x.id === l.id ? { ...x, ...patch } : x)) ?? null)
  }
  async function remove(l: Lead) {
    if (!confirm(`Delete the lead from ${l.full_name}?`)) return
    const { error } = await supabase.from('leads').delete().eq('id', l.id)
    if (error) alert(error.message); else setRows((r) => r?.filter((x) => x.id !== l.id) ?? null)
  }
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n) }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Leads</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <select className="input w-auto" value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>{Object.entries(LEAD_STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className="input w-auto" value={type} onChange={(e) => setParam('type', e.target.value)} aria-label="Type">
          <option value="">All types</option>{Object.entries(LEAD_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {error ? <div className="mt-6"><ErrorBox message={error} onRetry={load} /></div> : !rows ? <Spinner /> : rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">No leads match these filters.</div>
      ) : (
        <div className="card mt-6 divide-y divide-slate-100">
          {rows.map((l) => {
            const carName = l.vehicles ? `${l.vehicles.year} ${l.vehicles.make} ${l.vehicles.model}` : null
            const wa = whatsappLink(l.phone, `Hi ${l.full_name.split(' ')[0]}, thanks for your ${LEAD_TYPES[l.type].toLowerCase()} request${carName ? ` about the ${carName}` : ''}.`)
            const isOpen = open === l.id
            return (
              <div key={l.id} className="p-4">
                <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{l.full_name} <span className="font-normal text-slate-500">· {LEAD_TYPES[l.type]}{carName ? ` · ${carName}` : ''}</span></p>
                    <p className="text-sm text-slate-500">{l.phone} · {formatDate(l.created_at)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[l.status]}`}>{LEAD_STATUSES[l.status]}</span>
                </button>
                {isOpen && (
                  <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      {l.email && <p><span className="text-slate-500">Email:</span> <a className="font-medium text-ink underline" href={`mailto:${l.email}`}>{l.email}</a></p>}
                      <p><span className="text-slate-500">Prefers WhatsApp:</span> {l.prefers_whatsapp ? 'Yes' : 'No'}</p>
                      {l.preferred_date && <p><span className="text-slate-500">Test drive:</span> {new Date(l.preferred_date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{l.preferred_time ? `, ${l.preferred_time}` : ''}</p>}
                      {Object.entries(l.details ?? {}).map(([k, v]) => <p key={k}><span className="text-slate-500">{DETAIL_LABELS[k] ?? k}:</span> {detailValue(k, v)}</p>)}
                      {l.message && <p className="whitespace-pre-line rounded-lg bg-white p-3 text-slate-700 ring-1 ring-slate-200">{l.message}</p>}
                      {l.vehicles && <p><Link className="font-medium text-ink underline" to={`/admin/vehicles/${l.vehicles.id}`}>Open car in admin</Link></p>}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa btn-sm"><WhatsAppIcon width={14} height={14} /> WhatsApp</a>}
                        <a href={telLink(l.phone)!} className="btn-dark btn-sm"><PhoneIcon width={14} height={14} /> Call</a>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block"><span className="label">Status</span>
                        <select className="input" value={l.status} onChange={(e) => update(l, { status: e.target.value as LeadStatus })}>
                          {Object.entries(LEAD_STATUSES).map(([k, lab]) => <option key={k} value={k}>{lab}</option>)}
                        </select>
                      </label>
                      <label className="block"><span className="label">Staff notes</span>
                        <textarea rows={3} className="input" defaultValue={l.staff_notes ?? ''} onBlur={(e) => { if (e.target.value !== (l.staff_notes ?? '')) void update(l, { staff_notes: e.target.value || null }) }} placeholder="Saved when you click away" />
                      </label>
                      {staff?.is_admin && <button onClick={() => remove(l)} className="text-sm font-medium text-red-600 hover:underline">Delete lead</button>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
