export type GoalType = 'weight_loss' | 'muscle_gain' | 'healthy_lifestyle'
export type UserRole = 'user' | 'admin' | 'nutritionist'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type PlanDuration = 'daily' | 'weekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
export type EventType = 'workshop' | 'webinar' | 'cooking_class' | 'fitness_session' | 'nutrition_talk'
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type ContactStatus = 'new' | 'read' | 'replied'

// ─── Guest Checkout / Order Flow ───────────────────────────────────────────
export type NutriOrderStatus =
  | 'order_received'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type NutriPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DeliveryStatus =
  | 'not_assigned'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'

export type PaymentMethod = 'cash_on_delivery' | 'bank_transfer'

export interface NutriOrderItem {
  id: string
  order_id: string
  meal_id?: string | null
  meal_name: string
  meal_category: string
  quantity: number
  delivery_date?: string
  calories?: number
  price?: number
  created_at: string
}

export interface NutriOrder {
  id: string
  order_number: string
  user_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address_line: string
  city: string
  nearest_landmark?: string
  preferred_delivery_date: string
  preferred_delivery_time: string
  special_instructions?: string
  meal_plan_id?: string | null
  meal_plan_name: string
  total_amount: number
  payment_method: PaymentMethod
  checkout_payment_status: NutriPaymentStatus
  checkout_status: NutriOrderStatus
  delivery_status: DeliveryStatus
  admin_note?: string
  created_at: string
  updated_at: string
  items?: NutriOrderItem[]
  status_history?: OrderStatusHistoryEntry[]
}

export interface OrderStatusHistoryEntry {
  id: string
  order_id: string
  status: string
  note?: string
  updated_by?: string
  created_at: string
}

export interface CreateOrderInput {
  user_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address_line: string
  city: string
  nearest_landmark?: string
  preferred_delivery_date: string
  preferred_delivery_time: string
  special_instructions?: string
  meal_plan_id?: string
  meal_plan_name: string
  total_amount: number
  payment_method: PaymentMethod
  items: {
    meal_id?: string
    meal_name: string
    meal_category: string
    quantity: number
    calories?: number
    price?: number
  }[]
}

export interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  phone?: string
  dob?: string
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  activity_level?: ActivityLevel
  dietary_preferences?: string[]
  allergens?: string[]
  goal?: GoalType
  role: UserRole
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  name: string
  description: string
  goal_type: GoalType
  plan_duration: PlanDuration
  price: number
  calories_per_day: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  meals?: Meal[]
}

export interface Meal {
  id: string
  meal_plan_id?: string | null
  name: string
  category?: string
  description: string
  image_url?: string
  calories: number
  calories_min?: number | null
  calories_max?: number | null
  price?: number | null
  discount_price?: number | null
  protein: number
  carbs: number
  fat: number
  fiber: number
  ingredients: string[]
  allergens: string[]
  meal_type: MealType
  day_of_week: number
  prep_time: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AddOn {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  meal_plan_id: string
  status: SubscriptionStatus
  start_date: string
  end_date: string
  delivery_address: DeliveryAddress
  delivery_time_slot: string
  created_at: string
  updated_at: string
  profile?: Profile
  meal_plan?: MealPlan
}

export interface DeliveryAddress {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export interface Order {
  id: string
  user_id: string
  subscription_id: string
  status: OrderStatus
  delivery_date: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  notes?: string
  created_at: string
  updated_at: string
  profile?: Profile
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  meal_id: string
  quantity: number
  special_instructions?: string
  meal?: Meal
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  author_id: string
  image_url?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Podcast {
  id: string
  title: string
  description: string
  audio_url: string
  duration: number
  episode_number: number
  show_notes?: string
  transcript?: string
  image_url?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  start_date: string
  end_date: string
  location?: string
  is_virtual: boolean
  max_attendees: number
  image_url?: string
  status: EventStatus
  created_at: string
  updated_at: string
  registrations?: EventRegistration[]
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  attendee_age?: number | null
  attendee_gender?: 'male' | 'female' | 'other' | null
  status: 'registered' | 'cancelled' | 'attended'
  created_at: string
  profile?: Profile
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  created_at: string
}

export interface NutritionLog {
  id: string
  user_id: string
  log_date: string
  meal_type: MealType
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water_ml?: number
  notes?: string
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  log_date: string
  weight: number
  body_fat_percentage?: number
  notes?: string
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  log_date: string
  workout_type: string
  duration_minutes: number
  calories_burned?: number
  notes?: string
  created_at: string
}

export type ProviderSpecialty = string
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface ProviderCategory {
  slug: string
  label: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Provider {
  id: string
  name: string
  title: string
  specialty: ProviderSpecialty
  bio?: string
  image_url?: string
  session_price: number
  session_duration: number
  available_days: number[]
  available_from: string
  available_to: string
  languages: string[]
  qualifications: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SessionBooking {
  id: string
  provider_id: string
  user_id: string
  booking_date: string
  start_time: string
  session_type: string
  status: BookingStatus
  notes?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  meeting_link?: string
  created_at: string
  updated_at: string
  provider?: Provider
  profile?: Profile
}
