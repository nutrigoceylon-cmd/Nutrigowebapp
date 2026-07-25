import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, ShieldCheck, ChevronRight, BookOpen, Headphones, CalendarDays, Calculator, Users, Clock, BadgeCheck, ChefHat, Truck, Phone, Flame, MapPin } from 'lucide-react'
import heroImg from '../../assets/heroimage.png'
import { OrderNowButton } from '../../components/delivery/OrderNowButton'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import type { Article, Event, Meal, Podcast, Provider } from '../../types'
import { formatCurrency, formatDateShort } from '../../lib/helpers'
import { deriveMealCategory, formatMealCalories, getMealCategoryLabel, getMealPrice, hasMealDiscount } from '../../lib/meals'
import { getProviderSpecialtyLabel, normalizeProviderSpecialty } from '../../lib/providers'
import { buildWhatsAppUrl } from '../../lib/site'

const steps = [
  { icon: '🎯', num: '1', title: 'Choose Your Goal', desc: 'Select your goal: Weight Loss, Muscle Gain or Healthy Lifestyle.' },
  { icon: '📋', num: '2', title: 'Select Your Meals', desc: 'Browse meals by category, calorie range, and current price.' },
  { icon: '🍳', num: '3', title: 'We Prepare & Deliver', desc: 'Our chefs prepare your meals fresh and deliver to your door.' },
  { icon: '📊', num: '4', title: 'Track & Achieve', desc: 'Track your progress with our tools and expert support.' },
]

const mealCategoryIcons: Record<string, string> = {
  mains: '🍽️',
  salads: '🥗',
  drinks: '🥤',
  sandwiches: '🥪',
  'oats-bowls': '🥣',
  soups: '🍲',
}

const activityMultipliers: Record<string, { label: string; value: number }> = {
  sedentary:        { label: 'Sedentary (little/no exercise)', value: 1.2 },
  lightly_active:   { label: 'Lightly active (1–3 days/wk)', value: 1.375 },
  moderately_active:{ label: 'Moderately active (3–5 days/wk)', value: 1.55 },
  very_active:      { label: 'Very active (6–7 days/wk)', value: 1.725 },
  extra_active:     { label: 'Extra active (athlete/physical job)', value: 1.9 },
}

const sessionHeroImage = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80'

function calcTDEE(age: number, gender: 'male' | 'female', heightCm: number, weightKg: number, activity: string): number {
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  return Math.round(bmr * (activityMultipliers[activity]?.value ?? 1.2))
}

export function Home() {
  const [featuredMeals, setFeaturedMeals] = useState<Meal[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [featuredPodcast, setFeaturedPodcast] = useState<Podcast | null>(null)
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [mealCount, setMealCount] = useState(0)
  const [minMealCalories, setMinMealCalories] = useState<number | null>(null)

  const [calc, setCalc] = useState({ age: '', gender: 'male' as 'male' | 'female', height: '', weight: '', activity: 'moderately_active' })
  const [tdee, setTdee] = useState<number | null>(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    Promise.all([
      supabase.from('meals').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(2),
      supabase.from('podcasts').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('events').select('*').in('status', ['upcoming', 'ongoing']).order('start_date').limit(1).maybeSingle(),
      supabase.from('providers').select('*').eq('is_active', true).order('name'),
    ]).then(([mealsResult, articlesResult, podcastResult, eventResult, providersResult]) => {
      const meals = mealsResult.data ?? []
      setFeaturedMeals(meals.slice(0, 3))
      setFeaturedArticles(articlesResult.data ?? [])
      setFeaturedPodcast(podcastResult.data ?? null)
      setFeaturedEvent(eventResult.data ?? null)
      setProviders(providersResult.data ?? [])
      setMealCount(meals.length)
      setMinMealCalories(meals.length > 0 ? Math.min(...meals.map(meal => meal.calories_min ?? meal.calories)) : null)
    })
  }, [])

  function handleCalc() {
    const age = Number(calc.age)
    const height = Number(calc.height)
    const weight = Number(calc.weight)
    if (!age || !height || !weight || age < 10 || age > 110) return
    setTdee(calcTDEE(age, calc.gender, height, weight, calc.activity))
  }

  const goalFromTdee = tdee
    ? tdee < 1800 ? 'weight_loss' : tdee > 2500 ? 'muscle_gain' : 'healthy_lifestyle'
    : null

  const featuredProviders = providers.slice(0, 4)
  const primaryProvider = featuredProviders[0] ?? null
  const providerCount = providers.length
  const specialtyCount = new Set(providers.map(provider => normalizeProviderSpecialty(provider.specialty))).size
  const providerMinPrice = providers.length > 0 ? Math.min(...providers.map(provider => provider.session_price)) : null
  const featuredArticle = featuredArticles[0] ?? null
  const moreArticles = featuredArticles.slice(1)

  return (
    <div className="bg-white">
      {/* ── HERO ── */}
      <section className="bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-light-green text-accent border border-accent/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Leaf size={13} />
                Sri Lanka's Trusted Healthy Meal Partner
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-5">
                Fresh Healthy Meals,<br />
                <span className="text-accent">
                  Made for Your Goals
                </span>
              </h1>
              <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                Chef-prepared, calorie-balanced meals delivered fresh across Sri Lanka. Choose your goal, pick your meals, and eat healthy without the stress.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <OrderNowButton
                  unstyled
                  className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-md text-sm"
                  icon={<ArrowRight size={18} />}
                  iconPosition="end"
                >
                  Order Today
                </OrderNowButton>
                <a
                  href={buildWhatsAppUrl('Hi NutriGo! I would like to place an order.')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fba57] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-md text-sm"
                >
                  WhatsApp <Phone size={16} />
                </a>
                <Link
                  to="/sessions"
                  className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-md text-sm"
                >
                  Book a Free Nutrition Call <Phone size={16} />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  { icon: <Leaf size={15} />, label: 'Scientifically\nBalanced' },
                  { icon: <ChefHat size={15} />, label: 'Chef\nPrepared' },
                  { icon: <Truck size={15} />, label: 'Delivered\nFresh' },
                  { icon: <ShieldCheck size={15} />, label: 'Nutritionist\nApproved' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center text-accent flex-shrink-0">
                      {b.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-600 leading-tight whitespace-pre-line">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — food image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={heroImg}
                  alt="Healthy meal bowl"
                  className="w-full h-[480px] object-cover"
                />
                {/* Plans from card — inside image bottom right */}
                <div className="absolute right-4 bottom-5 bg-white rounded-2xl shadow-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Flame size={17} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 leading-none mb-0.5">Meals from</p>
                      <p className="font-bold text-gray-900 text-xl leading-none">
                        {minMealCalories ?? '--'} <span className="text-xs font-normal text-gray-400">kcal</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live stat card */}
              <div className="absolute -left-6 top-8 bg-white rounded-2xl shadow-xl px-5 py-4 border border-gray-100 hidden lg:block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 leading-none">{mealCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Available Meals</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {providerCount} published expert{providerCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {/* ── 3 Action Cards ── */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
            {/* Order Meal */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Leaf size={26} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Quick Action</p>
                  <h3 className="font-bold text-xl text-gray-900 mb-1.5">Order Meal</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Choose fresh meals and start your delivery in just a few steps.</p>
                </div>
              </div>
              <OrderNowButton
                unstyled
                className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                icon={<ArrowRight size={16} />}
                iconPosition="end"
              >
                Order Meal
              </OrderNowButton>
            </div>

            {/* Book Session */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Users size={26} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Expert Support</p>
                  <h3 className="font-bold text-xl text-gray-900 mb-1.5">Book Health Advisory Session</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Speak with a qualified advisor for nutrition guidance tailored to your goals.</p>
                </div>
              </div>
              <Link
                to="/sessions"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Book Session <ArrowRight size={16} />
              </Link>
            </div>

            {/* Calorie Calculator */}
            <div className="rounded-2xl border border-accent/15 bg-light-green p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Calculator size={26} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#25D366] mb-1">Nutrition Tool</p>
                  <h3 className="font-bold text-xl text-gray-900 mb-1.5">Go to Calorie Calculator</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Find your daily calorie need before choosing your meals.</p>
                </div>
              </div>
              <a
                href="#calorie-calculator"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fba57] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-[#25D366]/20"
              >
                Calculate Calories <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              How <span className="text-accent">NutriGo</span> Works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                {/* Number circle */}
                <div className="w-12 h-12 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto mb-4 relative z-10">
                  {step.num}
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[3.5rem] left-[calc(50%+2.5rem)] right-0 border-t-2 border-dashed border-gray-200 z-0" />
                )}
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED MEALS ── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
                Browse <span className="text-accent">Featured Meals</span>
              </h2>
            </div>
            <Link to="/menu" className="hidden sm:flex items-center gap-1.5 text-accent font-medium hover:text-accent-dark transition-colors text-sm">
              View All Meals <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMeals.map(meal => {
              const category = deriveMealCategory(meal)
              const displayPrice = getMealPrice(meal)
              const discounted = hasMealDiscount(meal)
              return (
                <div key={meal.id} className="bg-white rounded-2xl overflow-hidden border border-accent/15 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="relative h-48 overflow-hidden">
                    {meal.image_url
                      ? <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-light-olive/50 flex items-center justify-center text-5xl">{mealCategoryIcons[category] ?? '🍽️'}</div>
                    }
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border border-gray-100">
                      <span>{mealCategoryIcons[category] ?? '🍽️'}</span>
                      <span className="text-accent">{getMealCategoryLabel(category)}</span>
                    </div>
                    {discounted && (
                      <div className="absolute top-3 right-3 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                        Discount
                      </div>
                    )}
                  </div>
                  <div className="p-5 bg-light-green/40">
                    <h3 className="font-semibold text-lg mb-2 text-primary">{meal.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{meal.description?.slice(0, 95) || 'Freshly prepared and ready to order.'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400">{formatMealCalories(meal)}</div>
                      <div className="text-right">
                        {displayPrice != null ? (
                          <>
                            <span className="font-bold text-gray-900 text-lg">{formatCurrency(displayPrice)}</span>
                            {discounted && meal.price != null && (
                              <p className="text-xs text-gray-400 line-through">{formatCurrency(meal.price)}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Price on request</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to="/menu"
                      className="block w-full text-center border border-gray-200 hover:border-primary text-gray-600 hover:text-primary py-2.5 rounded-xl text-sm font-medium transition-colors bg-white"
                    >
                      View Meal
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {featuredMeals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
              No meals have been published yet.
            </div>
          )}
        </div>
      </section>

      {/* ── SESSIONS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left — content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold border border-gold/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                <Users size={14} /> 1-on-1 Expert Sessions
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Personalized Guidance<br />
                <span className="text-accent">From Real Experts</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-7">
                Go beyond choosing meals. Book private sessions with certified dieticians, Ayurvedic consultants, clinical nutrition consultants, fitness instructors, and yoga instructors.
              </p>

              <div className="space-y-2 mb-8">
                {featuredProviders.length > 0 ? featuredProviders.map(provider => (
                  <Link
                    key={provider.id}
                    to={`/sessions/${provider.id}`}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl hover:bg-surface transition-colors group"
                  >
                    <span className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {provider.name[0]}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-accent transition-colors">{provider.name}</p>
                      <p className="text-gray-400 text-xs leading-relaxed mt-0.5">
                        {provider.title || getProviderSpecialtyLabel(provider.specialty)}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[11px] text-gray-400">{provider.session_duration} min</p>
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
                    No session providers have been published yet.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/sessions"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-md"
                >
                  Book a Session <ArrowRight size={17} />
                </Link>
                <Link
                  to="/sessions"
                  className="inline-flex items-center gap-2 border border-gray-200 hover:border-primary text-gray-600 hover:text-primary font-medium px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  View All Experts
                </Link>
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative">
              <img
                src={sessionHeroImage}
                alt="Nutrition consultation session"
                className="rounded-3xl shadow-xl w-full h-[440px] object-cover"
              />
              {providerCount > 0 && (
                <>
                  <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                    <p className="font-bold text-gray-900 text-sm">{providerCount} Expert{providerCount === 1 ? '' : 's'} Available</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {primaryProvider ? `Featured now: ${primaryProvider.name}` : 'Book directly from the live provider list'}
                    </p>
                  </div>
                  <div className="absolute top-6 right-6 bg-primary text-white rounded-2xl px-4 py-3 text-center shadow-lg">
                    <p className="text-2xl font-bold">{specialtyCount}</p>
                    <p className="text-xs text-white/70 mt-0.5">Care Categories</p>
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[85%] bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-3 flex justify-around hidden lg:flex">
                    {[
                      { icon: <Clock size={15} className="text-gold" />, value: providerMinPrice ? formatCurrency(providerMinPrice) : 'Live', label: 'Sessions From' },
                      { icon: <BadgeCheck size={15} className="text-accent" />, value: specialtyCount.toString(), label: 'Specialties' },
                      { icon: <Users size={15} className="text-primary" />, value: providerCount.toString(), label: 'Active Providers' },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">{stat.icon}<span className="font-bold text-gray-900 text-sm">{stat.value}</span></div>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CALORIE CALCULATOR TEASER ── */}
      <a
        href="#calorie-calculator"
        className="block bg-gradient-to-r from-primary/5 via-gold/5 to-primary/5 border-y border-gold/20 py-5 hover:from-primary/10 hover:to-primary/10 transition-colors group"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Calculator size={20} className="text-gold" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Not sure how many calories you need?</p>
                <p className="text-gray-500 text-xs mt-0.5">Try our free calorie calculator. Get your daily target in 30 seconds.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-3 transition-all flex-shrink-0 whitespace-nowrap">
              Calculate Now <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </a>

      {/* ── EDUCATIONAL HUB ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              The <span className="text-accent">NutriGo</span> Hub
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Articles */}
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Articles & Blogs</h3>
                  <p className="text-xs text-gray-400">Expert tips on nutrition, workouts, mindfulness and healthy living.</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden mb-5 bg-gray-100 h-32">
                {featuredArticle?.image_url ? (
                  <img src={featuredArticle.image_url} alt={featuredArticle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <BookOpen size={32} className="text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-3 mb-5">
                {featuredArticle ? (
                  <>
                    <p className="text-xs text-gray-400">
                      {featuredArticle.category}
                      {featuredArticle.published_at ? ` · ${formatDateShort(featuredArticle.published_at)}` : ''}
                    </p>
                    <Link to={`/articles/${featuredArticle.slug}`} className="block group">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {featuredArticle.title}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {featuredArticle.excerpt}
                      </p>
                    </Link>
                    {moreArticles.map(article => (
                      <Link key={article.id} to={`/articles/${article.slug}`} className="block group border-t border-gray-100 pt-3">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </p>
                      </Link>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No articles published yet.</p>
                )}
              </div>
              <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-accent font-medium hover:text-accent-dark">
                Read Articles <ChevronRight size={14} />
              </Link>
            </div>

            {/* Podcast */}
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Headphones size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Podcasts & Videos</h3>
                  <p className="text-xs text-gray-400">Listen to expert talks, success stories and nutrition insights.</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden mb-5 bg-gray-100 h-32">
                {featuredPodcast?.image_url ? (
                  <img src={featuredPodcast.image_url} alt={featuredPodcast.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-50">
                    <Headphones size={32} className="text-purple-600" />
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-5">
                {featuredPodcast ? (
                  <>
                    <p className="text-xs text-gray-400">
                      Episode {featuredPodcast.episode_number}
                      {featuredPodcast.published_at ? ` · ${formatDateShort(featuredPodcast.published_at)}` : ''}
                    </p>
                    <p className="text-sm font-medium text-gray-700 line-clamp-2">{featuredPodcast.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{featuredPodcast.description}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No podcast episode published yet.</p>
                )}
              </div>
              <Link to="/podcast" className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium hover:text-purple-700">
                Listen Now <ChevronRight size={14} />
              </Link>
            </div>

            {/* Events */}
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Events & Workshops</h3>
                  <p className="text-xs text-gray-400">Join workshops, cooking classes, fitness challenges and community events.</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden mb-5 h-32">
                {featuredEvent?.image_url ? (
                  <img src={featuredEvent.image_url} alt={featuredEvent.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                    <CalendarDays size={32} className="text-orange-500" />
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-5">
                {featuredEvent ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 line-clamp-2">{featuredEvent.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CalendarDays size={12} />
                      <span>{formatDateShort(featuredEvent.start_date)}</span>
                    </div>
                    {featuredEvent.location && !featuredEvent.is_virtual && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span className="truncate">{featuredEvent.location}</span>
                      </div>
                    )}
                    {featuredEvent.is_virtual && (
                      <p className="text-xs text-gray-400">Virtual event</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming event published yet.</p>
                )}
              </div>
              <Link to="/events" className="inline-flex items-center gap-1 text-sm text-orange-500 font-medium hover:text-orange-600">
                Explore Events <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALORIE CALCULATOR ── */}
      <section id="calorie-calculator" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold border border-gold/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Calculator size={14} /> Free Tool
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              Calorie <span className="text-accent">Calculator</span>
            </h2>
            <p className="text-gray-400 mt-3">Find your daily calorie needs and get a meal target recommendation.</p>
          </div>

          <div className="bg-surface rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              {/* Age */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Age</label>
                <input
                  type="number" min="10" max="110"
                  value={calc.age} onChange={e => setCalc(c => ({ ...c, age: e.target.value }))}
                  placeholder="e.g. 28"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} type="button" onClick={() => setCalc(c => ({ ...c, gender: g }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all cursor-pointer ${
                        calc.gender === g ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'
                      }`}
                    >{g}</button>
                  ))}
                </div>
              </div>
              {/* Height */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Height (cm)</label>
                <input
                  type="number" min="100" max="250"
                  value={calc.height} onChange={e => setCalc(c => ({ ...c, height: e.target.value }))}
                  placeholder="e.g. 170"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                />
              </div>
              {/* Weight */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Weight (kg)</label>
                <input
                  type="number" min="30" max="300"
                  value={calc.weight} onChange={e => setCalc(c => ({ ...c, weight: e.target.value }))}
                  placeholder="e.g. 70"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold"
                />
              </div>
            </div>
            {/* Activity */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Activity Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(activityMultipliers).map(([key, { label }]) => (
                  <button key={key} type="button" onClick={() => setCalc(c => ({ ...c, activity: key }))}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer ${
                      calc.activity === key ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <button onClick={handleCalc}
              className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              Calculate My Calorie Needs
            </button>

            {tdee && (
              <div className="mt-6 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center">
                <p className="text-gray-500 text-sm mb-1">Your estimated daily calorie need</p>
                <p className="font-serif text-5xl font-bold text-primary mb-1">{tdee.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mb-4">kcal / day</p>
                <div className="grid grid-cols-3 gap-3 text-center mb-5">
                  {[
                    { label: 'Weight Loss', cal: tdee - 500, color: 'text-accent' },
                    { label: 'Maintenance', cal: tdee, color: 'text-primary' },
                    { label: 'Muscle Gain', cal: tdee + 300, color: 'text-blue-600' },
                  ].map(g => (
                    <div key={g.label} className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className={`font-bold text-lg ${g.color}`}>{g.cal.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{g.label}</p>
                    </div>
                  ))}
                </div>
                {goalFromTdee && (
                  <OrderNowButton
                    unstyled
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                    icon={<ArrowRight size={16} />}
                    iconPosition="end"
                  >
                    See Recommended {goalFromTdee === 'weight_loss' ? 'Weight Loss' : goalFromTdee === 'muscle_gain' ? 'Muscle Gain' : 'Healthy Lifestyle'} Meals
                  </OrderNowButton>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
                Ready to start?<br />
                <span className="text-accent-light">Join NutriGo today!</span>
              </h2>
              <p className="text-white/60 mb-2">Take the first step towards a healthier, happier you.</p>
              <div className="flex items-center gap-2 mt-4">
                <ShieldCheck size={14} className="text-accent-light" />
                <span className="text-white/50 text-xs">Browse live meals and book from published provider listings.</span>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <OrderNowButton
                  unstyled
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-7 py-3.5 rounded-xl transition-colors w-full"
                  icon={<ArrowRight size={18} />}
                  iconPosition="end"
                >
                  Order Now
                </OrderNowButton>
                <Link
                  to="/sessions"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors w-full"
                >
                  Book a Session <ArrowRight size={18} />
                </Link>
              </div>
              <p className="text-white/50 text-xs">
                {mealCount} active meal{mealCount === 1 ? '' : 's'} and {providerCount} published expert{providerCount === 1 ? '' : 's'} available now.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
