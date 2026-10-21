import { useEffect, useState } from 'react'
import { errMessage } from '../lib/errors'
import { Link, useParams } from 'react-router-dom'
import { fetchSimilar, fetchVehicleBySlug } from '../lib/api'
import {
  BODY_TYPES, CONDITIONS, DRIVES, DUTY, FUELS, TRANSMISSIONS,
  formatEngine, formatKm, formatUsd, formatZig, telLink, vehicleTitle, whatsappLink,
} from '../lib/format'
import { useSettings } from '../lib/settings'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Vehicle } from '../lib/types'
import Gallery from '../components/Gallery'
import LeadForm from '../components/LeadForm'
import FinanceCalculator from '../components/FinanceCalculator'
import VehicleCard, { StatusBadge } from '../components/VehicleCard'
import Spinner, { ErrorBox } from '../components/Spinner'
import { CheckIcon, ChevronLeft, PhoneIcon, ShareIcon, WhatsAppIcon } from '../components/Icons'

type Tab = 'inquiry' | 'test_drive' | 'finance'

export default function VehicleDetail() {
  const { slug = '' } = useParams()
  const { settings } = useSettings()
  const [v, setV] = useState<Vehicle | null | undefined>(undefined)
  const [similar, setSimilar] = useState<Vehicle[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('inquiry')
  const [copied, setCopied] = useState(false)
  useDocumentTitle(v ? `${vehicleTitle(v)}${v.variant ? ` ${v.variant}` : ''}` : undefined)

  const load = () => {
    setError(null); setV(undefined)
    fetchVehicleBySlug(slug)
      .then((data) => {
        setV(data)
        if (data) fetchSimilar(data).then(setSimilar).catch(() => setSimilar([]))
      })
      .catch((e) => setError(errMessage(e, 'Could not load this car')))
  }
  useEffect(() => { window.scrollTo(0, 0); load() }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="container-x py-16"><ErrorBox message={error} onRetry={load} /></div>
  if (v === undefined) return <Spinner label="Loading car" />
  if (v === null) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">This car is no longer listed</h1>
        <p className="mt-2 text-neutral-500">It may have been sold. Have a look at what else we have in stock.</p>
        <Link to="/inventory" className="btn-primary mt-6">Browse cars</Link>
      </div>
    )
  }

  const title = vehicleTitle(v)
  const pageUrl = window.location.href
  const priceText = v.price_usd != null ? ` listed at ${formatUsd(v.price_usd)}` : ''
  const waText = `Hi ${settings.name}, I'm interested in the ${title}${v.variant ? ` ${v.variant}` : ''}${v.stock_number ? ` (stock #${v.stock_number})` : ''}${priceText}. Is it still available?\n${pageUrl}`
  const wa = whatsappLink(settings.whatsapp, waText)
  const tel = telLink(settings.phone)
  const zig = formatZig(v.price_usd, settings.zig_per_usd)
  const reduced = v.previous_price_usd && v.price_usd && Number(v.previous_price_usd) > Number(v.price_usd)
  const sold = v.status === 'sold'

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, text: `${title} at ${settings.name}`, url: pageUrl })
      else { await navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* user cancelled */ }
  }

  const priceCard = (
<div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-ink">{title}</h1>
          {v.variant && <p className="mt-0.5 text-neutral-500">{v.variant}</p>}
        </div>
        <StatusBadge v={v} />
      </div>
      <div className="mt-4">
        {reduced && <p className="text-sm text-neutral-400 line-through">{formatUsd(v.previous_price_usd)}</p>}
        <p className="text-3xl font-bold text-ink">{formatUsd(v.price_usd)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          {zig && <span>≈ {zig}</span>}
          {v.price_negotiable && <span className="chip">Negotiable</span>}
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {sold ? (
          <p className="rounded-md bg-neutral-100 p-3 text-center text-sm text-neutral-600">This car has been sold. <Link to="/inventory" className="font-semibold text-ink underline">See similar cars</Link></p>
        ) : (
          <>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa w-full text-base"><WhatsAppIcon width={18} height={18} /> WhatsApp about this car</a>}
            {tel && <a href={tel} className="btn-dark w-full"><PhoneIcon width={16} height={16} /> Call {settings.phone}</a>}
          </>
        )}
        <button onClick={share} className="btn-outline w-full"><ShareIcon width={16} height={16} /> {copied ? 'Link copied' : 'Share'}</button>
      </div>
    </div>
  )

  const specs: [string, string | null][] = [
    ['Year', String(v.year)],
    ['Mileage', formatKm(v.mileage_km)],
    ['Body type', BODY_TYPES[v.body_type]],
    ['Fuel', FUELS[v.fuel]],
    ['Transmission', TRANSMISSIONS[v.transmission]],
    ['Engine', formatEngine(v.engine_cc)],
    ['Drive', v.drive ? DRIVES[v.drive] : null],
    ['Colour', v.colour],
    ['Doors', v.doors ? String(v.doors) : null],
    ['Seats', v.seats ? String(v.seats) : null],
    ['Condition', CONDITIONS[v.condition]],
    ['Duty', DUTY[v.duty]],
    ['Location', v.location],
    ['Stock no.', v.stock_number],
  ]

  return (
    <div className="container-x py-6 sm:py-8">
      <Link to="/inventory" className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-ink"><ChevronLeft width={16} height={16} /> Back to all cars</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <Gallery images={v.vehicle_images ?? []} title={title} />
          <div className="mt-6 lg:hidden">{priceCard}</div>

          <div className="card mt-6 p-6">
            <h2 className="text-lg font-bold text-ink">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specs.filter(([, val]) => val).map(([k, val]) => (
                <div key={k} className="border-b border-neutral-100 pb-2">
                  <dt className="text-xs uppercase tracking-wide text-neutral-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          {v.features.length > 0 && (
            <div className="card mt-6 p-6">
              <h2 className="text-lg font-bold text-ink">Features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {v.features.map((f) => <li key={f} className="flex items-center gap-2 text-neutral-700"><CheckIcon width={16} height={16} className="text-ink" />{f}</li>)}
              </ul>
            </div>
          )}

          {v.description && (
            <div className="card mt-6 p-6">
              <h2 className="text-lg font-bold text-ink">About this car</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">{v.description}</p>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">{priceCard}</div>

          {!sold && (
            <div className="card p-6">
              <div className="grid grid-cols-3 gap-1 rounded-md bg-neutral-100 p-1 text-sm font-semibold" role="tablist">
                {([['inquiry', 'Enquire'], ['test_drive', 'Test drive'], ['finance', 'Finance']] as [Tab, string][]).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg py-2 transition ${tab === k ? 'bg-white text-ink shadow-sm' : 'text-neutral-600'}`}>{l}</button>
                ))}
              </div>
              <div className="mt-5">
                {tab === 'inquiry' && (
                  <LeadForm compact type="inquiry" vehicleId={v.id} submitLabel="Send enquiry" defaultMessage={`Hi, is the ${title} still available?`} />
                )}
                {tab === 'test_drive' && (
                  <LeadForm compact type="test_drive" vehicleId={v.id} showDate submitLabel="Book test drive" showMessage={false} successText="Thanks! We will confirm your test drive time shortly." />
                )}
                {tab === 'finance' && (
                  <>
                    <FinanceCalculator compact price={v.price_usd} />
                    <div className="mt-6 border-t border-neutral-200 pt-6">
                      <h3 className="mb-4 font-bold text-ink">Apply for finance</h3>
                      <LeadForm
                        compact type="finance" vehicleId={v.id} submitLabel="Send application" showMessage={false}
                        successText="Thanks! Our team will contact you about finance options."
                        extra={
                          <div className="grid gap-4">
                            <div><label className="label" htmlFor="fin-dep">Deposit you can pay (USD)</label><input id="fin-dep" name="d_deposit_usd" type="number" min={0} className="input" /></div>
                            <div><label className="label" htmlFor="fin-inc">Monthly income (USD)</label><input id="fin-inc" name="d_monthly_income_usd" type="number" min={0} className="input" /></div>
                            <div><label className="label" htmlFor="fin-emp">Employer</label><input id="fin-emp" name="d_employer" maxLength={120} className="input" /></div>
                          </div>
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink">You might also like</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((s) => <VehicleCard key={s.id} v={s} />)}</div>
        </section>
      )}
    </div>
  )
}
