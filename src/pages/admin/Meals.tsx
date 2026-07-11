import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import type { Meal } from '../../types'
import { supabase } from '../../lib/supabase'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { ImageUpload } from '../../components/ui/ImageUpload'
import {
  deriveMealCategory,
  deriveMealTypeFromCategory,
  formatMealCalories,
  getMealCategoryLabel,
  getMealPrice,
  hasMealDiscount,
  mealCategories,
} from '../../lib/meals'
import { formatCurrency } from '../../lib/helpers'

type FormState = {
  name: string
  category: string
  description: string
  image_url: string
  price: string
  discount_price: string
  calories_min: string
  calories_max: string
  protein: string
  carbs: string
  fat: string
  fiber: string
  prep_time: string
  ingredientsText: string
}

const defaultForm: FormState = {
  name: '',
  category: 'mains',
  description: '',
  image_url: '',
  price: '',
  discount_price: '',
  calories_min: '350',
  calories_max: '450',
  protein: '30',
  carbs: '40',
  fat: '15',
  fiber: '5',
  prep_time: '20',
  ingredientsText: '',
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function AdminMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Meal | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('meals').select('*').order('created_at', { ascending: false })
    setMeals(data ?? [])
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(meal: Meal) {
    setEditing(meal)
    setForm({
      name: meal.name,
      category: deriveMealCategory(meal),
      description: meal.description ?? '',
      image_url: meal.image_url ?? '',
      price: meal.price != null ? String(meal.price) : '',
      discount_price: meal.discount_price != null ? String(meal.discount_price) : '',
      calories_min: String(meal.calories_min ?? meal.calories),
      calories_max: String(meal.calories_max ?? meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fat: String(meal.fat),
      fiber: String(meal.fiber ?? 0),
      prep_time: String(meal.prep_time ?? 0),
      ingredientsText: (meal.ingredients ?? []).join('\n'),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const ingredients = form.ingredientsText.split('\n').map(s => s.trim()).filter(Boolean)
    const caloriesMin = toNullableNumber(form.calories_min) ?? 0
    const caloriesMax = toNullableNumber(form.calories_max) ?? caloriesMin
    const price = toNullableNumber(form.price)
    const discountPrice = toNullableNumber(form.discount_price)
    const normalizedDiscount = price != null && discountPrice != null && discountPrice < price ? discountPrice : null

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      meal_plan_id: null,
      meal_type: deriveMealTypeFromCategory(form.category),
      day_of_week: 1,
      calories: Math.round((caloriesMin + caloriesMax) / 2),
      calories_min: caloriesMin,
      calories_max: caloriesMax,
      price,
      discount_price: normalizedDiscount,
      protein: toNullableNumber(form.protein) ?? 0,
      carbs: toNullableNumber(form.carbs) ?? 0,
      fat: toNullableNumber(form.fat) ?? 0,
      fiber: toNullableNumber(form.fiber) ?? 0,
      prep_time: toNullableNumber(form.prep_time) ?? 0,
      ingredients,
    }

    if (editing) {
      await supabase.from('meals').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('meals').insert({ ...payload, allergens: [], is_active: true })
    }

    await load()
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this meal?')) {
      await supabase.from('meals').delete().eq('id', id)
      setMeals(prev => prev.filter(meal => meal.id !== id))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-500 mt-1">Phase one setup: manage individual meals only.</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> Add Meal</Button>
      </div>

      <Table
        columns={[
          {
            key: 'name',
            label: 'Meal',
            render: meal => (
              <div className="flex items-center gap-3">
                {meal.image_url && <img src={meal.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium text-gray-900">{meal.name}</p>
                  <p className="text-xs text-gray-400">{getMealCategoryLabel(deriveMealCategory(meal))}</p>
                  {meal.ingredients?.length > 0 && (
                    <p className="text-xs text-gray-300 mt-0.5">{meal.ingredients.length} ingredients</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'pricing',
            label: 'Pricing',
            render: meal => {
              const displayPrice = getMealPrice(meal)
              return (
                <div className="text-sm">
                  {displayPrice != null ? (
                    <>
                      <p className="font-semibold text-primary">{formatCurrency(displayPrice)}</p>
                      {hasMealDiscount(meal) && meal.price != null && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(meal.price)}</p>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">No price</span>
                  )}
                </div>
              )
            },
          },
          {
            key: 'calories',
            label: 'Calories',
            render: meal => <span className="text-sm text-gray-600">{formatMealCalories(meal)}</span>,
          },
          {
            key: 'macros',
            label: 'Nutrition',
            render: meal => (
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>{meal.protein}P · {meal.carbs}C · {meal.fat}F</p>
                <p>{meal.fiber}g fiber</p>
              </div>
            ),
          },
          {
            key: 'prep_time',
            label: 'Prep',
            render: meal => <span className="text-sm text-gray-600">{meal.prep_time} min</span>,
          },
          {
            key: 'actions',
            label: '',
            render: meal => (
              <div className="flex gap-2">
                <button onClick={() => openEdit(meal)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors cursor-pointer"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(meal.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
        data={meals}
        keyExtractor={meal => meal.id}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Meal' : 'Add Meal'} size="lg">
        <div className="space-y-4">
          <Input label="Meal Name" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} />
          <ImageUpload
            label="Meal Image"
            value={form.image_url}
            onChange={url => setForm(current => ({ ...current, image_url: url }))}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(current => ({ ...current, description: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Ingredients <span className="text-gray-400 font-normal">(one per line)</span></label>
            <textarea
              value={form.ingredientsText}
              onChange={e => setForm(current => ({ ...current, ingredientsText: e.target.value }))}
              rows={5}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm(current => ({ ...current, category: e.target.value }))}
              options={mealCategories.filter(category => category.value !== 'all').map(category => ({ value: category.value, label: category.label }))}
            />
            <Input
              label="Prep Time (min)"
              type="number"
              value={form.prep_time}
              onChange={e => setForm(current => ({ ...current, prep_time: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Regular Price (LKR)"
              type="number"
              value={form.price}
              onChange={e => setForm(current => ({ ...current, price: e.target.value }))}
            />
            <Input
              label="Discount Price (optional)"
              type="number"
              value={form.discount_price}
              onChange={e => setForm(current => ({ ...current, discount_price: e.target.value }))}
              helperText="Only set this when the meal is on discount."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Calories Min"
              type="number"
              value={form.calories_min}
              onChange={e => setForm(current => ({ ...current, calories_min: e.target.value }))}
            />
            <Input
              label="Calories Max"
              type="number"
              value={form.calories_max}
              onChange={e => setForm(current => ({ ...current, calories_max: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Protein (g)" type="number" value={form.protein} onChange={e => setForm(current => ({ ...current, protein: e.target.value }))} />
            <Input label="Carbs (g)" type="number" value={form.carbs} onChange={e => setForm(current => ({ ...current, carbs: e.target.value }))} />
            <Input label="Fat (g)" type="number" value={form.fat} onChange={e => setForm(current => ({ ...current, fat: e.target.value }))} />
            <Input label="Fiber (g)" type="number" value={form.fiber} onChange={e => setForm(current => ({ ...current, fiber: e.target.value }))} />
          </div>

          <div className="rounded-2xl border border-light-green bg-light-green/50 px-4 py-3 text-sm text-primary">
            <div className="flex items-center gap-2 font-medium mb-1">
              <Tag size={16} />
              Card preview behavior
            </div>
            <p>When a discount price is available, the meal card will show the discounted price and strike through the regular price.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancel</Button>
            <Button onClick={handleSave} fullWidth disabled={!form.name.trim() || !form.price.trim()}>{editing ? 'Save Changes' : 'Add Meal'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
