import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, Home } from 'lucide-react'
import type { NutriOrder } from '../../types'
import { getOrderForTracking } from '../../lib/orders'
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../lib/helpers'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const [order, setOrder] = useState<NutriOrder | null>(
    (location.state as { order?: NutriOrder } | null)?.order ?? null
  )
  const [loading, setLoading] = useState(!order)

  useEffect(() => {
    if (order || !orderNumber) return
    // If the page reloads without navigation state, try the order lookup once.
    getOrderForTracking(orderNumber, '').then(({ order: o }) => {
      if (o) setOrder(o)
      else navigate('/track-order')
      setLoading(false)
    })
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-400 mb-4">Order not found.</p>
          <Link to="/menu" className="text-gold hover:underline">Browse meals</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Order Confirmed!</h1>
          <p className="text-gray-500">
            Thank you, <span className="font-semibold text-gray-700">{order.customer_name}</span>!
            Your order has been received and we'll start preparing it soon.
          </p>
        </div>

        {/* Order number banner */}
        <div className="bg-primary rounded-2xl p-5 text-center mb-6">
          <p className="text-white/60 text-sm mb-1">Your Order Number</p>
          <p className="font-mono text-3xl font-bold text-gold tracking-wider">{order.order_number}</p>
          <p className="text-white/60 text-xs mt-2">Keep this number to track your order</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Status</p>
              <StatusBadge status={order.checkout_status} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment Status</p>
              <StatusBadge status={order.checkout_payment_status} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment Method</p>
              <span className="text-sm font-medium text-gray-800">
                {getPaymentMethodLabel(order.payment_method)}
              </span>
            </div>
          </div>

          {order.payment_method === 'bank_transfer' && order.checkout_payment_status === 'pending' && (
            <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-700">
              Please complete your bank transfer to activate this order. Your order will be confirmed once payment is verified by our team.
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Package size={17} className="text-gold" />
            <h3 className="font-semibold text-gray-900">Your Order</h3>
          </div>
          <div className="bg-light-olive/50 rounded-xl p-3 mb-3">
            <p className="font-semibold text-primary">{order.meal_plan_name || 'Selected meals'}</p>
          </div>
          {(order.items ?? []).length > 0 && (
            <div className="space-y-2">
              {order.items!.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-800">{item.meal_name}</p>
                    <p className="text-gray-400 text-xs capitalize">{item.meal_category}</p>
                  </div>
                  <span className="text-gray-500">×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-primary">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={17} className="text-gold" />
            <h3 className="font-semibold text-gray-900">Delivery Details</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Deliver to</span>
              <span className="text-gray-800">{order.delivery_address_line}, {order.city}</span>
            </div>
            {order.nearest_landmark && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-28 flex-shrink-0">Landmark</span>
                <span className="text-gray-800">{order.nearest_landmark}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Date</span>
              <span className="text-gray-800">{formatDate(order.preferred_delivery_date)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Time slot</span>
              <span className="text-gray-800">{order.preferred_delivery_time}</span>
            </div>
            {order.special_instructions && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-28 flex-shrink-0">Instructions</span>
                <span className="text-gray-800">{order.special_instructions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact saved */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={17} className="text-gold" />
            <h3 className="font-semibold text-gray-900">Contact</h3>
          </div>
          <p className="text-sm text-gray-600">{order.customer_email}</p>
          <p className="text-sm text-gray-600">{order.customer_phone}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/track-order?order=${order.order_number}`}
            className="flex-1"
          >
            <Button fullWidth variant="secondary" className="flex items-center justify-center gap-2">
              Track My Order <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button fullWidth variant="outline" className="flex items-center justify-center gap-2">
              <Home size={16} /> Back to Home
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          A confirmation will be sent to <span className="font-medium">{order.customer_email}</span>
          {/* TODO: Integrate email notification service in phase 2 */}
        </p>
      </div>
    </div>
  )
}
