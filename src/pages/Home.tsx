import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchFacets, fetchFeatured } from '../lib/api'
import { BODY_TYPES, whatsappLink } from '../lib/format'
import { useSettings } from '../lib/settings'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { BodyType, Vehicle } from '../lib/types'
import VehicleCard, { VehicleCardSkeleton } from '../components/VehicleCard'
import { CalendarIcon, CashIcon, SearchIcon, ShieldIcon, StarIcon, WhatsAppIcon } from '../components/Icons'

const BODY_SHORTCUTS: BodyType[] = ['suv', 'double_cab', 'sedan', 'hatchback', 'single_cab', 'minibus_van']

// Add real customer reviews here (name, short quote, town). The section stays
// hidden until at least one is added, so the site never shows made-up reviews.
const REVIEWS: { name: string; text: string; place: string }[] = []

export default function Home() {
  useDocumentTitle()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [featured, setFeatured] = useState<Vehicle[] | null>(null)
  const [facets, setFacets] = useState<Awaited<ReturnType<typeof fetchFacets>> | null>(null)
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    fetchFeatured(6).then(setFeatured).catch(() => setFeatured([]))
    fetchFacets().then(setFacets).catch(() => setFacets(null))
  }, [])

  const search = (e: FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (make) p.set('make', make)
    if (model) p.set('model', model)
    if (maxPrice) p.set('maxPrice', maxPrice)
    navigate(`/inventory${p.toString() ? `?${p}` : ''}`)
  }
  const wa = whatsappLink(settings.whatsapp, `Hi ${settings.name}, I'm looking for a car. Can you help?`)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60rem 30rem at 85% -10%, rgba(245,158,11,.45), transparent 60%), radial-gradient(40rem 25rem at -10% 110%, rgba(56,189,248,.25), transparent 60%)' }} />
        <div className="container-x relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {facets?.total ? `${facets.total} cars in stock now` : 'Fresh stock every week'}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Find your next car <span className="text-brand">with confidence.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Quality used and recently imported vehicles in Zimbabwe. Clear USD prices, finance options and test drives on your schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/inventory" className="btn-primary text-base">Browse all cars</Link>
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa text-base"><WhatsAppIcon width={18} height={18} /> Chat on WhatsApp</a>}
            </div>
          </div>
          <form onSubmit={search} className="rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <h2 className="text-lg font-bold text-ink">Search our stock</h2>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="label" htmlFor="h-make">Make</label>
                <select id="h-make" className="input" value={make} onChange={(e) => { setMake(e.target.value); setModel('') }}>
                  <option value="">Any make</option>
                  {facets?.makes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="h-model">Model</label>
                <select id="h-model" className="input" value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                  <option value="">Any model</option>
                  {make && facets?.modelsByMake[make]?.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="h-price">Max price</label>
                <select id="h-price" className="input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                  <option value="">No limit</option>
                  {[5000, 8000, 10000, 15000, 20000, 30000, 50000, 80000].map((p) => <option key={p} value={p}>Up to ${p.toLocaleString()}</option>)}
                </select>
              </div>
              <button className="btn-dark w-full text-base"><SearchIcon width={18} height={18} /> Show cars</button>
            </div>
          </form>
        </div>
      </section>

      {/* Body types */}
      <section className="container-x -mt-6 relative z-10">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {BODY_SHORTCUTS.map((b) => (
            <Link key={b} to={`/inventory?body=${b}`} className="card shrink-0 px-5 py-3 text-sm font-semibold text-ink hover:border-brand">
              {BODY_TYPES[b]}{facets?.bodyCounts[b] ? <span className="ml-2 text-slate-400">{facets.bodyCounts[b]}</span> : null}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Latest arrivals</h2>
            <p className="mt-1 text-slate-500">Hand-picked cars, inspected and ready to drive.</p>
          </div>
          <Link to="/inventory" className="hidden text-sm font-semibold text-ink hover:text-brand-dark sm:block">View all →</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured === null
            ? Array.from({ length: 3 }, (_, i) => <VehicleCardSkeleton key={i} />)
            : featured.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
        {featured?.length === 0 && (
          <div className="card p-10 text-center text-slate-500">New stock is on its way. Message us on WhatsApp to hear first.</div>
        )}
        <div className="mt-6 text-center sm:hidden"><Link to="/inventory" className="btn-outline">View all cars</Link></div>
      </section>

      {/* Why us */}
      <section className="container-x mt-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: <ShieldIcon />, title: 'Inspected & honest', text: 'Every car is checked before it is listed. What you see in the photos is what you get.' },
            { icon: <CashIcon />, title: 'Clear USD pricing', text: 'No hidden fees. We show duty status upfront so you know exactly what you are paying for.' },
            { icon: <CalendarIcon />, title: 'Finance & trade-ins', text: 'Spread the cost with finance, or trade in your current car towards your next one.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand-dark">{f.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      {REVIEWS.length > 0 && <section className="container-x mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">What our customers say</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="card p-6">
              <div className="flex gap-0.5 text-brand">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} width={16} height={16} />)}</div>
              <blockquote className="mt-3 text-slate-700">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-ink">{r.name} <span className="font-normal text-slate-500">· {r.place}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>}

      {/* CTA */}
      <section className="container-x mt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand to-amber-400 p-8 sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Want to sell or trade in your car?</h2>
            <p className="mt-2 max-w-xl text-ink/80">Tell us about it and we will send you an offer, usually the same day.</p>
          </div>
          <Link to="/sell" className="btn-dark shrink-0 text-base">Get an offer</Link>
        </div>
      </section>
    </>
  )
}
