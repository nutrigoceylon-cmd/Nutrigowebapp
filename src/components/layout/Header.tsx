import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BrandLogo } from './BrandLogo'
import { CART_UPDATED_EVENT, getCartCount, readCart } from '../../lib/cart'

const navLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/menu', label: 'Our Menu' },
  { to: '/sessions', label: 'Book a Session' },
  { to: '/articles', label: 'Articles' },
  { to: '/events', label: 'Events' },
  { to: '/podcast', label: 'Podcast' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const syncCart = () => setCartCount(getCartCount(readCart()))

    syncCart()
    window.addEventListener('storage', syncCart)
    window.addEventListener(CART_UPDATED_EVENT, syncCart)

    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener(CART_UPDATED_EVENT, syncCart)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-opacity hover:opacity-90">
            <BrandLogo imageClassName="h-10 sm:h-11 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-accent bg-light-green'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/cart"
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                location.pathname === '/cart'
                  ? 'border-accent bg-light-green text-accent'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 border border-gray-200 hover:border-primary px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {profile?.full_name?.[0] ?? 'U'}
                  </div>
                  <span className="text-gray-700">{profile?.full_name?.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-light-green transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-primary" />
                      My Dashboard
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-light-green transition-colors"
                      >
                        <User size={16} className="text-primary" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 border border-primary text-primary hover:bg-primary hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <User size={15} />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary hover:bg-secondary text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-light-green text-accent'
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 mt-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    My Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium border border-primary text-primary text-center">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white text-center">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
