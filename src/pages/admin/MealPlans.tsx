import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Power, X } from 'lucide-react'
import { ImageUpload } from '../../components/ui/ImageUpload'
import type { MealPlan, GoalType, PlanDuration, Meal, MealType } from '../../types'
import { supabase } from '../../lib/supabase'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, getGoalLabel } from '../../lib/helpers'

type PlanFormState = {
  name: string
  description: string
  goal_type: GoalType
  plan_duration: PlanDuration
  price: number
  calories_per_day: number
  image_url: string
}

type MealFormState = {
  name: string
  description: string
  image_url: string
  meal_type: MealType
  day_of_week: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  prep_time: number
  ingredientsText: string
}

const defaultPlanForm: PlanFormState = {
  name: '',
  description: '',
  goal_type: 'healthy_lifestyle',
  plan_duration: 'weekly',
  price: 0,
  calories_per_day: 2000,
  image_url: '',
}

const defaultMealForm: MealFormState = {
  name: '',
  description: '',
  image_url: '',
  meal_type: 'breakfast',
  day_of_week: 1,
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 15,
  fiber: 5,
  prep_time: 20,
  ingredientsText: '',
}

export function AdminMealPlans() {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MealPlan | null>(null)
  const [form, setForm] = useState<PlanFormState>(defaultPlanForm)
  const [activeTab, setActiveTab] = useState<'details' | 'meals'>('details')
  const [planMeals, setPlanMeals] = useState<Meal[]>([])
  const [mealForm, setMealForm] = useState<MealFormState>(defaultMealForm)
  const [addingMeal, setAddingMeal] = useState(false)
  const [savingMeal, setSavingMeal] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('meal_plans').select('*').order('created_at', { ascending: false })
    setPlans(data ?? [])
  }

  async function loadPlanMeals(planId: string) {
    const { data } = await supabase.from('meals').select('*').eq('meal_plan_id', planId).order('meal_type').order('day_of_week')
    setPlanMeals(data ?? [])
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultPlanForm)
    setActiveTab('details')
    setPlanMeals([])
    setAddingMeal(false)
    setModalOpen(true)
  }

  function openEdit(plan: MealPlan) {
    setEditing(plan)
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      goal_type: plan.goal_type,
      plan_duration: plan.plan_duration,
      price: plan.price,
      calories_per_day: plan.calories_per_day,
      image_url: plan.image_url ?? '',
    })
    setActiveTab('details')
    setAddingMeal(false)
    loadPlanMeals(plan.id)
    setModalOpen(true)
  }

  async function handleSave() {
    const payload = { ...form, image_url: form.image_url || null }
    if (editing) {
      await supabase.from('meal_plans').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('meal_plans').insert({ ...payload, is_active: true })
    }
    await load()
    setModalOpen(false)
  }

  async function handleAddMeal() {
    if (!editing || !mealForm.name.trim()) return
    setSavingMeal(true)
    const ingredients = mealForm.ingredientsText.split('\n').map(s => s.trim()).filter(Boolean)
    await supabase.from('meals').insert({
      meal_plan_id: editing.id,
      name: mealForm.name,
      description: mealForm.description,
      image_url: mealForm.image_url || null,
      meal_type: mealForm.meal_type,
      day_of_week: mealForm.day_of_week,
      calories: mealForm.calories,
      protein: mealForm.protein,
      carbs: mealForm.carbs,
      fat: mealForm.fat,
      fiber: mealForm.fiber,
      prep_time: mealForm.prep_time,
      ingredients,
      allergens: [],
      is_active: true,
    })
    await loadPlanMeals(editing.id)
    setMealForm(defaultMealForm)
    setAddingMeal(false)
    setSavingMeal(false)
  }

  async function handleDeleteMeal(mealId: string) {
    if (!confirm('Delete this meal?')) return
    await supabase.from('meals').delete().eq('id', mealId)
    setPlanMeals(prev => prev.filter(m => m.id !== mealId))
  }

  async function toggleActive(id: string) {
    const plan = plans.find(p => p.id === id)
    if (!plan) return
    const is_active = !plan.is_active
    await supabase.from('meal_plans').update({ is_active }).eq('id', id)
    setPlans(prev => prev.map(p => p.id === id ? { ...p, is_active } : p))
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this meal plan?')) {
      await supabase.from('meal_plans').delete().eq('id', id)
      setPlans(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Meal Plans</h1>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> New Plan</Button>
      </div>

      <Table
        columns={[
          {
            key: 'name', label: 'Plan',
            render: p => (
              <div className="flex items-center gap-3">
                {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.calories_per_day} cal/day</p>
                </div>
              </div>
            ),
          },
          { key: 'goal_type', label: 'Goal', render: p => <span className="text-sm text-gray-600">{getGoalLabel(p.goal_type)}</span> },
          { key: 'plan_duration', label: 'Duration', render: p => <span className="text-sm text-gray-600 capitalize">{p.plan_duration}</span> },
          { key: 'price', label: 'Price', render: p => <span className="font-semibold text-primary">{formatCurrency(p.price)}</span> },
          { key: 'is_active', label: 'Status', render: p => <StatusBadge status={p.is_active ? 'active' : 'cancelled'} /> },
          {
            key: 'actions', label: '',
            render: p => (
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors cursor-pointer"><Pencil size={14} /></button>
                <button onClick={() => toggleActive(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gold transition-colors cursor-pointer"><Power size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
        data={plans}
        keyExtractor={p => p.id}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Meal Plan' : 'New Meal Plan'} size="lg">

        {/* Tabs — only visible when editing an existing plan */}
        {editing && (
          <div className="flex border-b border-gray-200 -mt-1 mb-5">
            {(['details', 'meals'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer capitalize ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'meals' ? `Meals (${planMeals.length})` : 'Plan Details'}
              </button>
            ))}
          </div>
        )}

        {/* ── Plan Details Tab ── */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <ImageUpload
              label="Cover Image"
              value={form.image_url}
              onChange={url => setForm(f => ({ ...f, image_url: url }))}
            />
            <Input
              label="Plan Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Power Builder"
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
                placeholder="Plan description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Goal Type"
                value={form.goal_type}
                onChange={e => setForm(f => ({ ...f, goal_type: e.target.value as GoalType }))}
                options={[
                  { value: 'weight_loss', label: 'Weight Loss' },
                  { value: 'muscle_gain', label: 'Muscle Gain' },
                  { value: 'healthy_lifestyle', label: 'Healthy Lifestyle' },
                ]}
              />
              <Select
                label="Duration"
                value={form.plan_duration}
                onChange={e => setForm(f => ({ ...f, plan_duration: e.target.value as PlanDuration }))}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (LKR)"
                type="number"
                value={String(form.price)}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              />
              <Input
                label="Calories / Day"
                type="number"
                value={String(form.calories_per_day)}
                onChange={e => setForm(f => ({ ...f, calories_per_day: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancel</Button>
              <Button onClick={handleSave} fullWidth>{editing ? 'Save Changes' : 'Create Plan'}</Button>
            </div>
          </div>
        )}

        {/* ── Meals Tab ── */}
        {activeTab === 'meals' && (
          <div className="space-y-4">

            {/* Existing meals */}
            {planMeals.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {planMeals.map(meal => (
                  <div key={meal.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{meal.meal_type} · Day {meal.day_of_week} · {meal.calories} cal</p>
                      {meal.ingredients?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {meal.ingredients.slice(0, 2).join(', ')}{meal.ingredients.length > 2 ? ` +${meal.ingredients.length - 2} more` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {planMeals.length === 0 && !addingMeal && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">🥗</p>
                <p className="text-sm">No meals added to this plan yet</p>
              </div>
            )}

            {/* Add meal inline form */}
            {addingMeal ? (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-800">New Meal</p>
                  <button onClick={() => setAddingMeal(false)} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>

                <Input
                  label="Meal Name"
                  value={mealForm.name}
                  onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Turkey Spinach Wrap"
                />

                <ImageUpload
                  label="Meal Image (optional)"
                  value={mealForm.image_url}
                  onChange={url => setMealForm(f => ({ ...f, image_url: url }))}
                />

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description (optional)</label>
                  <textarea
                    value={mealForm.description}
                    onChange={e => setMealForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Ingredients <span className="text-gray-400 font-normal">(one per line)</span></label>
                  <textarea
                    value={mealForm.ingredientsText}
                    onChange={e => setMealForm(f => ({ ...f, ingredientsText: e.target.value }))}
                    rows={5}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
                    placeholder={"1 large whole-wheat tortilla\n3–4 slices lean turkey breast\n1 cup fresh baby spinach\n2 tbsp Greek yogurt dressing\nSliced cucumber or tomato"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Meal Type"
                    value={mealForm.meal_type}
                    onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value as MealType }))}
                    options={[
                      { value: 'breakfast', label: 'Breakfast' },
                      { value: 'lunch', label: 'Lunch' },
                      { value: 'dinner', label: 'Dinner' },
                      { value: 'snack', label: 'Snack' },
                    ]}
                  />
                  <Select
                    label="Day of Week"
                    value={String(mealForm.day_of_week)}
                    onChange={e => setMealForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                    options={[1,2,3,4,5,6,7].map(d => ({
                      value: String(d),
                      label: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d-1],
                    }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input label="Calories" type="number" value={String(mealForm.calories)} onChange={e => setMealForm(f => ({ ...f, calories: Number(e.target.value) }))} />
                  <Input label="Protein (g)" type="number" value={String(mealForm.protein)} onChange={e => setMealForm(f => ({ ...f, protein: Number(e.target.value) }))} />
                  <Input label="Carbs (g)" type="number" value={String(mealForm.carbs)} onChange={e => setMealForm(f => ({ ...f, carbs: Number(e.target.value) }))} />
                  <Input label="Fat (g)" type="number" value={String(mealForm.fat)} onChange={e => setMealForm(f => ({ ...f, fat: Number(e.target.value) }))} />
                  <Input label="Fiber (g)" type="number" value={String(mealForm.fiber)} onChange={e => setMealForm(f => ({ ...f, fiber: Number(e.target.value) }))} />
                  <Input label="Prep (min)" type="number" value={String(mealForm.prep_time)} onChange={e => setMealForm(f => ({ ...f, prep_time: Number(e.target.value) }))} />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setAddingMeal(false)} fullWidth>Cancel</Button>
                  <Button onClick={handleAddMeal} fullWidth disabled={!mealForm.name.trim() || savingMeal}>
                    {savingMeal ? 'Saving…' : 'Add Meal'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                fullWidth
                onClick={() => { setMealForm(defaultMealForm); setAddingMeal(true) }}
              >
                <Plus size={15} /> Add Meal to This Plan
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
