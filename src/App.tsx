import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PublicLayout } from './components/layout/PublicLayout'
import { AdminLayout } from './components/layout/AdminLayout'

// Public pages
import { Home } from './pages/public/Home'
import { About } from './pages/public/About'
import { Menu } from './pages/public/Menu'
import { Cart } from './pages/public/Cart'
import { Checkout } from './pages/public/Checkout'
import { OrderConfirmation } from './pages/public/OrderConfirmation'
import { TrackOrder } from './pages/public/TrackOrder'
import { Articles } from './pages/public/Articles'
import { ArticleDetail } from './pages/public/ArticleDetail'
import { Podcast } from './pages/public/Podcast'
import { Events } from './pages/public/Events'
import { FAQ } from './pages/public/FAQ'
import { Login } from './pages/public/Login'
import { SignUp } from './pages/public/SignUp'
import { Dashboard } from './pages/public/Dashboard'
import { Contact } from './pages/public/Contact'
import { Sessions } from './pages/public/Sessions'
import { SessionDetail } from './pages/public/SessionDetail'

// Admin pages
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminUsers } from './pages/admin/Users'
import { AdminMeals } from './pages/admin/Meals'
import { AdminAddOns } from './pages/admin/AddOns'
import { AdminOrders } from './pages/admin/Orders'
import { AdminOrderDetail } from './pages/admin/OrderDetail'
import { AdminSubscriptions } from './pages/admin/Subscriptions'
import { AdminArticles } from './pages/admin/Articles'
import { AdminPodcasts } from './pages/admin/Podcasts'
import { AdminEvents } from './pages/admin/Events'
import { AdminFAQ } from './pages/admin/FAQ'
import { AdminMessages } from './pages/admin/Messages'
import { AdminProviders } from './pages/admin/Providers'
import { AdminSessionBookings } from './pages/admin/SessionBookings'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicPage({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicPage><Home /></PublicPage>} />
      <Route path="/about" element={<PublicPage><About /></PublicPage>} />
      <Route path="/menu" element={<PublicPage><Menu /></PublicPage>} />
      <Route path="/cart" element={<PublicPage><Cart /></PublicPage>} />
      {/* Order flow – no layout wrapper so these pages control their own chrome */}
      <Route path="/meal-selection/:planId" element={<Navigate to="/menu" replace />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation/:orderNumber" element={<PublicPage><OrderConfirmation /></PublicPage>} />
      <Route path="/track-order" element={<PublicPage><TrackOrder /></PublicPage>} />
      <Route path="/articles" element={<PublicPage><Articles /></PublicPage>} />
      <Route path="/articles/:slug" element={<PublicPage><ArticleDetail /></PublicPage>} />
      <Route path="/podcast" element={<PublicPage><Podcast /></PublicPage>} />
      <Route path="/events" element={<PublicPage><Events /></PublicPage>} />
      <Route path="/faq" element={<PublicPage><FAQ /></PublicPage>} />
      <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
      <Route path="/sessions" element={<PublicPage><Sessions /></PublicPage>} />
      <Route path="/sessions/:id" element={<PublicPage><SessionDetail /></PublicPage>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected user route */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <PublicPage><Dashboard /></PublicPage>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminUsers /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/meal-plans" element={
        <ProtectedRoute requireAdmin>
          <Navigate to="/admin/meals" replace />
        </ProtectedRoute>
      } />
      <Route path="/admin/meals" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminMeals /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/add-ons" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminAddOns /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminOrders /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/orders/:id" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminOrderDetail /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/subscriptions" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminSubscriptions /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/articles" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminArticles /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/podcasts" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminPodcasts /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/events" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminEvents /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/faq" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminFAQ /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/messages" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminMessages /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/providers" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminProviders /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/session-bookings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout><AdminSessionBookings /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
