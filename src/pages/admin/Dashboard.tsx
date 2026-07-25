import { useEffect, useMemo, useState } from 'react'
import { Users, ShoppingBag, CreditCard, TrendingUp, ArrowUpRight, CalendarCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { NutriOrder, EventRegistration } from '../../types'
import { adminGetOrders } from '../../lib/orders'
import { formatCurrency, formatDate } from '../../lib/helpers'
import { Card } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { AdminLineChart } from '../../components/charts/NutritionChart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type EventRegWithEvent = EventRegistration & { events: { title: string; start_date: string } | null }

export function AdminDashboard() {
  const [profilesCount, setProfilesCount] = useState(0)
  const [activeSubscriptions, setActiveSubscriptions] = useState(0)
  const [orders, setOrders] = useState<NutriOrder[]>([])
  const [eventRegCount, setEventRegCount] = useState(0)
  const [recentEventRegs, setRecentEventRegs] = useState<EventRegWithEvent[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      adminGetOrders(),
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('status', 'registered'),
      supabase.from('event_registrations').select('*, events(title, start_date)').order('created_at', { ascending: false }).limit(5),
    ]).then(([profilesResult, subscriptionsResult, ordersResult, eventRegCountResult, recentEventRegsResult]) => {
      setProfilesCount(profilesResult.count ?? 0)
      setActiveSubscriptions(subscriptionsResult.count ?? 0)
      setOrders(ordersResult)
      setEventRegCount(eventRegCountResult.count ?? 0)
      setRecentEventRegs((recentEventRegsResult.data ?? []) as EventRegWithEvent[])
    })
  }, [])

  const now = new Date()
  const todayIso = now.toISOString().split('T')[0]
  const monthlyRevenue = orders
    .filter(order => order.checkout_payment_status === 'paid' && order.created_at.startsWith(todayIso.slice(0, 7)))
    .reduce((sum, order) => sum + order.total_amount, 0)
  const ordersToday = orders.filter(order => order.created_at.startsWith(todayIso)).length
  const recentOrders = orders.slice(0, 5)
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach(order => {
      const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' })
      map.set(month, (map.get(month) ?? 0) + order.total_amount)
    })
    return Array.from(map.entries()).map(([month, value]) => ({ month, value }))
  }, [orders])
  const ordersByStatus = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach(order => {
      const status = order.checkout_status
      map.set(status, (map.get(status) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }))
  }, [orders])
  const userGrowth = revenueByMonth.map(({ month }, index) => ({ month, value: Math.max(profilesCount - (revenueByMonth.length - 1 - index), 0) }))
  const kpis = [
    { label: 'Total Users', value: profilesCount.toLocaleString(), change: 'Live', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Subscriptions', value: activeSubscriptions.toLocaleString(), change: 'Live', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Orders", value: ordersToday.toLocaleString(), change: 'Live', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), change: 'Live', icon: TrendingUp, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Event Registrations', value: eventRegCount.toLocaleString(), change: 'Live', icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back — here's what's happening at NutriGo.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <ArrowUpRight size={13} className="text-green-500" />
                  <span className="text-xs font-medium text-green-600">{kpi.change} this month</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
          <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
          <AdminLineChart
            data={userGrowth}
            label="Users"
            color="#203417"
          />
        </Card>
          <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <AdminLineChart
            data={revenueByMonth}
            label="Revenue"
            color="#AC905E"
            prefix="LKR "
          />
        </Card>
      </div>

      {/* Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="count" fill="#203417" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{order.customer_name || 'Customer'}</p>
                  <p className="text-xs text-gray-400">{order.order_number} · {formatDate(order.preferred_delivery_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.checkout_status} />
                  <span className="font-semibold text-primary text-sm">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Event Registrations */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Recent Event Registrations</h3>
        {recentEventRegs.length === 0 ? (
          <p className="text-sm text-gray-400">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium pr-4">Name</th>
                  <th className="pb-2 font-medium pr-4">Email</th>
                  <th className="pb-2 font-medium pr-4">Phone</th>
                  <th className="pb-2 font-medium pr-4">Age</th>
                  <th className="pb-2 font-medium pr-4">Gender</th>
                  <th className="pb-2 font-medium pr-4">Event</th>
                  <th className="pb-2 font-medium pr-4">Event Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEventRegs.map(reg => (
                  <tr key={reg.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{reg.contact_name || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{reg.contact_email || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{reg.contact_phone || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{reg.attendee_age ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500 capitalize">{reg.attendee_gender ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-700 font-medium">{reg.events?.title ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{reg.events?.start_date ? formatDate(reg.events.start_date) : '—'}</td>
                    <td className="py-2.5"><StatusBadge status={reg.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
