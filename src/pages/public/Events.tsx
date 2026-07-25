import { useState, useEffect } from 'react'
import { Calendar, MapPin, Video, Users } from 'lucide-react'
import type { Event } from '../../types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/helpers'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { notifyEventRegistrationWebhook } from '../../lib/eventRegistrations'

const eventTypeIcons: Record<string, string> = {
  cooking_class: '🍳',
  webinar: '💻',
  workshop: '🏕️',
  fitness_session: '🏃',
  nutrition_talk: '🎤',
}

export function Events() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const [registerEvent, setRegisterEvent] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'male',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*').order('start_date', { ascending: false }),
      supabase.from('event_registrations').select('event_id').in('status', ['registered', 'confirmed']),
    ]).then(([eventsResult, regsResult]) => {
      setEvents(eventsResult.data ?? [])
      const counts: Record<string, number> = {}
      for (const r of regsResult.data ?? []) {
        counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
      }
      setRegistrationCounts(counts)
    })
  }, [])

  const filtered = events.filter(e => filter === 'all' || e.status === filter)
  const upcoming = filtered.filter(e => e.status === 'upcoming' || e.status === 'ongoing')
  const past = filtered.filter(e => e.status === 'completed' || e.status === 'cancelled')
  const selectedEvent = events.find(e => e.id === registerEvent)

  useEffect(() => {
    if (!registerEvent) return

    setRegistrationForm({
      name: profile?.full_name || user?.user_metadata?.full_name || '',
      phone: profile?.phone || '',
      email: user?.email || '',
      age: '',
      gender: 'male',
    })
    setFormErrors({})
    setSubmitError('')
  }, [registerEvent, profile, user])

  function openRegistration(eventId: string) {
    setRegistered(false)
    setRegisterEvent(eventId)
  }

  function closeRegistration() {
    setRegisterEvent(null)
    setRegistered(false)
    setSubmitting(false)
    setSubmitError('')
    setFormErrors({})
  }

  async function handleRegister() {
    if (!selectedEvent) return

    const nextErrors: Record<string, string> = {}
    const trimmedName = registrationForm.name.trim()
    const trimmedPhone = registrationForm.phone.trim()
    const trimmedEmail = registrationForm.email.trim()
    const age = Number(registrationForm.age)

    if (!trimmedName) nextErrors.name = 'Name is required.'
    if (!trimmedPhone) nextErrors.phone = 'Phone number is required.'
    else if (!/^[0-9+\s()-]{7,}$/.test(trimmedPhone)) nextErrors.phone = 'Enter a valid phone number.'
    if (!trimmedEmail) nextErrors.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextErrors.email = 'Enter a valid email address.'
    if (!registrationForm.age) nextErrors.age = 'Age is required.'
    else if (!Number.isInteger(age) || age < 1 || age > 120) nextErrors.age = 'Enter a valid age.'
    if (!['male', 'female', 'other'].includes(registrationForm.gender)) nextErrors.gender = 'Please select a gender.'

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    setSubmitError('')
    setSubmitting(true)

    const { error } = await supabase.from('event_registrations').insert({
      event_id: selectedEvent.id,
      user_id: user?.id ?? null,
      contact_name: trimmedName,
      contact_phone: trimmedPhone,
      contact_email: trimmedEmail,
      attendee_age: age,
      attendee_gender: registrationForm.gender,
      status: 'registered',
    })

    setSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setSubmitError('You have already registered for this event.')
        return
      }
      setSubmitError(error.message || 'Registration failed. Please try again.')
      return
    }

    setRegistered(true)
    setRegistrationCounts(prev => ({
      ...prev,
      [selectedEvent.id]: (prev[selectedEvent.id] ?? 0) + 1,
    }))
    const newCount = (registrationCounts[selectedEvent.id] ?? 0) + 1
    const availableSpots = Math.max(0, selectedEvent.max_attendees - newCount)
    notifyEventRegistrationWebhook({
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventDate: selectedEvent.start_date,
      contactName: trimmedName,
      contactPhone: trimmedPhone,
      contactEmail: trimmedEmail,
      attendeeAge: age,
      attendeeGender: registrationForm.gender,
      availableSpots,
    }).catch(() => {})
    setTimeout(() => {
      closeRegistration()
    }, 2500)
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-light-olive/30 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Community</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary mb-4">Events & Workshops</h1>
          <p className="text-gray-500 text-lg">Join our live cooking classes, webinars, fitness sessions, and wellness retreats.</p>
        </div>
      </section>

      {/* Filter */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3">
          {(['all', 'upcoming', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer capitalize ${
                filter === f ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl font-bold text-primary mb-8">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(event => (
                <div key={event.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    {event.image_url
                      ? <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
                      : <div className="w-full h-48 bg-light-olive/40 flex items-center justify-center text-4xl">{eventTypeIcons[event.event_type] ?? '📅'}</div>
                    }
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="absolute top-3 right-3 text-2xl">
                      {eventTypeIcons[event.event_type] ?? '📅'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-base mb-3 leading-snug">{event.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={13} className="text-gold flex-shrink-0" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      {event.is_virtual ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Video size={13} className="text-gold flex-shrink-0" />
                          <span>Virtual Event</span>
                        </div>
                      ) : event.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={13} className="text-gold flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users size={13} className="text-gold flex-shrink-0" />
                        {(() => {
                          const taken = registrationCounts[event.id] ?? 0
                          const available = Math.max(0, event.max_attendees - taken)
                          return (
                            <span className={available === 0 ? 'text-red-500 font-medium' : ''}>
                              {available === 0 ? 'Fully booked' : `${available} spots available`}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    {(() => {
                      const taken = registrationCounts[event.id] ?? 0
                      const available = Math.max(0, event.max_attendees - taken)
                      return (
                        <Button size="sm" fullWidth onClick={() => openRegistration(event.id)} disabled={available === 0}>
                          {available === 0 ? 'Fully Booked' : 'Register Now'}
                        </Button>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary mb-8">Past Events</h2>
            <div className="space-y-4">
              {past.map(event => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-5 items-center opacity-75">
                  {event.image_url
                    ? <img src={event.image_url} alt={event.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 grayscale" />
                    : <div className="w-20 h-20 rounded-xl bg-light-olive/40 flex items-center justify-center text-2xl flex-shrink-0">{eventTypeIcons[event.event_type] ?? '📅'}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.start_date)}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                    </div>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">No events found.</div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={!!registerEvent}
        onClose={closeRegistration}
        title="Event Registration"
        size="md"
      >
        {selectedEvent && !registered && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{selectedEvent.title}</h3>
            <p className="text-gray-400 text-sm mb-5">{formatDate(selectedEvent.start_date)}</p>
            <div className="space-y-4 mb-6">
              <Input
                label="Full Name"
                value={registrationForm.name}
                onChange={e => setRegistrationForm(f => ({ ...f, name: e.target.value }))}
                error={formErrors.name}
              />
              <Input
                label="Phone Number"
                value={registrationForm.phone}
                onChange={e => setRegistrationForm(f => ({ ...f, phone: e.target.value }))}
                error={formErrors.phone}
              />
              <Input
                label="Email Address"
                type="email"
                value={registrationForm.email}
                onChange={e => setRegistrationForm(f => ({ ...f, email: e.target.value }))}
                error={formErrors.email}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  min="1"
                  max="120"
                  value={registrationForm.age}
                  onChange={e => setRegistrationForm(f => ({ ...f, age: e.target.value }))}
                  error={formErrors.age}
                />
                <Select
                  label="Gender"
                  value={registrationForm.gender}
                  onChange={e => setRegistrationForm(f => ({ ...f, gender: e.target.value }))}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  error={formErrors.gender}
                />
              </div>
            </div>
            {submitError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <Button fullWidth onClick={handleRegister} loading={submitting}>Confirm Registration</Button>
          </div>
        )}
        {registered && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-semibold text-primary text-lg mb-2">You're Registered!</h3>
            <p className="text-gray-500 text-sm">Your registration details were submitted successfully.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
