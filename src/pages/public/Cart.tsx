import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { AddOn } from '../../types'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { buildWhatsAppUrl } from '../../lib/site'
import {
  CART_UPDATED_EVENT,
  getCartCount,
  getCartTotal,
  getSelectedAddOnsCount,
  getSelectedAddOnsTotal,
  readCart,
  readSelectedAddOns,
  removeCartItem,
  removeSelectedAddOn,
  type CartItem,
  type SelectedAddOnItem,
  updateCartItemQuantity,
  updateSelectedAddOnQuantity,
} from '../../lib/cart'
import { deriveMealCategory, formatMealCalories, getMealCategoryLabel, getMealPrice } from '../../lib/meals'
import { formatCurrency } from '../../lib/helpers'

export function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItem[]>([])
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([])

  function refreshCart() {
    setItems(readCart())
    setSelectedAddOns(readSelectedAddOns())
  }

  useEffect(() => {
    refreshCart()

    const sync = () => refreshCart()
    window.addEventListener('storage', sync)
    window.addEventListener(CART_UPDATED_EVENT, sync)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CART_UPDATED_EVENT, sync)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!supabaseConfigured) return

    async function loadAddOns() {
      const { data } = await supabase.from('add_ons').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (cancelled) return
      setAvailableAddOns(data ?? [])
    }

    loadAddOns()

    return () => {
      cancelled = true
    }
  }, [])

  function changeQuantity(mealId: string, nextQuantity: number) {
    updateCartItemQuantity(mealId, nextQuantity)
    refreshCart()
  }

  function removeItem(mealId: string) {
    removeCartItem(mealId)
    refreshCart()
  }

  function changeAddOnQuantity(addOn: AddOn, nextQuantity: number) {
    updateSelectedAddOnQuantity({
      id: addOn.id,
      name: addOn.name,
      price: addOn.price,
      image_url: addOn.image_url,
    }, nextQuantity)
    refreshCart()
  }

  function removeAddOn(addOnId: string) {
    removeSelectedAddOn(addOnId)
    refreshCart()
  }

  const cartCount = getCartCount(items)
  const cartTotal = getCartTotal(items)
  const addOnCount = getSelectedAddOnsCount(selectedAddOns)
  const addOnTotal = getSelectedAddOnsTotal(selectedAddOns)
  const grandTotal = cartTotal + addOnTotal

  function orderCartOnWhatsApp() {
    if (items.length === 0) return

    const itemLines = items.map(item => {
      const category = getMealCategoryLabel(deriveMealCategory({
        name: item.meal.name,
        category: item.meal.category,
        description: '',
        ingredients: [],
      }))
      const price = getMealPrice(item.meal)

      return [
        `- ${item.meal.name} x${item.quantity}`,
        `  Category: ${category}`,
        `  Calories: ${formatMealCalories(item.meal)}`,
        ...(price != null ? [`  Price: ${formatCurrency(price)}`] : []),
      ].join('\n')
    })

    const addOnLines = selectedAddOns.map(item => [
      `- ${item.addon.name} x${item.quantity}`,
      `  Price: ${formatCurrency(item.addon.price)}`,
    ].join('\n'))

    const message = [
      'Hi NutriGo! I would like to place an order from my cart.',
      '',
      '*Cart Items*',
      ...itemLines,
      ...(addOnLines.length > 0 ? ['', '*Add-Ons*', ...addOnLines] : []),
      '',
      '*Cart Summary*',
      `- Total items: ${cartCount}`,
      ...(addOnCount > 0 ? [`- Add-ons selected: ${addOnCount}`] : []),
      ...(grandTotal > 0 ? [`- Estimated total: ${formatCurrency(grandTotal)}`] : []),
      '',
      '*Please share:*',
      '- Delivery availability',
      '- Earliest delivery slot',
      '- Payment options',
      '',
      'Thank you!',
    ].join('\n')

    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-light-olive/30 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/menu"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft size={15} /> Back to Menu
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
              <ShoppingCart size={22} />
            </div>
            <div>
              <p className="text-gold font-semibold text-sm uppercase tracking-widest">Order Details</p>
              <h1 className="font-serif text-3xl font-bold text-primary">View Cart</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-5xl">🛒</p>
            <h2 className="font-serif text-2xl font-bold text-primary">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">Add meals from the menu, then review everything here before ordering on WhatsApp.</p>
            <Link
              to="/menu"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary"
            >
              Browse Meals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-6">
              {items.map(item => {
                const price = getMealPrice(item.meal)
                const lineTotal = price != null ? price * item.quantity : null

                return (
                  <div key={item.meal.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex gap-4">
                      {item.meal.image_url ? (
                        <img src={item.meal.image_url} alt={item.meal.name} className="h-24 w-24 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-light-olive/50 text-4xl">🥗</div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{item.meal.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-light-green px-2 py-0.5 font-medium text-accent">
                                {getMealCategoryLabel(deriveMealCategory({
                                  name: item.meal.name,
                                  category: item.meal.category,
                                  description: '',
                                  ingredients: [],
                                }))}
                          </span>
                              <span className="text-gray-400">{formatMealCalories(item.meal)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.meal.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.meal.id, item.quantity - 1)}
                              className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                            >
                              <Minus size={16} />
                            </button>
                            <div className="flex h-10 min-w-12 items-center justify-center border-x border-gray-200 px-4 text-sm font-semibold text-primary">
                              {item.quantity}
                            </div>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.meal.id, item.quantity + 1)}
                              className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="text-right">
                            {price != null ? (
                              <>
                                <p className="text-sm text-gray-400">{formatCurrency(price)} each</p>
                                <p className="font-semibold text-primary">{formatCurrency(lineTotal ?? 0)}</p>
                              </>
                            ) : (
                              <p className="font-medium text-gray-400">Price on request</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-gold font-semibold text-sm uppercase tracking-widest">Cart Only</p>
                    <h2 className="font-serif text-2xl font-bold text-primary">Add-Ons</h2>
                    <p className="mt-1 text-sm text-gray-500">Optional extras are available only inside the cart page.</p>
                  </div>
                </div>

                {availableAddOns.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                    No add-ons are published yet.
                  </div>
                ) : (
                  <div className={`space-y-3 ${availableAddOns.length > 5 ? 'max-h-[34rem] overflow-y-auto pr-1' : ''}`}>
                    {availableAddOns.map(addOn => {
                      const selected = selectedAddOns.find(item => item.addon.id === addOn.id)
                      const quantity = selected?.quantity ?? 0

                      return (
                        <div key={addOn.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <div className="flex gap-4">
                            {addOn.image_url ? (
                              <img src={addOn.image_url} alt={addOn.name} className="h-20 w-20 rounded-2xl object-cover" />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-light-green text-3xl text-accent">+</div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{addOn.name}</p>
                                  {addOn.description && <p className="mt-1 text-sm text-gray-500">{addOn.description}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary">{formatCurrency(addOn.price)}</p>
                                  <p className="text-xs text-gray-400">each</p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => changeAddOnQuantity(addOn, quantity - 1)}
                                    className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <div className="flex h-10 min-w-12 items-center justify-center border-x border-gray-200 px-4 text-sm font-semibold text-primary">
                                    {quantity}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => changeAddOnQuantity(addOn, quantity + 1)}
                                    className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>

                                {quantity > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeAddOn(addOn.id)}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                                  >
                                    <Trash2 size={14} /> Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900">Cart Summary</h2>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Total items</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Add-ons</span>
                    <span>{addOnCount}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Meals total</span>
                    <span>{cartTotal > 0 ? formatCurrency(cartTotal) : 'On request'}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Add-ons total</span>
                    <span>{addOnTotal > 0 ? formatCurrency(addOnTotal) : formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-primary">
                    <span>Estimated total</span>
                    <span>{grandTotal > 0 ? formatCurrency(grandTotal) : 'On request'}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-light-green bg-light-green/60 px-4 py-3 text-xs text-gray-600">
                  Review your order details here first. When ready, send the cart through WhatsApp to confirm delivery and payment.
                </div>

                <button
                  type="button"
                  onClick={orderCartOnWhatsApp}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20be5c]"
                >
                  <MessageCircle size={18} />
                  Order via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
