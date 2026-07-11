import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft, ShieldCheck, CreditCard, Banknote, User,
  MapPin, Lock,
} from 'lucide-react'
import type { Meal, MealPlan } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { createOrder } from '../../lib/orders'
import { formatCurrency } from '../../lib/helpers'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { clearCart, readCart, type CartItem } from '../../lib/cart'
import { formatMealCalories, getMealPrice } from '../../lib/meals'

interface CheckoutState {
  plan: MealPlan
  selectedMeals: { meal: { id: string; name: string; meal_type: string; category?: string; calories: number; calories_min?: number | null; calories_max?: number | null; price?: number | null; discount_price?: number | null }; quantity: number }[]
}

interface CheckoutForm {
  full_name: string
  phone: string
  email: string
  delivery_address: string
  city: string
  nearest_landmark: string
  preferred_delivery_date: string
  preferred_delivery_time: string
  special_instructions: string
  payment_method: 'cash_on_delivery' | 'bank_transfer'
  create_account: boolean
  password: string
  confirm_password: string
  terms: boolean
}

const TIME_SLOTS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
]

export function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signUp } = useAuth()

  const state = location.state as CheckoutState | null
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      payment_method: 'cash_on_delivery',
      create_account: false,
    },
  })

  const createAccount = watch('create_account')
  const paymentMethod = watch('payment_method')
  const passwordVal = watch('password')

  // Redirect if no plan state
  useEffect(() => {
    if (state?.plan) return
    const items = readCart()
    setCartItems(items)
    if (items.length === 0) navigate('/menu')
  }, [state, navigate])

  if (!state?.plan && cartItems.length === 0) return null

  const selectedMeals = state?.selectedMeals ?? cartItems
  const plan = state?.plan ?? null
  const orderTitle = plan?.name ?? 'Selected meals'
  const totalItems = selectedMeals.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = plan?.price ?? selectedMeals.reduce((sum, item) => {
    const price = getMealPrice(item.meal as Meal)
    return sum + (price ?? 0) * item.quantity
  }, 0)

  // Min delivery date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function onSubmit(data: CheckoutForm) {
    setSubmitting(true)
    setSubmitError(null)

    try {
      let userId: string | null = user?.id ?? null

      // Optional account creation
      if (data.create_account && !user) {
        const { error: signUpError } = await signUp(data.email, data.password, data.full_name)
        if (signUpError) {
          setSubmitError(signUpError.message ?? 'Account creation failed. Please try again.')
          setSubmitting(false)
          return
        }
        // userId will be set after signUp; in demo mode it's handled in AuthContext
        // For real Supabase, user may need email verification before we can link user_id
        // We proceed with null user_id here to allow guest order to be placed immediately
      }

      const { order, error } = await createOrder({
        user_id: userId,
        customer_name: data.full_name,
        customer_email: data.email,
        customer_phone: data.phone,
        delivery_address_line: data.delivery_address,
        city: data.city,
        nearest_landmark: data.nearest_landmark || undefined,
        preferred_delivery_date: data.preferred_delivery_date,
        preferred_delivery_time: data.preferred_delivery_time,
        special_instructions: data.special_instructions || undefined,
        meal_plan_id: plan?.id,
        meal_plan_name: orderTitle,
        total_amount: totalAmount,
        payment_method: data.payment_method,
        items: selectedMeals.map(sm => ({
          meal_id: sm.meal.id,
          meal_name: sm.meal.name,
          meal_category: sm.meal.category || sm.meal.meal_type,
          quantity: sm.quantity,
          calories: sm.meal.calories,
          price: getMealPrice(sm.meal as Meal) ?? undefined,
        })),
      })

      if (error || !order) {
        setSubmitError(error ?? 'Failed to place order. Please try again.')
        setSubmitting(false)
        return
      }

      if (!plan) clearCart()
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } })
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link
            to="/menu"
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary text-sm transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="flex items-center gap-2 ml-auto text-xs text-gray-400">
            <ShieldCheck size={14} className="text-gold" />
            Secure checkout
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-2xl font-bold text-primary mb-6">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-8 items-start flex-col lg:flex-row">
            {/* Left: form */}
            <div className="flex-1 space-y-6 min-w-0 w-full">

              {/* Customer details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <User size={17} className="text-gold" />
                  <h2 className="font-semibold text-gray-900">Your Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Full Name *"
                      placeholder="e.g. Nimal Perera"
                      error={errors.full_name?.message}
                      {...register('full_name', { required: 'Full name is required' })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Mobile Number *"
                      type="tel"
                      placeholder="e.g. 077 123 4567"
                      error={errors.phone?.message}
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9+\s\-()]{7,15}$/,
                          message: 'Enter a valid phone number',
                        },
                      })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Email Address *"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email?.message}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email address',
                        },
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin size={17} className="text-gold" />
                  <h2 className="font-semibold text-gray-900">Delivery Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Delivery Address *"
                      placeholder="House/Flat No., Street, Road"
                      error={errors.delivery_address?.message}
                      {...register('delivery_address', { required: 'Delivery address is required' })}
                    />
                  </div>
                  <div>
                    <Input
                      label="City / Area *"
                      placeholder="e.g. Colombo 7"
                      error={errors.city?.message}
                      {...register('city', { required: 'City / area is required' })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Nearest Landmark"
                      placeholder="e.g. Near Liberty Plaza"
                      {...register('nearest_landmark')}
                    />
                  </div>
                  <div>
                    <Input
                      label="Preferred Delivery Date *"
                      type="date"
                      min={minDate}
                      error={errors.preferred_delivery_date?.message}
                      {...register('preferred_delivery_date', { required: 'Please select a delivery date' })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Preferred Time Slot *</label>
                    <select
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-gold/30 bg-white ${
                        errors.preferred_delivery_time ? 'border-red-400' : 'border-gray-200 focus:border-gold'
                      }`}
                      {...register('preferred_delivery_time', { required: 'Please select a time slot' })}
                    >
                      <option value="">Select a time slot</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.preferred_delivery_time && (
                      <p className="text-xs text-red-500">{errors.preferred_delivery_time.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Special Instructions"
                      placeholder="Allergies, gate code, building access, any other notes..."
                      rows={3}
                      {...register('special_instructions')}
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CreditCard size={17} className="text-gold" />
                  <h2 className="font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: Banknote },
                    { value: 'bank_transfer', label: 'Bank Transfer', desc: 'Transfer before delivery. Admin will confirm.', icon: CreditCard },
                  ].map(pm => (
                    <label
                      key={pm.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === pm.value
                          ? 'border-gold bg-light-olive/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={pm.value}
                        className="mt-0.5 accent-gold"
                        {...register('payment_method')}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <pm.icon size={15} className="text-gold" />
                          <span className="font-medium text-gray-900 text-sm">{pm.label}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">{pm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-sky-800 mb-1">Bank Transfer Details</p>
                    <p className="text-sky-700">Bank: Commercial Bank of Ceylon</p>
                    <p className="text-sky-700">Account Name: NutriGo Pvt Ltd</p>
                    <p className="text-sky-700">Account No: 1234567890</p>
                    <p className="text-sky-700 mt-1 text-xs">Please use your order number as the reference. Your order will be confirmed once payment is verified.</p>
                    {/* TODO: Integrate real payment gateway or automated bank transfer verification in phase 2 */}
                  </div>
                )}
              </div>

              {/* Optional account creation */}
              {!user && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={17} className="text-gold" />
                    <h2 className="font-semibold text-gray-900">Create an Account (Optional)</h2>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-gold w-4 h-4"
                      {...register('create_account')}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Create an account for faster ordering next time
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Your details and order history will be saved to your account.
                      </p>
                    </div>
                  </label>

                  {createAccount && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <Input
                          label="Password *"
                          type="password"
                          placeholder="Min 8 characters"
                          error={errors.password?.message}
                          {...register('password', {
                            required: createAccount ? 'Password is required' : false,
                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                          })}
                        />
                      </div>
                      <div>
                        <Input
                          label="Confirm Password *"
                          type="password"
                          placeholder="Repeat password"
                          error={errors.confirm_password?.message}
                          {...register('confirm_password', {
                            required: createAccount ? 'Please confirm your password' : false,
                            validate: val => !createAccount || val === passwordVal || 'Passwords do not match',
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-0.5 accent-gold w-4 h-4"
                  {...register('terms', { required: 'You must accept the terms to continue' })}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                  I agree to the{' '}
                  <span className="text-gold hover:underline cursor-pointer">Terms & Conditions</span>{' '}
                  and{' '}
                  <span className="text-gold hover:underline cursor-pointer">Privacy Policy</span>.
                </label>
              </div>
              {errors.terms && <p className="text-xs text-red-500 -mt-4">{errors.terms.message}</p>}

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Submit (mobile) */}
              <div className="lg:hidden">
                <Button fullWidth size="lg" type="submit" loading={submitting}>
                  Place Order
                </Button>
              </div>
            </div>

            {/* Right: order summary */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Order Summary</h3>

                <div className="bg-light-olive/50 rounded-xl p-4">
                  <p className="font-semibold text-primary">{orderTitle}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {plan ? 'Meal selection order' : 'Cart checkout'}
                  </p>
                </div>

                {/* Selected meals */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Selected Meals ({totalItems})
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {selectedMeals.map(({ meal, quantity }) => (
                      <div key={meal.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 truncate">{meal.name}</p>
                          <p className="text-gray-400 text-xs capitalize">
                            {meal.category || meal.meal_type}
                            {' · '}
                            {formatMealCalories(meal as Meal)}
                          </p>
                        </div>
                        <span className="text-gray-500 text-xs ml-2">×{quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Items total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary text-base pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <Button fullWidth size="lg" type="submit" loading={submitting}>
                    Place Order
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                  <ShieldCheck size={13} />
                  Your information is safe and secure
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
