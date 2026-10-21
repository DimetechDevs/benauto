import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isConfigured } from '../lib/supabase'
import Spinner from '../components/Spinner'
import Login from './Login'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/vehicles', label: 'Cars' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/staff', label: 'Staff' },
]

export default function AdminLayout() {
  const { session, staff, loading, signOut } = useAuth()

  if (!isConfigured) return <div className="container-x py-20 text-center">The database connection is not configured yet.</div>
  if (loading) return <Spinner label="Checking login" />
  if (!session) return <Login />
  if (!staff) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-xl font-bold text-ink">No staff access</h1>
        <p className="mt-2 text-neutral-600">You are signed in as {session.user.email}, but this account has not been added as staff. Ask an admin to add you.</p>
        <button className="btn-outline mt-6" onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-30 bg-ink text-white">
        <div className="container-x flex h-14 items-center justify-between gap-4">
          <Link to="/admin" className="font-bold">Admin</Link>
          <nav className="no-scrollbar flex flex-1 gap-1 overflow-x-auto px-2" aria-label="Admin">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-white/15 text-white' : 'text-neutral-300 hover:text-white'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link to="/" className="hidden text-neutral-300 hover:text-white sm:inline" target="_blank">View site ↗</Link>
            <button onClick={signOut} className="rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20">Sign out</button>
          </div>
        </div>
      </header>
      <main className="container-x py-6 sm:py-8"><Outlet /></main>
    </div>
  )
}
