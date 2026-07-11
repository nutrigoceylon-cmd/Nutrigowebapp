import type { Meal } from '../types'
import { getMealPrice } from './meals'

const CART_STORAGE_KEY = 'nutrigo_cart_v1'
const ADD_ONS_STORAGE_KEY = 'nutrigo_add_ons_v1'
export const CART_UPDATED_EVENT = 'nutrigo-cart-updated'

export interface CartMealSnapshot {
  id: string
  name: string
  meal_type: string
  category?: string
  calories: number
  calories_min?: number | null
  calories_max?: number | null
  price?: number | null
  discount_price?: number | null
  image_url?: string
  prep_time?: number
}

export interface CartItem {
  meal: CartMealSnapshot
  quantity: number
}

export interface AddOnSnapshot {
  id: string
  name: string
  price: number
  image_url?: string | null
}

export interface SelectedAddOnItem {
  addon: AddOnSnapshot
  quantity: number
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeMeal(meal: Meal): CartMealSnapshot {
  return {
    id: meal.id,
    name: meal.name,
    meal_type: meal.meal_type,
    category: meal.category,
    calories: meal.calories,
    calories_min: meal.calories_min ?? null,
    calories_max: meal.calories_max ?? null,
    price: meal.price ?? null,
    discount_price: meal.discount_price ?? null,
    image_url: meal.image_url,
    prep_time: meal.prep_time,
  }
}

export function readCart(): CartItem[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []

    return parsed.filter(item => item?.meal?.id && item.quantity > 0)
  } catch {
    return []
  }
}

export function readSelectedAddOns(): SelectedAddOnItem[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(ADD_ONS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as SelectedAddOnItem[]
    if (!Array.isArray(parsed)) return []

    return parsed.filter(item => item?.addon?.id && item.quantity > 0)
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function writeSelectedAddOns(items: SelectedAddOnItem[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(ADD_ONS_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function addMealToCart(meal: Meal, quantity = 1): CartItem[] {
  const items = readCart()
  const existing = items.find(item => item.meal.id === meal.id)

  if (existing) {
    existing.quantity += quantity
    writeCart(items)
    return items
  }

  const next = [...items, { meal: normalizeMeal(meal), quantity }]
  writeCart(next)
  return next
}

export function updateCartItemQuantity(mealId: string, quantity: number): CartItem[] {
  const next = readCart()
    .map(item => item.meal.id === mealId ? { ...item, quantity } : item)
    .filter(item => item.quantity > 0)

  writeCart(next)
  return next
}

export function removeCartItem(mealId: string): CartItem[] {
  const next = readCart().filter(item => item.meal.id !== mealId)
  writeCart(next)
  return next
}

export function updateSelectedAddOnQuantity(addon: AddOnSnapshot, quantity: number): SelectedAddOnItem[] {
  const current = readSelectedAddOns()
  const next = current
    .filter(item => item.addon.id !== addon.id)

  if (quantity > 0) {
    next.push({ addon, quantity })
  }

  writeSelectedAddOns(next)
  return next
}

export function removeSelectedAddOn(addonId: string): SelectedAddOnItem[] {
  const next = readSelectedAddOns().filter(item => item.addon.id !== addonId)
  writeSelectedAddOns(next)
  return next
}

export function clearCart() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(CART_STORAGE_KEY)
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function clearSelectedAddOns() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(ADD_ONS_STORAGE_KEY)
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function getCartCount(items = readCart()): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartTotal(items = readCart()): number {
  return items.reduce((sum, item) => {
    const price = getMealPrice(item.meal)
    return sum + (price ?? 0) * item.quantity
  }, 0)
}

export function getSelectedAddOnsCount(items = readSelectedAddOns()): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getSelectedAddOnsTotal(items = readSelectedAddOns()): number {
  return items.reduce((sum, item) => sum + item.addon.price * item.quantity, 0)
}
