import type { Meal, MealType } from '../types'

export const mealCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'mains', label: 'Mains' },
  { value: 'salads', label: 'Salads' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'sandwiches', label: 'Sandwiches' },
  { value: 'oates-bowls', label: 'Oates Bowls' },
  { value: 'soup', label: 'Soup' },
] as const

export type MealCategoryValue = (typeof mealCategories)[number]['value']

export function normalizeMealCategory(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function getMealCategoryLabel(value: string): string {
  return mealCategories.find(category => category.value === value)?.label ?? 'Mains'
}

export function deriveMealCategory(meal: Pick<Meal, 'category' | 'name' | 'description' | 'ingredients'>): MealCategoryValue {
  if (meal.category?.trim()) {
    const normalized = normalizeMealCategory(meal.category)
    return (mealCategories.find(category => category.value === normalized)?.value ?? 'mains') as MealCategoryValue
  }

  const haystack = [
    meal.name,
    meal.description,
    ...(meal.ingredients ?? []),
  ].join(' ').toLowerCase()

  if (haystack.includes('salad')) return 'salads'
  if (haystack.includes('drink') || haystack.includes('juice') || haystack.includes('smoothie') || haystack.includes('tea') || haystack.includes('coffee')) return 'drinks'
  if (haystack.includes('sandwich') || haystack.includes('wrap') || haystack.includes('burger')) return 'sandwiches'
  if (haystack.includes('oats') || haystack.includes('oat') || haystack.includes('granola') || haystack.includes('bowl')) return 'oates-bowls'
  if (haystack.includes('soup') || haystack.includes('broth')) return 'soup'

  return 'mains'
}

export function deriveMealTypeFromCategory(category: string): MealType {
  switch (normalizeMealCategory(category)) {
    case 'oates-bowls':
      return 'breakfast'
    case 'drinks':
      return 'snack'
    case 'sandwiches':
    case 'salads':
    case 'soup':
    case 'mains':
    default:
      return 'lunch'
  }
}

export function getMealPrice(meal: Pick<Meal, 'price' | 'discount_price'>): number | null {
  if (typeof meal.discount_price === 'number' && typeof meal.price === 'number' && meal.discount_price < meal.price) {
    return meal.discount_price
  }

  return typeof meal.price === 'number' ? meal.price : null
}

export function hasMealDiscount(meal: Pick<Meal, 'price' | 'discount_price'>): boolean {
  return typeof meal.discount_price === 'number' && typeof meal.price === 'number' && meal.discount_price < meal.price
}

export function formatMealCalories(meal: Pick<Meal, 'calories' | 'calories_min' | 'calories_max'>): string {
  const min = meal.calories_min ?? meal.calories
  const max = meal.calories_max ?? meal.calories

  if (typeof min === 'number' && typeof max === 'number' && min !== max) {
    return `${min}-${max} kcal`
  }

  return `${max ?? min ?? meal.calories} kcal`
}
