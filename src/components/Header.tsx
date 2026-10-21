import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '../lib/settings'
import { telLink } from '../lib/format'
import { CloseIcon, MenuIcon, PhoneIcon } from './Icons'

const NAV = [
  { to: '/inventory', label: 'Browse Cars' },
  { to: '/finance', label: 'Finance' },
  { to: '/sell', label: 'Sell / Trade-in' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Logo({ light = false }: { light?: boolean }) {
  const { settings } = useSettings()
  const name = settings.name || 'Benauto'
  return (
    <Link to="/" className="flex items-center gap-2" aria-label={`${name} home`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-ink">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden><path d="M5 15l1.7-4.3A2 2 0 0 1 8.6 9.4h6.8a2 2 0 0 1 1.9 1.3L19 15v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/></svg>
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>{name}</span>
    </Link>
  )
}

export default function Header() {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  const tel = telLink(settings.phone)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-slate-100 text-ink' : 'text-slate-600 hover:text-ink'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {tel && (
            <a href={tel} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-100 sm:flex">
              <PhoneIcon width={16} height={16} /> {settings.phone}
            </a>
          )}
          <Link to="/inventory" className="btn-primary hidden !py-2.5 md:inline-flex">View Stock</Link>
          <button className="rounded-lg p-2 text-ink hover:bg-slate-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white lg:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-2">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">
                {n.label}
              </NavLink>
            ))}
            {tel && (
              <a href={tel} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-3 font-semibold text-ink">
                <PhoneIcon width={18} height={18} /> Call {settings.phone}
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
