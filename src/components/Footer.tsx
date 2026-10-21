import { Link } from 'react-router-dom'
import { useSettings } from '../lib/settings'
import { orderedHours, telLink, whatsappLink } from '../lib/format'
import { Logo } from './Header'
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from './Icons'

export default function Footer() {
  const { settings } = useSettings()
  const wa = whatsappLink(settings.whatsapp, `Hi ${settings.name}, I'd like some help finding a car.`)
  const hours = orderedHours(settings.opening_hours)
  return (
    <footer className="mt-20 bg-ink text-neutral-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
            {settings.tagline || 'Quality used and imported cars in Zimbabwe.'} Honest prices in USD, finance options and friendly service.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/inventory">Browse cars</Link></li>
            <li><Link className="hover:text-white" to="/finance">Finance calculator</Link></li>
            <li><Link className="hover:text-white" to="/sell">Sell or trade in</Link></li>
            <li><Link className="hover:text-white" to="/about">About us</Link></li>
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.address && <li className="flex gap-2"><PinIcon width={16} height={16} className="mt-0.5 shrink-0" />{settings.address}</li>}
            {settings.phone && <li><a className="flex gap-2 hover:text-white" href={telLink(settings.phone)!}><PhoneIcon width={16} height={16} className="mt-0.5" />{settings.phone}</a></li>}
            {wa && <li><a className="flex gap-2 hover:text-white" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon width={16} height={16} className="mt-0.5" />WhatsApp us</a></li>}
            {settings.email && <li><a className="flex gap-2 hover:text-white" href={`mailto:${settings.email}`}><MailIcon width={16} height={16} className="mt-0.5" />{settings.email}</a></li>}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Opening hours</h3>
          {hours.length ? (
            <ul className="mt-4 space-y-1.5 text-sm">
              {hours.map(([d, h]) => <li key={d} className="flex justify-between gap-4"><span>{d}</span><span className="text-neutral-400">{h}</span></li>)}
            </ul>
          ) : (
            <p className="mt-4 flex gap-2 text-sm text-neutral-400"><ClockIcon width={16} height={16} className="mt-0.5" />Call or WhatsApp us for viewing times.</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
          <p>Prices in USD. Vehicles subject to prior sale. <Link to="/admin" className="hover:text-neutral-300">Staff login</Link></p>
        </div>
      </div>
    </footer>
  )
}
