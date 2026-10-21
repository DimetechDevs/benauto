import { Link } from 'react-router-dom'
import type { Vehicle } from '../lib/types'
import { CONDITIONS, FUELS, TRANSMISSIONS, formatEngine, formatKm, formatUsd, vehicleTitle } from '../lib/format'
import { photoUrl } from '../lib/supabase'
import { CarIcon, FuelIcon, GaugeIcon, GearIcon, PinIcon } from './Icons'

export function coverImage(v: Vehicle) {
  const img = [...(v.vehicle_images ?? [])].sort((a, b) => a.position - b.position)[0]
  return img ? { src: photoUrl(img.thumb_path || img.storage_path), alt: img.alt_text || vehicleTitle(v) } : null
}

export function StatusBadge({ v }: { v: Pick<Vehicle, 'status' | 'previous_price_usd' | 'price_usd' | 'condition'> }) {
  if (v.status === 'sold') return <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">SOLD</span>
  if (v.status === 'reserved') return <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-ink">RESERVED</span>
  if (v.previous_price_usd && v.price_usd && Number(v.previous_price_usd) > Number(v.price_usd))
    return <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">REDUCED</span>
  if (v.condition === 'recent_import') return <span className="rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white">RECENT IMPORT</span>
  return null
}

export default function VehicleCard({ v }: { v: Vehicle }) {
  const cover = coverImage(v)
  const reduced = v.previous_price_usd && v.price_usd && Number(v.previous_price_usd) > Number(v.price_usd)
  return (
    <Link to={`/cars/${v.slug}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover?.src ? (
          <img src={cover.src} alt={cover.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-slate-300"><CarIcon width={56} height={56} /></div>
        )}
        <div className="absolute left-3 top-3"><StatusBadge v={v} /></div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{CONDITIONS[v.condition]}{v.stock_number ? ` · #${v.stock_number}` : ''}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-ink">{vehicleTitle(v)}</h3>
        {v.variant && <p className="truncate text-sm text-slate-500">{v.variant}</p>}
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-1.5"><GaugeIcon width={15} height={15} />{formatKm(v.mileage_km)}</li>
          <li className="flex items-center gap-1.5"><GearIcon width={15} height={15} />{TRANSMISSIONS[v.transmission]}</li>
          <li className="flex items-center gap-1.5"><FuelIcon width={15} height={15} />{FUELS[v.fuel]}{v.engine_cc ? ` ${formatEngine(v.engine_cc)}` : ''}</li>
          {v.location && <li className="flex items-center gap-1.5"><PinIcon width={15} height={15} />{v.location}</li>}
        </ul>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {reduced && <p className="text-xs text-slate-400 line-through">{formatUsd(v.previous_price_usd)}</p>}
            <p className="text-xl font-extrabold text-ink">{formatUsd(v.price_usd)}</p>
          </div>
          {v.price_negotiable && <span className="chip">Negotiable</span>}
        </div>
      </div>
    </Link>
  )
}

export function VehicleCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}
