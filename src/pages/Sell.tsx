import LeadForm from '../components/LeadForm'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { CashIcon, ClockIcon, ShieldIcon } from '../components/Icons'

export default function Sell() {
  useDocumentTitle('Sell or trade in your car')
  return (
    <div className="container-x py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Sell or trade in your car</h1>
          <p className="mt-3 text-lg text-slate-600">Tell us about your car and we will send you an offer. Use it as cash or put it towards your next car.</p>
          <ul className="mt-8 space-y-5">
            {[
              { icon: <ClockIcon />, t: 'Quick offer', d: 'Usually within one working day, by WhatsApp or phone.' },
              { icon: <CashIcon />, t: 'Fair USD prices', d: 'Based on real market prices for your make, model and condition.' },
              { icon: <ShieldIcon />, t: 'No obligation', d: 'Not happy with the offer? No problem.' },
            ].map((x) => (
              <li key={x.t} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-dark">{x.icon}</span>
                <div><p className="font-bold text-ink">{x.t}</p><p className="text-sm text-slate-600">{x.d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 sm:p-8">
          <LeadForm
            type="trade_in"
            submitLabel="Get my offer"
            defaultMessage=""
            successText="Thanks! We will review your car and send an offer shortly."
            extra={
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="t-make">Make</label><input id="t-make" name="d_make" required maxLength={60} placeholder="e.g. Toyota" className="input" /></div>
                <div><label className="label" htmlFor="t-model">Model</label><input id="t-model" name="d_model" required maxLength={60} placeholder="e.g. Corolla" className="input" /></div>
                <div><label className="label" htmlFor="t-year">Year</label><input id="t-year" name="d_year" type="number" required min={1980} max={new Date().getFullYear() + 1} className="input" /></div>
                <div><label className="label" htmlFor="t-km">Mileage (km)</label><input id="t-km" name="d_mileage_km" type="number" min={0} className="input" /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor="t-ask">Asking price (USD, optional)</label><input id="t-ask" name="d_asking_usd" type="number" min={0} className="input" /></div>
              </div>
            }
          />
          <p className="mt-4 text-xs text-slate-500">Tip: after sending, WhatsApp us a few photos of the car for a faster, more accurate offer.</p>
        </div>
      </div>
    </div>
  )
}
