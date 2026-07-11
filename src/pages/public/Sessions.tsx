import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, DollarSign, Star, Globe, Award } from 'lucide-react'
import type { Provider } from '../../types'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/helpers'
import { getProviderSpecialtyLabel, normalizeProviderSpecialty, providerSpecialties, providerSpecialtyColors } from '../../lib/providers'

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Sessions() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('providers').select('*').eq('is_active', true).order('name')
      .then(({ data }) => setProviders(data ?? []))
  }, [])

  const specialties = ['all', ...providerSpecialties.map(item => item.value)]
  const filtered = filter === 'all' ? providers : providers.filter(p => normalizeProviderSpecialty(p.specialty) === filter)

  return (
    <div>
      {/* Header */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Expert Care</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">Book a Session</h1>
          <p className="text-white/60 text-lg">
            Connect with expert dieticians, Ayurvedic consultants, clinical nutrition consultants, fitness instructors, and yoga instructors.
            Book a one-on-one session and take control of your health.
          </p>
        </div>
      </section>

      {/* How to book */}
      <section className="bg-light-olive/30 border-b border-sage/20 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🔍', step: '1', label: 'Browse Experts' },
              { icon: '📅', step: '2', label: 'Pick a Time' },
              { icon: '✍️', step: '3', label: 'Sign Up & Confirm' },
              { icon: '💬', step: '4', label: 'Attend Session' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center gap-2">
                <div className="text-3xl">{s.icon}</div>
                <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{s.step}</div>
                <p className="text-sm font-medium text-gray-700">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 overflow-x-auto">
          {specialties.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all cursor-pointer capitalize ${
                filter === s ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {s === 'all' ? 'All' : getProviderSpecialtyLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Provider grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">No providers available yet. Check back soon.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(provider => (
            <div key={provider.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              {/* Photo / Avatar */}
              <div className="relative h-48 bg-light-olive/30">
                {provider.image_url
                  ? <img src={provider.image_url} alt={provider.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-primary text-white text-4xl font-bold flex items-center justify-center">
                        {provider.name[0]}
                      </div>
                    </div>
                }
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${providerSpecialtyColors[normalizeProviderSpecialty(provider.specialty)] ?? 'bg-gray-100 text-gray-700'}`}>
                    {getProviderSpecialtyLabel(provider.specialty)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-0.5">{provider.name}</h3>
                <p className="text-gold text-sm font-medium mb-3">{provider.title}</p>

                {provider.bio && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{provider.bio}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DollarSign size={13} className="text-gold flex-shrink-0" />
                    <span className="font-semibold text-gray-700">{formatCurrency(provider.session_price)}</span>
                    <span>/ {provider.session_duration} min session</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={13} className="text-gold flex-shrink-0" />
                    <span>
                      {provider.available_days.map(d => DAY_NAMES[d]).join(', ')}
                      {' · '}{provider.available_from}–{provider.available_to}
                    </span>
                  </div>
                  {provider.languages.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Globe size={13} className="text-gold flex-shrink-0" />
                      <span>{provider.languages.join(', ')}</span>
                    </div>
                  )}
                  {provider.qualifications.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Award size={13} className="text-gold flex-shrink-0" />
                      <span className="line-clamp-1">{provider.qualifications.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}
                  <span className="text-xs text-gray-400 ml-1">Verified Expert</span>
                </div>

                <Link
                  to={`/sessions/${provider.id}`}
                  className="block w-full text-center bg-primary hover:bg-secondary text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Book a Session
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
