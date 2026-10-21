import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, photoUrl } from '../lib/supabase'
import { STATUSES, formatKm, formatUsd, vehicleTitle } from '../lib/format'
import type { Vehicle, VehicleStatus } from '../lib/types'
import Spinner, { ErrorBox } from '../components/Spinner'
import { CarIcon, SearchIcon } from '../components/Icons'

const STATUS_STYLE: Record<VehicleStatus, string> = {
  draft: 'bg-slate-200 text-slate-700',
  available: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-amber-100 text-amber-800',
  sold: 'bg-red-100 text-red-700',
}

export default function Vehicles() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as VehicleStatus | ''
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setRows(null); setError(null)
    let query = supabase.from('vehicles').select('*, vehicle_images(id, storage_path, thumb_path, position)').order('updated_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) setError(error.message)
    else setRows((data ?? []) as Vehicle[])
  }
  useEffect(() => { void load() }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(v: Vehicle, s: VehicleStatus) {
    const { error } = await supabase.from('vehicles').update({ status: s }).eq('id', v.id)
    if (error) alert(error.message)
    else setRows((r) => r?.map((x) => (x.id === v.id ? { ...x, status: s } : x)) ?? null)
  }

  const term = q.trim().toLowerCase()
  const shown = rows?.filter((v) => !term || `${v.year} ${v.make} ${v.model} ${v.variant ?? ''} ${v.stock_number ?? ''}`.toLowerCase().includes(term))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">Cars</h1>
        <Link to="/admin/vehicles/new" className="btn-primary">+ Add a car</Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {(['', 'available', 'reserved', 'draft', 'sold'] as const).map((s) => (
          <button key={s || 'all'} onClick={() => setParams(s ? { status: s } : {})} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${status === s ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>
            {s ? STATUSES[s] : 'All'}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search make, model, stock no." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {error ? <div className="mt-6"><ErrorBox message={error} onRetry={load} /></div> : !shown ? <Spinner /> : shown.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">No cars here yet. <Link to="/admin/vehicles/new" className="font-semibold text-ink underline">Add your first car</Link>.</div>
      ) : (
        <div className="card mt-6 divide-y divide-slate-100">
          {shown.map((v) => {
            const cover = [...(v.vehicle_images ?? [])].sort((a, b) => a.position - b.position)[0]
            return (
              <div key={v.id} className="flex flex-wrap items-center gap-4 p-4">
                <Link to={`/admin/vehicles/${v.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                    {cover ? <img src={photoUrl(cover.thumb_path || cover.storage_path)!} alt="" className="h-full w-full object-cover" loading="lazy" /> : <CarIcon />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{vehicleTitle(v)} {v.variant && <span className="font-normal text-slate-500">{v.variant}</span>}</p>
                    <p className="text-sm text-slate-500">{formatUsd(v.price_usd)} · {formatKm(v.mileage_km)}{v.stock_number ? ` · #${v.stock_number}` : ''} · {v.vehicle_images?.length ?? 0} photos{v.featured ? ' · ★ Featured' : ''}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <select aria-label="Status" value={v.status} onChange={(e) => setStatus(v, e.target.value as VehicleStatus)} className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-bold ${STATUS_STYLE[v.status]}`}>
                    {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <Link to={`/admin/vehicles/${v.id}`} className="btn-outline btn-sm">Edit</Link>
                  {v.status !== 'draft' && <Link to={`/cars/${v.slug}`} target="_blank" className="btn-outline btn-sm">View</Link>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
