import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SettingsProvider } from './lib/settings'
import { AuthProvider } from './lib/auth'
import { isConfigured, supabase } from './lib/supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFab from './components/WhatsAppFab'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import VehicleDetail from './pages/VehicleDetail'
import Finance from './pages/Finance'
import Sell from './pages/Sell'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Spinner from './components/Spinner'
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const Vehicles = lazy(() => import('./admin/Vehicles'))
const VehicleEditor = lazy(() => import('./admin/VehicleEditor'))
const Leads = lazy(() => import('./admin/Leads'))
const Settings = lazy(() => import('./admin/Settings'))
const Staff = lazy(() => import('./admin/Staff'))
const ResetPassword = lazy(() => import('./admin/ResetPassword'))

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!isConfigured && <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">Database not connected yet: listings will appear once it is configured.</div>}
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFab />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/** Password-reset emails land on "/?reset=1"; send staff to the reset form. */
function RecoveryRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const url = new URL(window.location.href)
    const fromEmail = url.searchParams.get('reset') === '1'
    const go = () => {
      url.searchParams.delete('reset'); url.searchParams.delete('code')
      window.history.replaceState(null, '', url.pathname + url.search + '#/admin/reset-password')
      navigate('/admin/reset-password', { replace: true })
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (fromEmail && session)) go()
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])
  return null
}

/** Remount the editor when switching between cars, or from "new" to a saved car. */
function EditorRoute() {
  const { id } = useParams()
  const [params] = useSearchParams()
  return <VehicleEditor key={`${id ?? 'new'}-${params.get('from') ?? ''}`} />
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <HashRouter>
          <ScrollToTop />
          <RecoveryRedirect />
          <Suspense fallback={<Spinner />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="cars/:slug" element={<VehicleDetail />} />
              <Route path="finance" element={<Finance />} />
              <Route path="sell" element={<Sell />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/reset-password" element={<ResetPassword />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/new" element={<EditorRoute />} />
              <Route path="vehicles/:id" element={<EditorRoute />} />
              <Route path="leads" element={<Leads />} />
              <Route path="settings" element={<Settings />} />
              <Route path="staff" element={<Staff />} />
            </Route>
          </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
