import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { LEAD_TYPES, formatDate } from '../lib/format'
import type { Lead } from '../lib/types'

interface Stats { available: number; reserved: number; drafts: number; soldMonth: number; newLeads: number; weekLeads: number }

async function count(build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
  const { count } = await build(base())
  return count ?? 0
}
const base = () => supabase.from('vehicles').select('id', { count: 'exact', head: true })

export default function Dashboard() {
  const { staff } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Lead[]>([])

  useEffect(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    Promise.all([
      count((q) => q.eq('status', 'available')),
      count((q) => q.eq('status', 'reserved')),
      count((q) => q.eq('status', 'draft')),
      count((q) => q.eq('status', 'sold').gte('sold_at', monthStart.toISOString())),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new').then((r) => r.count ?? 0),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).then((r) => r.count ?? 0),
    ]).then(([available, reserved, drafts, soldMonth, newLeads, weekLeads]) => setStats({ available, reserved, drafts, soldMonth, newLeads, weekLeads }))
    supabase.from('leads').select('*, vehicles(id, slug, year, make, model, stock_number)').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setRecent((data ?? []) as Lead[]))
  }, [])

  const tiles: [string, number | undefined, string][] = [
    ['Cars for sale', stats?.available, '/admin/vehicles?status=available'],
    ['Reserved', stats?.reserved, '/admin/vehicles?status=reserved'],
    ['Drafts', stats?.drafts, '/admin/vehicles?status=draft'],
    ['Sold this month', stats?.soldMonth, '/admin/vehicles?status=sold'],
    ['New leads', stats?.newLeads, '/admin/leads?status=new'],
    ['Leads this week', stats?.weekLeads, '/admin/leads'],
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Hi {staff?.full_name.split(' ')[0]}</h1>
        <Link to="/admin/vehicles/new" className="btn-primary">+ Add a car</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, val, to]) => (
          <Link key={label} to={to} className="card p-4 hover:border-ink">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-ink">{val ?? '–'}</p>
          </Link>
        ))}
      </div>
      <div className="card mt-8">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <h2 className="font-bold text-ink">Latest leads</h2>
          <Link to="/admin/leads" className="text-sm font-semibold text-ink hover:text-brand">View all →</Link>
        </div>
        {recent.length === 0 ? <p className="p-6 text-sm text-neutral-500">No leads yet. They will appear here when customers send enquiries.</p> : (
          <ul className="divide-y divide-neutral-100">
            {recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div>
                  <p className="font-semibold text-ink">{l.full_name} <span className="font-normal text-neutral-500">· {LEAD_TYPES[l.type]}</span></p>
                  <p className="text-neutral-500">{l.vehicles ? `${l.vehicles.year} ${l.vehicles.make} ${l.vehicles.model}` : 'General'} · {formatDate(l.created_at)}</p>
                </div>
                {l.status === 'new' && <span className="rounded-sm bg-brand px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">NEW</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
