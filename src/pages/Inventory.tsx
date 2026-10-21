import { useCallback, useEffect, useMemo, useState } from 'react'
import { errMessage } from '../lib/errors'
import { useSearchParams } from 'react-router-dom'
import { PAGE_SIZE, fetchFacets, fetchInventory, type InventoryFilters } from '../lib/api'
import { BODY_TYPES, CONDITIONS, FUELS, TRANSMISSIONS } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Vehicle } from '../lib/types'
import VehicleCard, { VehicleCardSkeleton } from '../components/VehicleCard'
import { ErrorBox } from '../components/Spinner'
import { CloseIcon, SearchIcon } from '../components/Icons'

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)
const PRICES = [3000, 5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000]
const FILTER_KEYS = ['q', 'make', 'model', 'body', 'fuel', 'transmission', 'condition', 'location', 'minPrice', 'maxPrice', 'minYear', 'maxYear'] as const

function readFilters(p: URLSearchParams): InventoryFilters {
  const n = (k: string) => (p.get(k) ? Number(p.get(k)) || undefined : undefined)
  return {
    q: p.get('q') ?? undefined,
    make: p.get('make') ?? undefined,
    model: p.get('model') ?? undefined,
    body: (p.get('body') as InventoryFilters['body']) ?? undefined,
    fuel: (p.get('fuel') as InventoryFilters['fuel']) ?? undefined,
    transmission: (p.get('transmission') as InventoryFilters['transmission']) ?? undefined,
    condition: (p.get('condition') as InventoryFilters['condition']) ?? undefined,
    location: p.get('location') ?? undefined,
    minPrice: n('minPrice'), maxPrice: n('maxPrice'), minYear: n('minYear'), maxYear: n('maxYear'),
    sort: (p.get('sort') as InventoryFilters['sort']) ?? 'newest',
  }
}

export default function Inventory() {
  useDocumentTitle('Browse cars')
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const [facets, setFacets] = useState<Awaited<ReturnType<typeof fetchFacets>> | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [q, setQ] = useState(filters.q ?? '')

  useEffect(() => { fetchFacets().then(setFacets).catch(() => {}) }, [])

  const load = useCallback(async (pageNo: number) => {
    setLoading(true); setError(null)
    try {
      const res = await fetchInventory(filters, pageNo)
      setVehicles((prev) => (pageNo === 0 ? res.vehicles : [...prev, ...res.vehicles]))
      setTotal(res.total)
      setPage(pageNo)
    } catch (e) {
      setError(errMessage(e, 'Could not load cars'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { void load(0) }, [load])
  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key === 'make') next.delete('model')
    setParams(next, { replace: true })
  }
  const clear = () => setParams(new URLSearchParams(params.get('sort') ? { sort: params.get('sort')! } : {}), { replace: true })
  const active = FILTER_KEYS.filter((k) => params.get(k))

  const sel = (key: string, label: string, options: [string, string][], placeholder = 'Any') => (
    <div>
      <label className="label" htmlFor={`f-${key}`}>{label}</label>
      <select id={`f-${key}`} className="input" value={params.get(key) ?? ''} onChange={(e) => set(key, e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )

  const filterPanel = (
    <div className="space-y-4">
      {sel('make', 'Make', (facets?.makes ?? []).map((m) => [m, m]), 'Any make')}
      {sel('model', 'Model', (filters.make ? facets?.modelsByMake[filters.make] ?? [] : []).map((m) => [m, m]), filters.make ? 'Any model' : 'Choose a make first')}
      {sel('body', 'Body type', Object.entries(BODY_TYPES))}
      <div className="grid grid-cols-2 gap-3">
        {sel('minPrice', 'Min price', PRICES.map((p) => [String(p), `$${p.toLocaleString()}`]), 'No min')}
        {sel('maxPrice', 'Max price', PRICES.map((p) => [String(p), `$${p.toLocaleString()}`]), 'No max')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {sel('minYear', 'From year', YEARS.map((y) => [String(y), String(y)]), 'Any')}
        {sel('maxYear', 'To year', YEARS.map((y) => [String(y), String(y)]), 'Any')}
      </div>
      {sel('fuel', 'Fuel', Object.entries(FUELS))}
      {sel('transmission', 'Transmission', Object.entries(TRANSMISSIONS))}
      {sel('condition', 'Condition', Object.entries(CONDITIONS))}
      {facets && facets.locations.length > 1 && sel('location', 'Location', facets.locations.map((l) => [l, l]))}
      {active.length > 0 && <button onClick={clear} className="btn-outline w-full">Clear all filters</button>}
    </div>
  )

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Browse cars</h1>
          <p className="mt-1 text-neutral-500">{loading && page === 0 ? 'Searching…' : `${total} car${total === 1 ? '' : 's'} found`}</p>
        </div>
        <div className="flex gap-2">
          <form className="relative flex-1 sm:w-72" onSubmit={(e) => { e.preventDefault(); set('q', q.trim()) }}>
            <SearchIcon width={16} height={16} className="absolute left-3 top-1/2 -tranneutral-y-1/2 text-neutral-400" />
            <input className="input pl-9" placeholder="Search e.g. Hilux, Fit" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cars" />
          </form>
          <select className="input w-auto" value={filters.sort} onChange={(e) => set('sort', e.target.value === 'newest' ? '' : e.target.value)} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="mileage_asc">Lowest mileage</option>
            <option value="year_desc">Newest year</option>
          </select>
        </div>
      </div>

      <button className="btn-outline mt-4 w-full lg:hidden" onClick={() => setShowFilters(true)}>
        Filters{active.length ? ` (${active.length})` : ''}
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="card sticky top-24 p-5">{filterPanel}</div></aside>
        <div>
          {error ? (
            <ErrorBox message={error} onRetry={() => load(0)} />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}
                {loading && Array.from({ length: page === 0 ? 6 : 3 }, (_, i) => <VehicleCardSkeleton key={`s${i}`} />)}
              </div>
              {!loading && vehicles.length === 0 && (
                <div className="card p-10 text-center">
                  <p className="font-semibold text-ink">No cars match your search</p>
                  <p className="mt-1 text-sm text-neutral-500">Try removing a filter, or ask us on WhatsApp. We can often source the car you want.</p>
                  {active.length > 0 && <button onClick={clear} className="btn-outline mt-4">Clear filters</button>}
                </div>
              )}
              {!loading && vehicles.length < total && (
                <div className="mt-8 text-center">
                  <button className="btn-dark" onClick={() => load(page + 1)}>Show more ({total - vehicles.length} left)</button>
                </div>
              )}
              {vehicles.length >= PAGE_SIZE && vehicles.length >= total && <p className="mt-8 text-center text-sm text-neutral-400">You have seen all {total} cars.</p>}
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button className="rounded-lg p-2 hover:bg-neutral-100" onClick={() => setShowFilters(false)} aria-label="Close filters"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
            <div className="border-t border-neutral-200 p-4"><button className="btn-primary w-full" onClick={() => setShowFilters(false)}>Show {total} cars</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
