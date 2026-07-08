import { useEffect, useState } from 'react'
import { Leaf, Users, BookOpen, Headphones } from 'lucide-react'
import type { Provider } from '../../types'
import { supabase, supabaseConfigured } from '../../lib/supabase'

const whyNutriGo = [
  'Fresh meals organized around your goals and routine',
  'Accurate calorie-counted meals for better results',
  'Professional nutrition advice and support',
  'Fresh, convenient meal delivery to your doorstep',
  'Healthy meals for your team with bulk corporate orders available',
  'Proud winner of the Business Spark Competition, turning an award-winning idea into healthier lives across Sri Lanka',
]

const whyUs = [
  {
    icon: '🍱',
    title: 'Calorie-Counted Meals',
    desc: 'Every meal is carefully portioned with nutritional information to support informed eating.',
  },
  {
    icon: '🚚',
    title: 'Customized Service and Delivery',
    desc: 'Flexible support and delivery options are available to better match your routine and needs.',
  },
  {
    icon: '🧑‍⚕️',
    title: 'Expert Guidance',
    desc: 'Access professional nutrition advice to help you make healthier lifestyle choices.',
  },
  {
    icon: '⏱️',
    title: 'Convenient Healthy Eating',
    desc: 'Nutritious meals are delivered to your doorstep, saving time without compromising health.',
  },
  {
    icon: '🔬',
    title: 'Science-Based Approach',
    desc: 'Our recommendations are based on nutritional principles and evidence-based practices.',
  },
  {
    icon: '🎯',
    title: 'Support for Diverse Goals',
    desc: 'Whether your goal is weight management, muscle gain, or maintaining a healthy lifestyle, we support your journey.',
  },
]

export function About() {
  const [teamMembers, setTeamMembers] = useState<Provider[]>([])
  const [stats, setStats] = useState([
    { value: '0', label: 'Active Providers', icon: Users },
    { value: '0', label: 'Meals', icon: Leaf },
    { value: '0', label: 'Published Articles', icon: BookOpen },
    { value: '0', label: 'Podcast Episodes', icon: Headphones },
  ])

  useEffect(() => {
    if (!supabaseConfigured) return

    Promise.all([
      supabase.from('providers').select('*').eq('is_active', true).order('name'),
      supabase.from('meals').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('podcasts').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ]).then(([providersResult, mealsResult, articlesResult, podcastsResult]) => {
      const providers = providersResult.data ?? []
      setTeamMembers(providers.slice(0, 4))
      setStats([
        { value: String(providers.length), label: 'Active Providers', icon: Users },
        { value: String(mealsResult.count ?? 0), label: 'Meals', icon: Leaf },
        { value: String(articlesResult.count ?? 0), label: 'Published Articles', icon: BookOpen },
        { value: String(podcastsResult.count ?? 0), label: 'Podcast Episodes', icon: Headphones },
      ])
    })
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1600" alt="" className="w-full h-full object-cover opacity-10" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-4">Our Story</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6">
            About NutriGo Ceylon
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Healthy meal delivery and nutrition advisory built to make healthy eating easy, accessible, and effective for everyone.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">About Us</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mb-6">
                About Us and Our Story
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                NutriGo Ceylon is a healthy meal delivery and nutrition advisory service built on a simple idea: healthy eating should be easy, accessible, and effective for everyone.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                Proudly recognized as a Business Spark Winning Business Idea, NutriGo was developed through a university innovation initiative with the vision of transforming the way Sri Lankans approach nutrition and wellness.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                This service helps individuals achieve their health goals through personalized, calorie-counted meals and professional nutrition guidance.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Whether you're looking to lose weight, build muscle, manage a health condition, or simply enjoy a healthier lifestyle, our team is committed to delivering nutritious, delicious meals tailored to your needs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="bg-light-olive/50 rounded-2xl p-6 text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <p className="font-serif text-3xl font-bold text-primary">{value}</p>
                  <p className="text-gray-500 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why NutriGo */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Why NutriGo</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">Built Around Better Health</h2>
          </div>
          <div className="bg-surface rounded-3xl border border-gray-100 p-8 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyNutriGo.map(item => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 border border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-light-olive/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Mission</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary mb-6">
            Our Mission
          </h2>
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-8 py-10">
            <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed">
              To revolutionize healthy living by integrating nutritious meal delivery with personalized nutrition consultation for every lifestyle.
            </p>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-light-olive/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Why Us</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary">Why Choose NutriGo Ceylon</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex gap-5">
                <div className="text-3xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-primary text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Professional Support</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">Meet Our Published Session Providers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors">
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-full h-52 object-cover" />
                ) : (
                  <div className="w-full h-52 bg-white/5 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-bold">
                      {member.name[0]}
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="text-gold text-xs font-medium mb-3">{member.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{member.bio || 'Profile details available on the sessions page.'}</p>
                </div>
              </div>
            ))}
          </div>
          {teamMembers.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              No providers have been published yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
