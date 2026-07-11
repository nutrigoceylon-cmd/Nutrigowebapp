import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, CreditCard,
  Newspaper, Mic, Calendar, HelpCircle, MessageSquare, Menu, LogOut, ChevronRight,
  Stethoscope, BookMarked, Package,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BrandLogo } from './BrandLogo'
import { supabase, supabaseConfigured } from '../../lib/supabase'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/admin/add-ons', label: 'Add-Ons', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/articles', label: 'Articles CMS', icon: Newspaper },
  { to: '/admin/podcasts', label: 'Podcasts', icon: Mic },
  { to: '/admin/events', label: 'Events', icon: Calendar },
  { to: '/admin/faq', label: 'FAQ Manager', icon: HelpCircle },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/providers', label: 'Session Providers', icon: Stethoscope },
  { to: '/admin/session-bookings', label: 'Session Bookings', icon: BookMarked },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingBookingCount, setPendingBookingCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  useEffect(() => {
    if (!supabaseConfigured) return

    let cancelled = false

    async function loadPendingBookingCount() {
      const { count } = await supabase
        .from('session_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (!cancelled) {
        setPendingBookingCount(count ?? 0)
      }
    }

    loadPendingBookingCount()

    const intervalId = window.setInterval(loadPendingBookingCount, 15000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPendingBookingCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <BrandLogo imageClassName="h-10 w-auto" />
          </div>
          <span className="text-xs font-normal text-white/50 ml-1">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-white/65 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={17} />
              {label}
              {(to === '/admin/session-bookings' || active) && (
                <span className="ml-auto flex items-center gap-2">
                  {to === '/admin/session-bookings' && pendingBookingCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {pendingBookingCount}
                    </span>
                  )}
                  {active && <ChevronRight size={14} />}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {profile?.full_name?.[0] ?? 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-white/50 text-xs capitalize">{profile?.role}</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
        >
          <ChevronRight size={15} /> View Site
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm transition-colors cursor-pointer"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-primary flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-primary flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="lg:hidden">
            <span className="font-semibold text-gray-800 text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
              ← Back to Site
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {profile?.full_name?.[0] ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
