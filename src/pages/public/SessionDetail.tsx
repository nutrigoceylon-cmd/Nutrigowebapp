import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Globe, Award, Calendar, CheckCircle, Banknote } from 'lucide-react'
import type { Provider } from '../../types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../lib/helpers'
import { notifySessionBookingWebhook } from '../../lib/sessionBookings'
import { getProviderSpecialtyLabel } from '../../lib/providers'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SESSION_TYPES = ['Initial Consultation', 'Follow-up Session', 'Nutrition Assessment', 'Meal Plan Review', 'Fitness Assessment']

function generateSlots(from: string, to: string, duration: number): string[] {
  const slots: string[] = []
  let [h, m] = from.split(':').map(Number)
  const [endH, endM] = to.split(':').map(Number)
  const endTotal = endH * 60 + endM
  while (true) {
    const total = h * 60 + m
    if (total + duration > endTotal) break
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += duration
    h += Math.floor(m / 60)
    m = m % 60
  }
  return slots
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr)
  return d.getDay() === 0 ? 7 : d.getDay()
}

function getNext30Days(): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 0; i <= 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [provider, setProvider] = useState<Provider | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0])
  const [notes, setNotes] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const [bookedDates, setBookedDates] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('providers').select('*').eq('id', id).eq('is_active', true).single()
      .then(({ data }) => setProvider(data))
  }, [id])

  useEffect(() => {
    if (!provider) return
    supabase.from('session_bookings')
      .select('booking_date, start_time')
      .eq('provider_id', provider.id)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => setBookedDates((data ?? []).map(b => `${b.booking_date}|${b.start_time}`)))
  }, [provider])

  useEffect(() => {
    setContactName(prev => prev || profile?.full_name || user?.user_metadata?.full_name || '')
    setContactPhone(prev => prev || profile?.phone || '')
    setContactEmail(prev => prev || user?.email || '')
  }, [profile, user])

  if (!provider) return null

  const minBookableTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const availableDates = getNext30Days().filter(d => provider.available_days.includes(getDayOfWeek(d)))
  const slots = selectedDate
    ? (provider.time_slots ?? []).flatMap(slot =>
        generateSlots(slot.from, slot.to, 30)
          .filter(t => {
            if (bookedDates.includes(`${selectedDate}|${t}`)) return false
            const [h, m] = t.split(':').map(Number)
            const slotDate = new Date(`${selectedDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
            return slotDate >= minBookableTime
          })
      )
    : []

  async function handleBook() {
    if (!user) { navigate('/login?redirect=/sessions/' + id); return }
    if (!selectedDate || !selectedTime) return
    if (!provider) return
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setFormError('Name, phone number, and email are required for session booking.')
      return
    }

    setFormError('')
    setLoading(true)
    const currentProvider = provider
    const { data, error } = await supabase.from('session_bookings').insert({
      provider_id: currentProvider.id,
      user_id: user.id,
      booking_date: selectedDate,
      start_time: selectedTime,
      session_type: sessionType,
      notes,
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
    }).select('id').single()

    setLoading(false)
    if (!error && data) {
      setBooked(true)
      notifySessionBookingWebhook({
        bookingId: data.id,
        providerId: currentProvider.id,
        providerName: currentProvider.name,
        providerSpecialty: getProviderSpecialtyLabel(currentProvider.specialty),
        sessionType,
        bookingDate: selectedDate,
        startTime: selectedTime,
        notes: notes.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
      }).catch(webhookError => {
        console.error('Session booking webhook failed:', webhookError)
      })
    }
  }

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-olive/20 px-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl border border-sage/20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-2">Your session with <strong>{provider.name}</strong> has been requested.</p>
          <p className="text-gray-400 text-sm mb-6">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' at '}{selectedTime}
          </p>
          <p className="text-xs text-gray-400 bg-light-olive/40 rounded-xl p-3 mb-6">
            You will receive a confirmation once the provider approves your booking. Check your dashboard for updates.
          </p>
          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1 text-center bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors">My Bookings</Link>
            <Link to="/sessions" className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-colors">Browse More</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/sessions" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Providers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Provider card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
            <div className="h-48 bg-light-olive/30 flex items-center justify-center">
              {provider.image_url
                ? <img src={provider.image_url} alt={provider.name} className="w-full h-full object-cover" />
                : <div className="w-24 h-24 rounded-full bg-primary text-white text-4xl font-bold flex items-center justify-center">{provider.name[0]}</div>
              }
            </div>
            <div className="p-6">
              <h2 className="font-serif text-xl font-bold text-primary mb-0.5">{provider.name}</h2>
              <p className="text-gold text-sm font-medium mb-1">{provider.title}</p>
              <p className="text-xs text-gray-500 mb-4">{getProviderSpecialtyLabel(provider.specialty)}</p>

              {provider.bio && <p className="text-gray-500 text-sm leading-relaxed mb-5">{provider.bio}</p>}

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Banknote size={15} className="text-gold" />
                  <span><strong>{formatCurrency(provider.session_price)}</strong> / {provider.session_duration} min</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <Clock size={15} className="text-gold mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    {(provider.time_slots ?? []).map((slot, i) => (
                      <span key={i} className="text-sm">
                        {slot.label && <span className="text-gray-400 text-xs mr-1">{slot.label}:</span>}
                        {slot.from} – {slot.to}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={15} className="text-gold" />
                  <span>{provider.available_days.map(d => DAY_NAMES[d].slice(0, 3)).join(', ')}</span>
                </div>
                {provider.languages.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe size={15} className="text-gold" />
                    <span>{provider.languages.join(', ')}</span>
                  </div>
                )}
              </div>

              {provider.qualifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1"><Award size={12} /> Qualifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.qualifications.map(q => (
                      <span key={q} className="px-2 py-1 bg-light-olive text-olive text-xs rounded-full">{q}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-serif text-xl font-bold text-primary mb-6">Book Your Session</h3>

            {/* Step 1: Date */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 block mb-2">Select Date</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {availableDates.map(date => {
                  const d = new Date(date)
                  return (
                    <button key={date} type="button" onClick={() => { setSelectedDate(date); setSelectedTime('') }}
                      className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        selectedDate === date ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="font-bold">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-[11px] mt-0.5 opacity-80">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Time — only after date picked */}
            {selectedDate && (
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 block mb-2">Select Time</label>
                {slots.length === 0
                  ? <p className="text-sm text-gray-400">No available slots for this date.</p>
                  : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {slots.map(slot => (
                        <button key={slot} type="button" onClick={() => setSelectedTime(slot)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            selectedTime === slot ? 'bg-gold text-white border-gold' : 'border-gray-200 text-gray-700 hover:border-gold hover:text-gold'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* Step 3: Details — only after date + time picked */}
            {selectedDate && selectedTime && (
              <>
                {!user && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
                    You need to <Link to="/login" className="font-semibold underline">sign in</Link> or{' '}
                    <Link to="/signup" className="font-semibold underline">create an account</Link> to book a session.
                  </div>
                )}

                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Session Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SESSION_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setSessionType(t)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border text-left transition-all cursor-pointer ${
                          sessionType === t ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Name</label>
                    <input
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
                    <input
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Reason / Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Briefly describe your health concern or what you hope to achieve..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold resize-none"
                  />
                </div>

                {formError && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="bg-light-olive/40 border border-sage/30 rounded-xl p-4 mb-5 text-sm space-y-1">
                  <p className="font-semibold text-gray-800 mb-2">Booking Summary</p>
                  <p className="text-gray-600"><span className="text-gray-400">Provider:</span> {provider.name}</p>
                  <p className="text-gray-600"><span className="text-gray-400">Date:</span> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-gray-600"><span className="text-gray-400">Time:</span> {selectedTime}</p>
                  <p className="text-gray-600"><span className="text-gray-400">Type:</span> {sessionType}</p>
                  <p className="font-semibold text-primary mt-2">{formatCurrency(provider.session_price)}</p>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleBook}
                  loading={loading}
                  disabled={!user || !contactName.trim() || !contactPhone.trim() || !contactEmail.trim()}
                >
                  {!user ? 'Sign In to Book' : 'Confirm Booking'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
