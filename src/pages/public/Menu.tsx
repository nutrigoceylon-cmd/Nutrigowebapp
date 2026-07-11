import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, MessageCircle, Clock, Filter, Tag, ShoppingCart, Minus, Plus } from 'lucide-react'
import type { Meal } from '../../types'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { formatCurrency } from '../../lib/helpers'
import { buildWhatsAppUrl } from '../../lib/site'
import { addMealToCart, getCartCount, getCartTotal, readCart } from '../../lib/cart'
import {
  DELIVERY_SETTINGS,
  cacheSuccessfulDeliveryValidation,
  hasConfiguredDeliveryZones,
  readCachedDeliveryValidation,
  validateDeliveryLocation,
} from '../../lib/delivery'
import {
  deriveMealCategory,
  formatMealCalories,
  getMealCategoryLabel,
  getMealPrice,
  hasMealDiscount,
  mealCategories,
} from '../../lib/meals'
import { DeliveryAvailabilityModal } from '../../components/delivery/DeliveryAvailabilityModal'
import { LocationPermissionModal } from '../../components/delivery/LocationPermissionModal'

type PermissionState = 'requesting' | 'denied' | 'error'

type AvailabilityState = {
  title: string
  message: string
  distanceKm?: number | null
} | null

const LOCATION_ACCESS_REQUIRED = 'Location access is required to check delivery availability.'

export function Menu() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedCategory, setSelectedCategory] = useState<(typeof mealCategories)[number]['value']>('all')
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartNotice, setCartNotice] = useState<string | null>(null)
  const [deliveryValidated, setDeliveryValidated] = useState(false)
  const [checkingDelivery, setCheckingDelivery] = useState(true)
  const [permissionOpen, setPermissionOpen] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionState>('requesting')
  const [permissionMessage, setPermissionMessage] = useState<string>()
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(null)

  function refreshCartSummary() {
    const items = readCart()
    setCartCount(getCartCount(items))
    setCartTotal(getCartTotal(items))
  }

  useEffect(() => {
    const cachedValidation = readCachedDeliveryValidation()
    if (cachedValidation) {
      setDeliveryValidated(true)
      setCheckingDelivery(false)
      return
    }

    if (!hasConfiguredDeliveryZones()) {
      setCheckingDelivery(false)
      setAvailabilityState({
        title: 'Delivery Validation Unavailable',
        message: 'We cannot verify delivery coverage right now. Please update the delivery zone settings and try again.',
      })
      return
    }

    requestUserLocation()
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!deliveryValidated) {
      setMeals([])
      setLoading(false)
      return () => { cancelled = true }
    }

    if (!supabaseConfigured) {
      setLoading(false)
      return () => { cancelled = true }
    }

    async function loadMeals() {
      setLoading(true)
      const { data } = await supabase.from('meals').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (cancelled) return
      setMeals(data ?? [])
      setLoading(false)
    }

    loadMeals().catch(() => {
      if (cancelled) return
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [deliveryValidated])

  useEffect(() => {
    refreshCartSummary()
  }, [])

  const filteredMeals = meals.filter(meal =>
    selectedCategory === 'all' || deriveMealCategory(meal) === selectedCategory
  )

  useEffect(() => {
    if (!selectedMeal) {
      setSelectedQuantity(1)
      return
    }

    setSelectedQuantity(1)
  }, [selectedMeal])

  function getMealCartQuantity(mealId: string): number {
    const item = readCart().find(entry => entry.meal.id === mealId)
    return item?.quantity ?? 0
  }

  function resetPermissionState(nextState: PermissionState, message?: string) {
    setPermissionState(nextState)
    setPermissionMessage(message)
  }

  function requestUserLocation() {
    resetPermissionState('requesting')
    setCheckingDelivery(true)
    setPermissionOpen(true)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setCheckingDelivery(false)
      resetPermissionState(
        'error',
        'Your browser does not support location access. Please use a supported device or browser and try again.'
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const result = validateDeliveryLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })

        if (import.meta.env.DEV) {
          console.debug('Menu delivery validation result', result)
        }

        if (result.isDeliverable && result.matchedZone) {
          cacheSuccessfulDeliveryValidation(result.matchedZone.id)
          setDeliveryValidated(true)
          setCheckingDelivery(false)
          setPermissionOpen(false)
          return
        }

        setCheckingDelivery(false)
        setPermissionOpen(false)
        setAvailabilityState({
          title: 'Delivery Not Available Yet',
          message: "Sorry, we don't currently deliver to your area. We're expanding soon and hope to serve you in the future.",
          distanceKm: result.distanceKm,
        })
      },
      error => {
        setCheckingDelivery(false)

        if (error.code === error.PERMISSION_DENIED) {
          resetPermissionState('denied', LOCATION_ACCESS_REQUIRED)
          return
        }

        resetPermissionState(
          'error',
          'We could not retrieve your current location. Please check your connection and location settings, then try again.'
        )
      },
      DELIVERY_SETTINGS.geolocationOptions
    )
  }

  function handleAddToCart(meal: Meal, quantity = 1) {
    addMealToCart(meal, quantity)
    refreshCartSummary()
    setCartNotice(`${meal.name} added to cart`)
    window.setTimeout(() => setCartNotice(current => current === `${meal.name} added to cart` ? null : current), 2200)
  }

  function handlePermissionCancel() {
    setPermissionOpen(false)
    navigate('/')
  }

  function handleUnavailableConfirm() {
    setAvailabilityState(null)
    navigate('/')
  }

  return (
    <div>
      <section className="bg-light-olive/30 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Fresh & Healthy</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary mb-4">
            Our Meals
          </h1>
          <p className="text-gray-500 text-lg">
            Browse fresh meals, calorie ranges, and current offers before placing your order.
          </p>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={15} className="text-gray-400 mr-1" />
            {mealCategories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                  selectedCategory === category.value
                    ? 'bg-light-green text-accent border-accent/30'
                    : 'border-gray-200 text-gray-600 hover:border-accent/30 hover:text-accent'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {(cartCount > 0 || cartNotice) && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-light-green bg-light-green/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {cartCount > 0 ? `${cartCount} item${cartCount === 1 ? '' : 's'} in cart` : 'Cart updated'}
                </p>
                <p className="text-xs text-gray-500">
                  {cartNotice ?? (cartTotal > 0 ? `Current total: ${formatCurrency(cartTotal)}` : 'Ready to order on WhatsApp')}
                </p>
              </div>
              {cartCount > 0 && (
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary"
                >
                  <ShoppingCart size={16} />
                  View Cart
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {checkingDelivery ? (
            <div className="rounded-[2rem] border border-gold/15 bg-gradient-to-br from-white via-light-olive/40 to-light-green/60 px-6 py-14 shadow-sm">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-gold" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Checking Delivery Area</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-primary">Verifying your location</h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  We&apos;re confirming whether delivery is available in your area before showing the menu.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="rounded-[2rem] border border-gold/15 bg-gradient-to-br from-white via-light-olive/40 to-light-green/60 px-6 py-14 shadow-sm">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-gold" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Loading Meals</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-primary">Preparing today&apos;s meals</h2>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  We&apos;re fetching the latest meals, calorie ranges, and live pricing.
                </p>
              </div>
            </div>
          ) : filteredMeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMeals.map(meal => {
                const categoryLabel = getMealCategoryLabel(deriveMealCategory(meal))
                const displayPrice = getMealPrice(meal)
                const discounted = hasMealDiscount(meal)

                return (
                  <div
                    key={meal.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    onClick={() => setSelectedMeal(meal)}
                  >
                    <div className="relative">
                      {meal.image_url
                        ? <img src={meal.image_url} alt={meal.name} className="w-full h-44 object-cover" />
                        : <div className="w-full h-44 bg-light-olive/40 flex items-center justify-center text-4xl">🥗</div>
                      }
                      {discounted && (
                        <div className="absolute top-3 right-3 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                          Discount
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <span className="text-xs font-medium text-accent bg-light-green px-2 py-0.5 rounded-full">
                          {categoryLabel}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                          <Clock size={11} /> {meal.prep_time} min
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{meal.name}</h4>
                      {meal.description && (
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{meal.description}</p>
                      )}

                      <div className="flex items-end justify-between gap-3 mb-3">
                        <div>
                          {displayPrice != null ? (
                            <>
                              <p className="font-bold text-primary text-lg">{formatCurrency(displayPrice)}</p>
                              {discounted && meal.price != null && (
                                <p className="text-xs text-gray-400 line-through">{formatCurrency(meal.price)}</p>
                              )}
                            </>
                          ) : (
                            <p className="font-medium text-gray-400">Price on request</p>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-500">{formatMealCalories(meal)}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center text-xs">
                        <div className="bg-light-olive/50 rounded-lg p-1.5">
                          <p className="font-bold text-primary">{meal.protein}g</p>
                          <p className="text-gray-400">Protein</p>
                        </div>
                        <div className="bg-light-olive/50 rounded-lg p-1.5">
                          <p className="font-bold text-primary">{meal.carbs}g</p>
                          <p className="text-gray-400">Carbs</p>
                        </div>
                        <div className="bg-light-olive/50 rounded-lg p-1.5">
                          <p className="font-bold text-primary">{meal.fat}g</p>
                          <p className="text-gray-400">Fat</p>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-xs font-medium text-primary/80">
                        Tap to view details
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🥗</p>
              <p className="text-lg">No meals available yet.</p>
              <p className="text-sm mt-1">Check back soon or contact us on WhatsApp.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Not Sure What to Order?</h2>
          <p className="text-white/60 mb-8">
            Message us on WhatsApp and our nutrition team will help you choose the right meals for your goals.
          </p>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20be5c] text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            <MessageCircle size={18} /> Chat on WhatsApp
          </a>
        </div>
      </section>

      {selectedMeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedMeal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {selectedMeal.image_url
                ? <img src={selectedMeal.image_url} alt={selectedMeal.name} className="w-full h-56 object-cover rounded-t-2xl" />
                : <div className="w-full h-56 bg-light-olive/40 rounded-t-2xl flex items-center justify-center text-5xl">🥗</div>
              }
              <button
                onClick={() => setSelectedMeal(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <X size={16} className="text-gray-600" />
              </button>
              <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                <span className="bg-light-green/95 text-accent text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                  {getMealCategoryLabel(deriveMealCategory(selectedMeal))}
                </span>
                {hasMealDiscount(selectedMeal) && (
                  <span className="bg-[#25D366]/95 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    Discount
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const inCart = getMealCartQuantity(selectedMeal.id)
                return inCart > 0 ? (
                  <div className="mb-4 rounded-xl border border-light-green bg-light-green/60 px-4 py-3 text-sm text-primary">
                    {inCart} item{inCart === 1 ? '' : 's'} already in cart
                  </div>
                ) : null
              })()}
              <h2 className="font-serif text-2xl font-bold text-primary mb-1">{selectedMeal.name}</h2>
              {selectedMeal.description && (
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{selectedMeal.description}</p>
              )}

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-light-green/50 border border-light-green px-4 py-3 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Current Price</p>
                  {getMealPrice(selectedMeal) != null ? (
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-primary text-2xl">{formatCurrency(getMealPrice(selectedMeal)!)}</p>
                      {hasMealDiscount(selectedMeal) && selectedMeal.price != null && (
                        <p className="text-sm text-gray-400 line-through">{formatCurrency(selectedMeal.price)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-500">Price on request</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Calories</p>
                  <p className="font-semibold text-gray-800">{formatMealCalories(selectedMeal)}</p>
                </div>
              </div>

              {selectedMeal.ingredients?.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Ingredients</h4>
                  <ul className="space-y-2 bg-light-olive/30 rounded-xl p-4">
                    {selectedMeal.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="text-gold font-bold mt-0.5 leading-none flex-shrink-0">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Calories', value: formatMealCalories(selectedMeal).replace(' kcal', '') },
                  { label: 'Protein', value: `${selectedMeal.protein}g` },
                  { label: 'Carbs', value: `${selectedMeal.carbs}g` },
                  { label: 'Fat', value: `${selectedMeal.fat}g` },
                ].map(stat => (
                  <div key={stat.label} className="bg-light-olive/50 rounded-xl p-2.5 text-center">
                    <p className="font-bold text-primary text-sm">{stat.value}</p>
                    <p className="text-gray-400 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
                <Clock size={12} /> Prep time: {selectedMeal.prep_time} min
              </p>

              <div className="border-t border-gray-100 pt-5">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add More Items</p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Quantity</p>
                      <p className="text-xs text-gray-400">Choose how many you want to add</p>
                    </div>
                    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity(current => Math.max(1, current - 1))}
                        className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="flex h-11 min-w-12 items-center justify-center border-x border-gray-200 px-4 text-sm font-semibold text-primary">
                        {selectedQuantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity(current => current + 1)}
                        className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedMeal, selectedQuantity)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <ShoppingCart size={16} /> Add {selectedQuantity} to Cart
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
                  <Tag size={14} className="mt-0.5 text-accent flex-shrink-0" />
                  Live meal prices and discounts are shown here whenever they have been set by the admin team.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <LocationPermissionModal
        isOpen={permissionOpen}
        state={permissionState}
        message={permissionMessage}
        onRetry={requestUserLocation}
        onCancel={handlePermissionCancel}
      />

      <DeliveryAvailabilityModal
        isOpen={Boolean(availabilityState)}
        title={availabilityState?.title ?? ''}
        message={availabilityState?.message ?? ''}
        debugDistanceKm={availabilityState?.distanceKm}
        onConfirm={handleUnavailableConfirm}
      />
    </div>
  )
}
