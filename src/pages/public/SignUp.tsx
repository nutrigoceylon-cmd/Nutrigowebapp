import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { BrandLogo } from '../../components/layout/BrandLogo'

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  goal: z.enum(['weight_loss', 'muscle_gain', 'healthy_lifestyle']),
  terms: z.boolean().refine(v => v, 'You must agree to the terms'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const goals = [
  { value: 'weight_loss', label: 'Weight Loss', emoji: '🎯', desc: 'Shed excess weight through calorie-controlled, satisfying meals.' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', desc: 'High-protein meals engineered for muscle growth and recovery.' },
  { value: 'healthy_lifestyle', label: 'Healthy Lifestyle', emoji: '🌿', desc: 'Balanced nutrition for energy, wellness, and longevity.' },
]

const perks = ['7-day free trial', 'Cancel anytime', 'No hidden fees', 'Nutritionist support']

export function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { goal: 'healthy_lifestyle', terms: false },
  })

  const selectedGoal = watch('goal')

  async function onSubmit(data: FormData) {
    setServerError('')
    const { error } = await signUp(data.email, data.password, data.fullName)
    if (error) {
      setServerError('Something went wrong. Please try again.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200" alt="" className="w-full h-full object-cover opacity-15" />
        </div>
        <div className="relative text-center">
          <div className="flex justify-center mb-8">
            <div className="rounded-3xl bg-white px-5 py-4 shadow-lg">
              <BrandLogo imageClassName="h-14 w-auto" />
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Start Your Journey</h2>
          <p className="text-white/60 text-base mb-10 max-w-xs">
            Join thousands who've transformed their health with nutritionist-designed meals and expert support.
          </p>
          <div className="space-y-3">
            {perks.map(perk => (
              <div key={perk} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                {perk}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-6 py-10">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8">
            <BrandLogo imageClassName="h-12 w-auto" />
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-6">
            <ArrowLeft size={15} /> Back to Home
          </Link>

          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-gold font-medium hover:text-gold-dark">Sign in</Link>
          </p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                <input
                  {...register('fullName')}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repeat password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Goal */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">Your Primary Goal</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {goals.map(goal => (
                  <label
                    key={goal.value}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      selectedGoal === goal.value
                        ? 'border-gold bg-gold/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={goal.value}
                      {...register('goal')}
                      className="sr-only"
                    />
                    <span className="text-2xl">{goal.emoji}</span>
                    <span className="font-semibold text-sm text-gray-900">{goal.label}</span>
                    <span className="text-xs text-gray-400 leading-relaxed">{goal.desc}</span>
                    {selectedGoal === goal.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-gold"
              />
              <span className="text-sm text-gray-500">
                I agree to NutriGo's{' '}
                <a href="#" className="text-gold hover:text-gold-dark">Terms of Service</a> and{' '}
                <a href="#" className="text-gold hover:text-gold-dark">Privacy Policy</a>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}

            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
