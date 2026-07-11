import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Package, CheckCircle, Clock, Truck, ChefHat, AlertCircle, Home } from 'lucide-react'
import type { NutriOrder, NutriOrderStatus } from '../../types'
import { getOrderForTracking, getUserOrders } from '../../lib/orders'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, getPaymentMethodLabel, getNutriOrderStatusLabel } from '../../lib/helpers'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { OrderNowButton } from '../../components/delivery/OrderNowButton'

interface TrackingStep {
  key: NutriOrderStatus
  label: string
  icon: typeof Package
  description: string
}

const STEPS: TrackingStep[] = [
  { key: 'order_received',     label: 'Order Received',      icon: Package,    description: 'We have received your order' },
  { key: 'payment_confirmed',  label: 'Payment Confirmed',   icon: CheckCircle, description: 'Payment verified' },
  { key: 'preparing',          label: 'Preparing',            icon: ChefHat,    description: 'Our kitchen is preparing your meals' },
  { key: 'out_for_delivery',   label: 'Out for Delivery',     icon: Truck,      description: 'Your order is on the way' },
  { key: 'delivered',          label: 'Delivered',            icon: CheckCircle, description: 'Enjoy your meal!' },
]

// Returns index in STEPS array; -1 for cancelled
function getStepIndex(status: NutriOrderStatus): number {
  if (status === 'cancelled') return -1
  if (status === 'payment_pending') return 0 // stays at step 0, payment not confirmed yet
  return STEPS.findIndex(s => s.key === status)
}

export function TrackOrder() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') ?? '')
  const [contact, setContact] = useState('')
  const [order, setOrder] = useState<NutriOrder | null>(null)
  const [userOrders, setUserOrders] = useState<NutriOrder[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Auto-search if order number is pre-filled from confirmation redirect
  useEffect(() => {
    if (searchParams.get('order') && !order) {
      // Don't auto-search – user needs to provide contact for security
      // Just pre-fill the order number field
    }
  }, [])

  // Load user's orders if logged in
  useEffect(() => {
    if (!user) return
    getUserOrders(user.id).then(orders => setUserOrders(orders))
  }, [user])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim() || !contact.trim()) return

    setSearching(true)
    setError(null)
    setSearched(true)

    const { order: found, error: err } = await getOrderForTracking(
      orderNumber.trim().toUpperCase(),
      contact.trim()
    )

    setOrder(found)
    setError(err)
    setSearching(false)
  }

  const stepIndex = order ? getStepIndex(order.checkout_status) : -1
  const isCancelled = order?.checkout_status === 'cancelled'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-light-olive/30 py-14">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Order Tracking</p>
          <h1 className="font-serif text-4xl font-bold text-primary mb-3">Track Your Order</h1>
          <p className="text-gray-500">Enter your order number and phone or email to see the live status.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Order Number *</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. NUT-123456"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold font-mono"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phone or Email *</label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="Phone number or email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  required
                />
              </div>
            </div>
            <Button type="submit" loading={searching} className="flex items-center gap-2">
              <Search size={16} /> Track Order
            </Button>
          </form>
        </div>

        {/* Error state */}
        {searched && error && !order && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 mb-8">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 mb-1">Order Not Found</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Order tracking result */}
        {order && (
          <div className="space-y-5">
            {/* Order number + status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order</p>
                  <p className="font-mono text-2xl font-bold text-primary">{order.order_number}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.checkout_status} />
                  <p className="text-gray-500 text-sm mt-1">{getNutriOrderStatusLabel(order.checkout_status)}</p>
                </div>
              </div>

              {/* Progress timeline */}
              {!isCancelled ? (
                <div className="relative">
                  {/* Line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-gold transition-all duration-700"
                    style={{
                      width: stepIndex <= 0
                        ? '0%'
                        : `${(stepIndex / (STEPS.length - 1)) * 100}%`,
                    }}
                  />
                  <div className="relative flex justify-between">
                    {STEPS.map((step, idx) => {
                      const done = idx < stepIndex
                      const active = idx === stepIndex
                      const Icon = step.icon
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              done
                                ? 'bg-gold border-gold text-white'
                                : active
                                ? 'bg-white border-gold text-gold shadow-md shadow-gold/20'
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className={`text-xs font-medium ${done || active ? 'text-primary' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Mobile step label */}
                  <p className="sm:hidden text-center text-sm font-medium text-primary mt-4">
                    {stepIndex >= 0 ? STEPS[stepIndex].description : ''}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  This order has been cancelled. Please contact us if you have questions.
                </div>
              )}
            </div>

            {/* Payment status */}
            {order.checkout_status === 'payment_pending' && order.payment_method === 'bank_transfer' && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-sm text-sky-700">
                <p className="font-semibold mb-1">Awaiting Bank Transfer Confirmation</p>
                <p>Your order has been placed. Please complete the bank transfer and your order will be confirmed once payment is verified.</p>
              </div>
            )}

            {/* Order details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Selection</span>
                  <span className="font-medium text-gray-800">{order.meal_plan_name || 'Selected meals'}</span>
                </div>
                {(order.items ?? []).length > 0 && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-32 flex-shrink-0">Meals</span>
                    <div className="space-y-0.5">
                      {order.items!.map(item => (
                        <p key={item.id} className="text-gray-800">
                          {item.meal_name} <span className="text-gray-400">×{item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Payment</span>
                  <div>
                    <span className="text-gray-800">{getPaymentMethodLabel(order.payment_method)}</span>
                    <span className="ml-2"><StatusBadge status={order.checkout_payment_status} /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-gold" /> Delivery Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Address</span>
                  <span className="text-gray-800">{order.delivery_address_line}, {order.city}</span>
                </div>
                {order.nearest_landmark && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-32 flex-shrink-0">Landmark</span>
                    <span className="text-gray-800">{order.nearest_landmark}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Date</span>
                  <span className="text-gray-800">{formatDate(order.preferred_delivery_date)}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0">Time</span>
                  <span className="text-gray-800">{order.preferred_delivery_time}</span>
                </div>
              </div>
            </div>

            {/* Status history */}
            {(order.status_history ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Status History</h3>
                <div className="space-y-3">
                  {order.status_history!.map(entry => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{getNutriOrderStatusLabel(entry.status as NutriOrderStatus)}</p>
                        {entry.note && <p className="text-gray-400 text-xs">{entry.note}</p>}
                        <p className="text-gray-300 text-xs">{new Date(entry.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home size={16} /> Home
                </Button>
              </Link>
              <OrderNowButton
                unstyled
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-primary hover:bg-light-olive transition-all duration-200"
              >
                Order Again
              </OrderNowButton>
            </div>
          </div>
        )}

        {/* Logged-in user's order history */}
        {user && userOrders.length > 0 && !order && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Your Orders</h3>
            <div className="space-y-3">
              {userOrders.map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOrderNumber(o.order_number)
                    setContact('')
                    setOrder(o)
                    setSearched(true)
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gold/40 hover:bg-light-olive/30 transition-all text-left cursor-pointer"
                >
                  <div>
                    <p className="font-mono font-semibold text-primary text-sm">{o.order_number}</p>
                    <p className="text-gray-400 text-xs">{o.meal_plan_name || 'Selected meals'} · {formatDate(o.preferred_delivery_date)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.checkout_status} />
                    <p className="text-primary font-semibold text-sm mt-1">{formatCurrency(o.total_amount)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
